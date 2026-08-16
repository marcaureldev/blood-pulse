/**
 * Simulation d'un amas de gouttes de sang, exécutée sur CPU.
 *
 * Le modèle est celui d'un liquide, non de corps rigides : les gouttes se
 * pénètrent, se retiennent entre elles et amortissent mutuellement leur
 * vitesse. Trois forces de paire suffisent à le décrire — une répulsion à
 * courte portée qui empêche l'effondrement, une cohésion à moyenne portée qui
 * tient la masse ensemble, et une viscosité qui rapproche les vitesses des
 * voisines. C'est la viscosité qui donne au mouvement son épaisseur ; sans
 * elle, on retombe sur des billes.
 *
 * S'y ajoutent trois sources d'agitation appliquées goutte par goutte : un
 * battement cardiaque, une ébullition haute fréquence et une dérive de fond.
 * Le curseur, lui, agit en dissipateur : il écarte la matière et relâche
 * localement sa cohésion.
 *
 * L'intégration se fait à pas fixe. Un onglet qui reprend le focus après une
 * mise en veille livre un delta de plusieurs secondes ; intégré d'un bloc, il
 * fait diverger la simulation.
 *
 * Le rendu correspondant vit dans `BloodCells.tsx` et ne fait que dessiner
 * l'état produit ici.
 */

/** Nombre de gouttes. Fixe la taille du tampon d'uniforms côté shader. */
export const CELL_COUNT = 12

/** Pas d'intégration, en secondes. 120 Hz : stable sans coûter cher. */
const FIXED_STEP = 1 / 120

/** Retard maximal rattrapé en une frame, en secondes. Au-delà, on l'abandonne. */
const MAX_ACCUMULATED = 0.25

/**
 * Molette d'intensité globale de l'agitation, 1 valant le réglage de référence.
 *
 * Elle multiplie les trois forces d'agitation **et** le plafond de vitesse, et
 * les deux doivent rester solidaires : monter la turbulence seule fait buter
 * les gouttes contre le plafond, où elles filent toutes à la même vitesse
 * exacte — le mouvement devient alors uniforme, soit l'inverse de l'effet
 * recherché. La rigidité de paroi suit pour la même raison : sans elle, la
 * périphérie traverse la paroi souple et retombe sur le clamp dur, qui rabote
 * la silhouette en cercle.
 *
 * Au-delà de 4 environ, le gain cesse de se voir : l'amas est alors contraint
 * par le rayon de la paroi et non par les forces.
 */
export const INTENSITY = 0.5

/** Raideur du ressort qui ramène chaque goutte vers le centre de la scène. */
const ATTRACTOR_STRENGTH = 2.1

/* --- Battement et ébullition ---------------------------------------------- */

/** Période du battement, en secondes. 0,55 s ≈ 109 pulsations : un cœur à l'effort. */
const BEAT_PERIOD = 0.55

/** Poussée radiale appliquée sur le pic systolique. */
const PULSE_PUSH = 26 * INTENSITY

/** Sur-rappel vers le centre pendant la diastole : c'est la phase de recul. */
const PULSE_RECOIL = 1.1

/** Turbulence haute fréquence : l'agitation de surface, le « bouillonnement ». */
const BOIL_STRENGTH = 60 * INTENSITY

/**
 * Enveloppe cardiaque sur un cycle.
 *
 * Deux gaussiennes — le « toum » franc puis le « ta » plus bref — suivies d'un
 * long temps mort. Une sinusoïde donnerait le halètement régulier d'un
 * métronome ; c'est l'asymétrie des deux pics et le silence qui les sépare qui
 * font lire un cœur plutôt qu'une respiration.
 *
 * @param elapsed Temps de scène écoulé, en secondes.
 * @returns Amplitude du battement dans `[0, 1]`, 1 au pic systolique.
 */
export function heartbeat(elapsed: number): number {
  const phase = (elapsed % BEAT_PERIOD) / BEAT_PERIOD
  const lub = Math.exp(-((phase - 0.06) ** 2) / 0.0030)
  const dub = 0.52 * Math.exp(-((phase - 0.21) ** 2) / 0.0022)
  return Math.min(1, lub + dub)
}

/**
 * Fraction de vitesse conservée après une seconde. Plus marquée que pour des
 * corps solides : un liquide visqueux dissipe vite. La dérive entretenue
 * compense, de sorte que la masse ne se fige jamais complètement.
 */
const DAMPING_PER_SECOND = 0.80

/** Dérive entretenue : c'est elle qui fait couler la masse au repos. */
const DRIFT_STRENGTH = 7.5 * INTENSITY

/** Rayon de référence servant à normaliser les masses autour de 1. */
const REFERENCE_RADIUS = 0.26

/**
 * Distance d'équilibre entre deux gouttes, en fraction de la somme de leurs
 * rayons. En dessous de 1, elles se chevauchent en permanence — et c'est ce
 * recouvrement qui laisse le lissage du shader les fondre en une seule masse.
 */
const REST_OVERLAP = 0.82

/** Portée de la cohésion, toujours en fraction de la somme des rayons. */
const COHESION_RANGE = 1.15

/** Raideur de la répulsion, active en deçà de la distance d'équilibre. */
const REPULSION = 90

/** Intensité de la cohésion, active au-delà de la distance d'équilibre. */
const COHESION = 4.0

/** Amortissement de la vitesse relative entre voisines. Le terme « visqueux ». */
const VISCOSITY = 3

/* --- Curseur --------------------------------------------------------------- */

/** Rayon d'influence du curseur, en unités de scène. */
const POINTER_RADIUS = 2.2

/**
 * Force d'écartement radial exercée par le curseur.
 *
 * Elle ne suffit pas à elle seule : pousser une matière cohésive revient à
 * lutter contre un rappel qui la ramène aussitôt. C'est le relâchement des
 * liens ({@link POINTER_UNBIND}) qui rend la dispersion visible, la poussée ne
 * fait qu'ouvrir le vide une fois les liens rompus.
 */
const POINTER_SPREAD = 80

/**
 * Part d'agitation retirée sous le curseur, dans `[0, 1]`.
 *
 * Nulle par choix : le curseur disperse dans l'espace, il n'endort pas. Les
 * gouttes écartées gardent toute leur activité et la cohésion les rassemble une
 * fois le curseur parti. Monter cette valeur ferait retomber le bouillonnement
 * là où passe le pointeur.
 */
const POINTER_CALM = 0

/** Part de cohésion rompue sous le curseur. C'est le vrai levier de dispersion. */
const POINTER_UNBIND = 0.95

/* --- Bornes du volume ------------------------------------------------------ */

/**
 * Rayon du cylindre qui contient l'amas. La contrainte sur XY est **radiale**
 * et non par axe : avec des bornes carrées, une goutte coincée dans un coin
 * respecte chaque axe tout en se retrouvant à `hypot(b, b)` du centre, soit
 * 41 % plus loin que la limite voulue — donc hors cadre.
 */
const BOUNDS_RADIUS = 0.85

/** Demi-hauteur sur l'axe de profondeur. */
const BOUNDS_Z = 0.45

/**
 * Fraction du rayon à partir de laquelle le rappel de paroi se lève.
 *
 * L'amas étant naturellement plus large que la borne, un clamp seul plaquerait
 * sa périphérie exactement sur le cercle et le contour extérieur se lirait
 * comme un arc taillé. Une force qui monte en carré avant la limite freine la
 * goutte au lieu de la coller, et la silhouette reste irrégulière. Le clamp
 * subsiste derrière, en dernier recours.
 */
const WALL_SOFT_START = 0.72

/** Raideur du rappel de paroi souple. */
const WALL_STIFFNESS = 120 * INTENSITY

/**
 * Plafond de vitesse. Il ne doit rattraper que les valeurs aberrantes : dès
 * qu'une part notable des gouttes s'y colle, elles avancent toutes à la même
 * vitesse exacte et le mouvement devient uniforme — l'inverse d'un fluide.
 */
const MAX_SPEED = 16 * INTENSITY

/** Une goutte de l'amas, dans le repère de la scène. */
export type Body = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  radius: number
  /** Masse normalisée autour de 1, proportionnelle au volume. */
  mass: number
  /** Décalage de phase de la dérive : chaque goutte suit sa propre trajectoire. */
  phase: number
  /** Emprise du curseur sur cette goutte au pas courant, dans `[0, 1]`. */
  grip: number
}

/** Curseur projeté dans le plan `z = 0` de la scène. */
export type PointerState = {
  x: number
  y: number
  /** Vitesse du curseur dans ce même plan, en unités de scène par seconde. */
  vx: number
  vy: number
  /** 0 quand le curseur est absent : la force s'éteint alors en douceur. */
  weight: number
}

/**
 * Générateur pseudo-aléatoire déterministe (congruence linéaire).
 * La scène s'ouvre ainsi toujours dans le même état.
 */
function makeRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

/** Distribue les gouttes sur une sphère creuse, avec quelques petites en marge. */
function createBodies(): Body[] {
  const random = makeRandom(0x9e3779b9)
  const bodies: Body[] = []

  for (let i = 0; i < CELL_COUNT; i++) {
    // Les dernières sont plus petites : elles se détachent en périphérie.
    const isSmall = i >= CELL_COUNT - 5

    // Distribution sphérique, pour éviter que tout parte du centre.
    const theta = random() * Math.PI * 2
    const phi = Math.acos(2 * random() - 1)
    const distance = 0.3 + random() * 0.45
    const radius = isSmall ? 0.17 + random() * 0.05 : 0.25 + random() * 0.08

    bodies.push({
      x: Math.sin(phi) * Math.cos(theta) * distance,
      y: Math.sin(phi) * Math.sin(theta) * distance,
      z: Math.cos(phi) * distance * 0.5,
      vx: (random() - 0.5) * 0.4,
      vy: (random() - 0.5) * 0.4,
      vz: (random() - 0.5) * 0.2,
      radius,
      mass: (radius / REFERENCE_RADIUS) ** 3,
      phase: random() * Math.PI * 2,
      grip: 0,
    })
  }

  return bodies
}

/**
 * Applique les trois forces de paire en un seul parcours des couples.
 *
 * Le profil de force est répulsif en deçà de la distance d'équilibre, attractif
 * au-delà jusqu'à la portée de cohésion. La viscosité, elle, s'applique partout
 * dans cette portée, pondérée par la proximité.
 *
 * Les gouttes sous le curseur voient leur cohésion et leur viscosité céder,
 * jamais leur répulsion : elles se séparent réellement, mais ne se traversent
 * pas.
 *
 * Coût quadratique, négligeable au nombre de gouttes en jeu.
 *
 * @param dt Pas d'intégration, en secondes.
 */
function resolvePairs(bodies: Body[], dt: number) {
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i]

    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j]

      const dx = b.x - a.x
      const dy = b.y - a.y
      const dz = b.z - a.z

      const sumRadius = a.radius + b.radius
      const rest = sumRadius * REST_OVERLAP
      const range = sumRadius * COHESION_RANGE

      const distanceSq = dx * dx + dy * dy + dz * dz
      if (distanceSq > range * range || distanceSq < 1e-9) continue

      const distance = Math.sqrt(distanceSq)
      const nx = dx / distance
      const ny = dy / distance
      const nz = dz / distance

      /** Tenue du lien entre les deux gouttes : 1 au repos, ~0 sous le curseur. */
      const bond = 1 - Math.max(a.grip, b.grip) * POINTER_UNBIND

      // Positif = les deux gouttes se rapprochent, négatif = elles s'écartent.
      let force: number
      if (distance < rest) {
        force = -REPULSION * (rest - distance)
      } else {
        const t = (distance - rest) / (range - rest)
        force = COHESION * (1 - t) * bond
      }

      const accelA = (force * dt) / a.mass
      const accelB = (force * dt) / b.mass

      a.vx += nx * accelA
      a.vy += ny * accelA
      a.vz += nz * accelA
      b.vx -= nx * accelB
      b.vy -= ny * accelB
      b.vz -= nz * accelB

      // Viscosité : chaque goutte est tirée vers la vitesse de sa voisine.
      // La pondération par la proximité l'annule à la portée de cohésion.
      const weight = (1 - distance / range) * VISCOSITY * bond * dt
      const relativeX = b.vx - a.vx
      const relativeY = b.vy - a.vy
      const relativeZ = b.vz - a.vz

      a.vx += relativeX * weight
      a.vy += relativeY * weight
      a.vz += relativeZ * weight
      b.vx -= relativeX * weight
      b.vy -= relativeY * weight
      b.vz -= relativeZ * weight
    }
  }
}

/**
 * Avance la simulation d'un pas fixe : forces de paire, puis forces
 * individuelles, intégration, contraintes de volume et verrou du barycentre.
 *
 * @param dt Pas d'intégration, en secondes.
 * @param elapsed Temps de scène écoulé, qui pilote battement, dérive et ébullition.
 */
function integrate(bodies: Body[], pointer: PointerState, dt: number, elapsed: number) {
  const damp = Math.pow(DAMPING_PER_SECOND, dt)

  // L'emprise du curseur se calcule avant les paires, qui en ont besoin pour
  // savoir où relâcher la cohésion.
  for (const body of bodies) {
    body.grip = 0
    if (pointer.weight > 0.001) {
      const distance = Math.hypot(body.x - pointer.x, body.y - pointer.y)
      if (distance < POINTER_RADIUS) {
        body.grip = (1 - distance / POINTER_RADIUS) * pointer.weight
      }
    }
  }

  resolvePairs(bodies, dt)

  const pulse = heartbeat(elapsed)

  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i]

    // Écartement radial depuis le curseur. Le plancher sur la distance évite
    // l'impulsion infinie quand une goutte passe pile dessous.
    const grip = body.grip
    if (grip > 0) {
      const dx = body.x - pointer.x
      const dy = body.y - pointer.y
      const distance = Math.hypot(dx, dy)
      const inv = 1 / Math.max(distance, 0.14)
      const spread = POINTER_SPREAD * grip * dt
      body.vx += dx * inv * spread
      body.vy += dy * inv * spread
    }

    // Atténuation locale de l'activité. Elle ne pondère que le battement et
    // l'ébullition : la dérive de fond reste à pleine amplitude, ce qui
    // garantit que la matière ne se fige nulle part.
    const agitation = 1 - POINTER_CALM * grip

    // Ressort vers le centre, durci pendant la diastole : c'est ce raidissement
    // entre deux battements qui produit le recul.
    const pull = ATTRACTOR_STRENGTH * (1 + PULSE_RECOIL * (1 - pulse))
    body.vx -= body.x * pull * dt
    body.vy -= body.y * pull * dt
    // L'axe de profondeur est plus contraint : la masse reste lisible de face.
    body.vz -= body.z * pull * 1.8 * dt

    // Systole : poussée radiale depuis le centre, la masse se gonfle d'un coup.
    if (pulse > 0.001) {
      const radial = Math.hypot(body.x, body.y, body.z) || 1e-4

      // La poussée s'éteint à mesure qu'on approche de la paroi. Sans ce
      // dégressif, chaque battement plaque la périphérie contre la limite, qui
      // la rabote en disque. L'expansion part donc du cœur — ce qui est aussi
      // le comportement d'un liquide qui bout.
      const ratio = Math.min(1, radial / BOUNDS_RADIUS)
      const headroom = 1 - ratio * ratio

      const push = PULSE_PUSH * pulse * agitation * headroom * dt
      body.vx += (body.x / radial) * push
      body.vy += (body.y / radial) * push
      body.vz += (body.z / radial) * push * 0.5
    }

    // Dérive entretenue, déphasée goutte par goutte. Jamais atténuée : c'est le
    // socle qui garantit qu'aucune goutte ne s'immobilise.
    body.vx += Math.sin(elapsed * 3.62 + body.phase) * DRIFT_STRENGTH * dt
    body.vy += Math.cos(elapsed * 2.82 + body.phase * 1.7) * DRIFT_STRENGTH * dt
    body.vz += Math.sin(elapsed * 2.16 + body.phase * 2.3) * DRIFT_STRENGTH * 0.5 * dt

    // Ébullition. Produits de deux sinusoïdes désaccordées : le résultat pique
    // et retombe au lieu d'osciller proprement, ce qu'une sinusoïde seule ne
    // sait pas faire. C'est ce grain irrégulier qui fait « bouillonner ».
    const boil = BOIL_STRENGTH * agitation * dt
    body.vx +=
      Math.sin(elapsed * 9.7 + body.phase * 3.1) * Math.cos(elapsed * 6.3 + body.phase) * boil
    body.vy +=
      Math.cos(elapsed * 8.4 + body.phase * 2.3) *
      Math.sin(elapsed * 5.9 + body.phase * 1.9) *
      boil
    body.vz +=
      Math.sin(elapsed * 7.1 + body.phase * 4.7) * Math.cos(elapsed * 4.8 + body.phase * 2.7) * boil * 0.6

    // Paroi souple : le rappel se lève avant la limite et monte en carré.
    const radialXY = Math.hypot(body.x, body.y)
    const soft = BOUNDS_RADIUS * WALL_SOFT_START
    if (radialXY > soft) {
      const over = (radialXY - soft) / (BOUNDS_RADIUS - soft)
      const brake = WALL_STIFFNESS * over * over * dt
      body.vx -= (body.x / radialXY) * brake
      body.vy -= (body.y / radialXY) * brake
    }

    body.vx *= damp
    body.vy *= damp
    body.vz *= damp

    const speed = Math.hypot(body.vx, body.vy, body.vz)
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed
      body.vx *= scale
      body.vy *= scale
      body.vz *= scale
    }

    body.x += body.vx * dt
    body.y += body.vy * dt
    body.z += body.vz * dt

    // Clamp cylindrique, dernier recours derrière la paroi souple : on ramène
    // la goutte sur le cercle et on absorbe sa composante radiale sortante.
    const radial = Math.hypot(body.x, body.y)
    if (radial > BOUNDS_RADIUS) {
      const nx = body.x / radial
      const ny = body.y / radial

      body.x = nx * BOUNDS_RADIUS
      body.y = ny * BOUNDS_RADIUS

      const outward = body.vx * nx + body.vy * ny
      if (outward > 0) {
        // Rebond très amorti : un liquide ne ricoche pas sur une paroi.
        body.vx -= 1.15 * outward * nx
        body.vy -= 1.15 * outward * ny
      }
    }

    if (Math.abs(body.z) > BOUNDS_Z) {
      body.z = Math.sign(body.z) * BOUNDS_Z
      body.vz *= -0.15
    }
  }

  lockCentreOfMass(bodies)
}

/**
 * Retire le mouvement d'ensemble de l'amas.
 *
 * La dérive et l'ébullition sont déphasées goutte par goutte, mais leur somme
 * instantanée n'est jamais nulle : il subsiste à chaque pas une composante de
 * translation commune, et la masse entière se met à naviguer dans le cadre.
 * C'est un artefact, pas de l'agitation, et il croît avec l'intensité.
 *
 * On annule donc les deux termes rigides — la vitesse moyenne et le décalage du
 * barycentre. Toute la dynamique interne, chaque goutte par rapport à ses
 * voisines, reste strictement intacte : l'amas s'agite sur place.
 *
 * Le verrou vaut aussi sous le curseur, où la poussée devient une déformation
 * pure au lieu de faire glisser la masse hors du cadre.
 */
function lockCentreOfMass(bodies: Body[]) {
  let totalMass = 0
  let cx = 0
  let cy = 0
  let cz = 0
  let cvx = 0
  let cvy = 0
  let cvz = 0

  for (const body of bodies) {
    totalMass += body.mass
    cx += body.x * body.mass
    cy += body.y * body.mass
    cz += body.z * body.mass
    cvx += body.vx * body.mass
    cvy += body.vy * body.mass
    cvz += body.vz * body.mass
  }

  cx /= totalMass
  cy /= totalMass
  cz /= totalMass
  cvx /= totalMass
  cvy /= totalMass
  cvz /= totalMass

  for (const body of bodies) {
    body.x -= cx
    body.y -= cy
    body.z -= cz
    body.vx -= cvx
    body.vy -= cvy
    body.vz -= cvz
  }
}

/**
 * Rayon de la sphère englobant toutes les gouttes, marge de lissage comprise.
 *
 * Le shader s'en sert pour rejeter en une seule intersection les rayons qui
 * ratent la masse, au lieu de les faire marcher dans le vide.
 *
 * @param blend Rayon de fusion appliqué côté shader.
 */
export function boundingSphere(bodies: Body[], blend: number) {
  let radius = 0

  for (const body of bodies) {
    const distance = Math.hypot(body.x, body.y, body.z) + body.radius
    if (distance > radius) radius = distance
  }

  return radius + blend * 2
}

/**
 * Aplatit les gouttes dans le tampon d'uniforms attendu par le shader, au
 * format `(x, y, z, rayon)` par goutte.
 *
 * @param positions Tampon de `CELL_COUNT * 4` flottants, réécrit sur place.
 */
export function packBodies(bodies: Body[], positions: Float32Array) {
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i]
    const base = i * 4

    positions[base] = body.x
    positions[base + 1] = body.y
    positions[base + 2] = body.z
    positions[base + 3] = body.radius
  }
}

/**
 * Crée une simulation autonome, déjà stabilisée.
 *
 * Le reliquat de pas fixe et le temps écoulé sont gardés dans la clôture :
 * l'appelant n'a qu'à fournir le delta de sa frame et lire `bodies` et `pulse`.
 */
export function createSimulation() {
  const bodies = createBodies()
  let carry = 0
  let elapsed = 0

  // Pré-chauffage hors écran. La distribution initiale place les gouttes au
  // hasard, donc avec de forts recouvrements que la répulsion résout
  // brutalement : sans ces deux secondes absorbées d'avance, le visiteur verrait
  // la masse se disloquer puis se rassembler à l'ouverture de la page.
  const idle: PointerState = { x: 0, y: 0, vx: 0, vy: 0, weight: 0 }
  for (let i = 0; i < 260; i++) {
    integrate(bodies, idle, FIXED_STEP, elapsed)
    elapsed += FIXED_STEP
  }

  return {
    bodies,
    /**
     * Valeur de l'enveloppe cardiaque au dernier pas. Le shader s'en sert pour
     * faire vibrer la luminosité en même temps que le volume.
     */
    pulse: 0,
    /**
     * Rattrape le temps écoulé par pas fixes.
     *
     * @param delta Durée de la frame, en secondes.
     */
    step(pointer: PointerState, delta: number) {
      elapsed += delta
      carry = Math.min(carry + delta, MAX_ACCUMULATED)

      while (carry >= FIXED_STEP) {
        integrate(bodies, pointer, FIXED_STEP, elapsed)
        carry -= FIXED_STEP
      }

      this.pulse = heartbeat(elapsed)
    },
  }
}
