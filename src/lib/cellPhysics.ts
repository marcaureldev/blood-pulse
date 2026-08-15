/**
 * Simulation de gouttes de sang.
 *
 * Le modèle n'est pas celui de corps rigides qui s'entrechoquent, mais celui
 * d'un liquide : les gouttes se pénètrent, se retiennent entre elles et
 * amortissent mutuellement leur vitesse. Trois forces de paire décrivent ça -
 * une répulsion douce à courte portée qui empêche l'effondrement, une cohésion
 * à moyenne portée qui tient la masse ensemble, et une viscosité qui rapproche
 * les vitesses des voisines. C'est la viscosité qui donne au mouvement son
 * épaisseur ; sans elle, on retombe sur des billes.
 *
 * L'intégration se fait à pas fixe : sans ça, un onglet qui reprend le focus
 * après une pause produit un pas de temps énorme et la simulation explose.
 */

export const CELL_COUNT = 12
/** Pas d'intégration, en secondes. 120 Hz : stable sans coûter cher. */
const FIXED_STEP = 1 / 120

/** Au-delà, on abandonne le retard accumulé plutôt que de rattraper à l'infini. */
const MAX_ACCUMULATED = 0.25

/**
 * Molette d'intensité globale de l'agitation. 1 = réglage de référence.
 *
 * Elle multiplie les trois forces d'agitation **et** le plafond de vitesse, et
 * il faut les tenir ensemble : monter la turbulence seule fait buter les
 * gouttes contre le plafond, elles y filent alors toutes à la même vitesse
 * exacte et le mouvement devient uniforme — précisément l'inverse de l'effet
 * recherché. La rigidité de paroi suit pour la même raison : sans elle, la
 * périphérie traverse la paroi souple et retombe sur le clamp dur, qui rabote
 * la silhouette en cercle.
 *
 * Au-delà de 4 environ, le gain ne se voit plus : l'amas est contraint par le
 * rayon de la paroi, pas par les forces, et l'énergie supplémentaire ne fait
 * que le presser plus fort contre la limite.
 */
export const INTENSITY = 0.5

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
 * Enveloppe cardiaque sur un cycle, dans [0, 1].
 *
 * Deux pics — le « toum » franc puis le « ta » plus bref — suivis d'un long
 * temps mort. Une sinusoïde donnerait un halètement régulier de métronome ;
 * c'est l'asymétrie et le silence entre deux battements qui font lire un cœur
 * plutôt qu'une respiration.
 */
export function heartbeat(elapsed: number): number {
  const phase = (elapsed % BEAT_PERIOD) / BEAT_PERIOD
  const lub = Math.exp(-((phase - 0.06) ** 2) / 0.0030)
  const dub = 0.52 * Math.exp(-((phase - 0.21) ** 2) / 0.0022)
  return Math.min(1, lub + dub)
}

/**
 * Amortissement global par seconde. Plus marqué que pour des corps solides :
 * un liquide visqueux dissipe vite. La dérive entretenue compense pour que la
 * masse ne se fige jamais complètement.
 */
const DAMPING_PER_SECOND = 0.80

/** Dérive entretenue : c'est elle qui fait couler la masse au repos. */
const DRIFT_STRENGTH = 7.5 * INTENSITY

/** Rayon de référence servant à normaliser les masses autour de 1. */
const REFERENCE_RADIUS = 0.26

/**
 * Distance d'équilibre entre deux gouttes, en fraction de la somme des rayons.
 * En dessous de 1, elles se chevauchent en permanence - c'est ce recouvrement
 * qui laisse le lissage du shader les fondre en une seule masse.
 */
const REST_OVERLAP = 0.82

/** Portée de la cohésion, toujours en fraction de la somme des rayons. */
const COHESION_RANGE = 1.15

const REPULSION = 90
const COHESION = 4.0

/** Amortissement de la vitesse relative entre voisines. Le terme « visqueux ». */
const VISCOSITY =  3

const POINTER_RADIUS = 2.2

/**
 * Le curseur est un dissipateur, pas un pousseur.
 *
 * La version précédente le traitait comme un obstacle : répulsion en 1/d² à 14,5
 * plus une traînée dans le sens du déplacement. La matière fuyait le pointeur,
 * ce qui se lisait comme un choc.
 *
 * Ici il **calme** l'agitation locale — battement et ébullition sont atténués
 * sous le curseur — et il écarte doucement la masse. La dérive de fond, elle,
 * n'est jamais touchée : c'est ce qui garantit que les gouttes continuent de
 * bouger même là où l'activité est retombée.
 */
const POINTER_SPREAD = 80

/**
 * Part d'agitation retirée sous le curseur. Volontairement nulle : le curseur
 * disperse dans l'espace, il n'endort pas. Les gouttes écartées gardent toute
 * leur activité, et c'est la cohésion qui les rassemble une fois le curseur
 * parti. Laissé en constante pour pouvoir rétablir un amortissement local.
 */
const POINTER_CALM = 0

/** Part de cohésion rompue sous le curseur. C'est le vrai levier de dispersion. */
const POINTER_UNBIND = 0.95

/**
 * Bornes du volume. La contrainte sur XY est **radiale**, pas par axe : avec des
 * bornes cubiques, un corps coincé dans un coin respecte chaque axe tout en se
 * retrouvant à une distance hypot(b, b) du centre - soit 41 % plus loin que la
 * limite voulue, donc hors cadre.
 */
const BOUNDS_RADIUS = 0.85
const BOUNDS_Z = 0.45

/**
 * Paroi souple : fraction du rayon à partir de laquelle le rappel se lève.
 *
 * Le clamp seul plaquait les gouttes exactement sur le cercle — l'amas étant
 * naturellement plus large que la borne, la périphérie y glissait en permanence
 * et le contour extérieur se lisait comme un arc de cercle taillé. Une force
 * qui monte en carré avant la limite freine la goutte au lieu de la coller, et
 * la silhouette reste irrégulière. Le clamp subsiste derrière, en dernier
 * recours.
 */
const WALL_SOFT_START = 0.72
const WALL_STIFFNESS = 120 * INTENSITY

/**
 * Plafond de vitesse. Il ne doit rattraper que les valeurs aberrantes : dès
 * qu'une part notable des gouttes s'y colle, elles avancent toutes à la même
 * vitesse exacte et le mouvement devient uniforme - l'inverse d'un fluide.
 */
const MAX_SPEED = 16 * INTENSITY

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
  /** Emprise du curseur sur cette goutte au pas courant, dans [0, 1]. */
  grip: number
}

export type PointerState = {
  /** Position du curseur projetée dans le plan z = 0 de la scène. */
  x: number
  y: number
  /** Vitesse du curseur dans ce même plan, en unités de scène par seconde. */
  vx: number
  vy: number
  /** 0 quand le curseur est absent : la force s'éteint en douceur. */
  weight: number
}

/** Générateur déterministe : la scène s'ouvre toujours dans le même état. */
function makeRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

function createBodies(): Body[] {
  const random = makeRandom(0x9e3779b9)
  const bodies: Body[] = []

  for (let i = 0; i < CELL_COUNT; i++) {
    // Quelques gouttes plus petites, qui se détachent en périphérie de la masse.
    const isSmall = i >= CELL_COUNT - 5

    // Répartition initiale sur une sphère, pour éviter que tout parte du centre.
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
 * Interactions de paire. Un seul parcours des 120 paires applique les trois
 * forces : le profil est répulsif en dessous de la distance d'équilibre, puis
 * attractif jusqu'à la portée de cohésion, et la viscosité s'applique partout
 * dans cette portée en pondérant par la proximité.
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

      // Le curseur délie le liquide. La cohésion et la viscosité cèdent là où
      // il passe, la répulsion non : les gouttes se séparent réellement au lieu
      // de lutter contre un rappel qui les ramène aussitôt — mais elles ne se
      // traversent jamais. C'est ce relâchement, et non la poussée, qui rend la
      // dispersion visible.
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
      // Pondérée par la proximité, elle s'annule à la portée de cohésion.
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

function integrate(bodies: Body[], pointer: PointerState, dt: number, elapsed: number) {
  const damp = Math.pow(DAMPING_PER_SECOND, dt)

  // L'emprise du curseur est calculée avant les paires : resolvePairs en a
  // besoin pour savoir où relâcher la cohésion.
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

    const grip = body.grip
    if (grip > 0) {
      const dx = body.x - pointer.x
      const dy = body.y - pointer.y
      const distance = Math.hypot(dx, dy)
      {

        // Écartement doux, radial depuis le curseur. Le plancher sur la
        // distance évite l'impulsion infinie quand une goutte passe pile
        // dessous.
        const inv = 1 / Math.max(distance, 0.14)
        const spread = POINTER_SPREAD * grip * dt
        body.vx += dx * inv * spread
        body.vy += dy * inv * spread
      }
    }

    /**
     * Facteur d'agitation. Il ne pondère que le battement et l'ébullition :
     * sous le curseur, l'activité intense retombe sans que la matière ne se
     * fige, puisque la dérive de fond reste à pleine amplitude.
     */
    const agitation = 1 - POINTER_CALM * grip

    // Ressort vers l'attracteur central, renforcé pendant la diastole : c'est
    // ce durcissement entre deux battements qui produit le recul.
    const pull = ATTRACTOR_STRENGTH * (1 + PULSE_RECOIL * (1 - pulse))
    body.vx -= body.x * pull * dt
    body.vy -= body.y * pull * dt
    // L'axe de profondeur est plus contraint : la masse reste lisible de face.
    body.vz -= body.z * pull * 1.8 * dt

    // Systole : poussée radiale depuis le centre, la masse se gonfle d'un coup.
    if (pulse > 0.001) {
      const radial = Math.hypot(body.x, body.y, body.z) || 1e-4

      // La poussée s'éteint à mesure qu'on approche de la paroi. Sans ce
      // dégressif, chaque battement plaquait la périphérie contre la limite,
      // qui la rabotait en disque : le contour extérieur devenait un cercle
      // parfait au lieu d'une masse qui respire. L'expansion part donc du
      // cœur, ce qui est aussi le comportement d'un liquide qui bout.
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

    // Paroi cylindrique : on ramène la goutte sur le cercle et on absorbe sa
    // composante radiale. La distance au centre est ainsi bornée quelle que
    // soit la direction, ce qu'une contrainte par axe ne garantit pas.
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
 * instantanée n'est jamais nulle : il reste à chaque pas une composante de
 * translation commune, et la masse entière se met à naviguer de haut en bas.
 * C'est un artefact, pas de l'agitation — et il ne fait qu'empirer quand on
 * monte l'intensité, ce qui rendait tout renforcement inexploitable.
 *
 * On annule donc les deux termes rigides : la vitesse moyenne, et le décalage
 * du barycentre. Toute la dynamique interne — chaque goutte par rapport à ses
 * voisines — reste strictement intacte. L'amas s'agite sur place.
 *
 * Le verrou vaut aussi sous le curseur : la poussée y devient une déformation
 * pure au lieu de faire glisser la boule hors du cadre.
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
 * Sphère englobant toutes les gouttes, marge de lissage comprise.
 * Le shader s'en sert pour rejeter en une intersection les rayons qui ratent
 * la masse, au lieu de les faire marcher dans le vide.
 */
export function boundingSphere(bodies: Body[], blend: number) {
  let radius = 0

  for (const body of bodies) {
    const distance = Math.hypot(body.x, body.y, body.z) + body.radius
    if (distance > radius) radius = distance
  }

  return radius + blend * 2
}

/** Aplatit les gouttes dans le tampon d'uniforms attendu par le shader. */
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
 * Crée une simulation autonome. Le reliquat de pas fixe et le temps écoulé sont
 * gardés dans la clôture : l'appelant n'a qu'à fournir le delta de sa frame.
 */
export function createSimulation() {
  const bodies = createBodies()
  let carry = 0
  let elapsed = 0

  // Pré-chauffage. La distribution initiale place les gouttes au hasard, donc
  // avec de forts recouvrements que la répulsion résout brutalement : sans ça,
  // le visiteur voit la masse se disloquer puis se rassembler pendant les deux
  // premières secondes - précisément à l'ouverture de la page. On absorbe ce
  // transitoire hors écran, le hero s'ouvre sur une masse déjà stable.
  const idle: PointerState = { x: 0, y: 0, vx: 0, vy: 0, weight: 0 }
  for (let i = 0; i < 260; i++) {
    integrate(bodies, idle, FIXED_STEP, elapsed)
    elapsed += FIXED_STEP
  }

  return {
    bodies,
    /** Valeur de l'enveloppe cardiaque au dernier pas. Le shader s'en sert
     *  pour faire vibrer la luminosité en même temps que le volume. */
    pulse: 0,
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
