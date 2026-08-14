/**
 * Simulation de gouttes de sang.
 *
 * Le modèle n'est pas celui de corps rigides qui s'entrechoquent, mais celui
 * d'un liquide : les gouttes se pénètrent, se retiennent entre elles et
 * amortissent mutuellement leur vitesse. Trois forces de paire décrivent ça —
 * une répulsion douce à courte portée qui empêche l'effondrement, une cohésion
 * à moyenne portée qui tient la masse ensemble, et une viscosité qui rapproche
 * les vitesses des voisines. C'est la viscosité qui donne au mouvement son
 * épaisseur ; sans elle, on retombe sur des billes.
 *
 * L'intégration se fait à pas fixe : sans ça, un onglet qui reprend le focus
 * après une pause produit un pas de temps énorme et la simulation explose.
 */

export const CELL_COUNT = 24

/** Pas d'intégration, en secondes. 120 Hz : stable sans coûter cher. */
const FIXED_STEP = 1 / 120

/** Au-delà, on abandonne le retard accumulé plutôt que de rattraper à l'infini. */
const MAX_ACCUMULATED = 0.25

const ATTRACTOR_STRENGTH = 1.25

/**
 * Amortissement global par seconde. Plus marqué que pour des corps solides :
 * un liquide visqueux dissipe vite. La dérive entretenue compense pour que la
 * masse ne se fige jamais complètement.
 */
const DAMPING_PER_SECOND = 0.80

/** Dérive entretenue : c'est elle qui fait couler la masse au repos. */
const DRIFT_STRENGTH = 1.65

/** Rayon de référence servant à normaliser les masses autour de 1. */
const REFERENCE_RADIUS = 0.26

/**
 * Distance d'équilibre entre deux gouttes, en fraction de la somme des rayons.
 * En dessous de 1, elles se chevauchent en permanence — c'est ce recouvrement
 * qui laisse le lissage du shader les fondre en une seule masse.
 */
const REST_OVERLAP = 0.82

/** Portée de la cohésion, toujours en fraction de la somme des rayons. */
const COHESION_RANGE = 1.15

const REPULSION = 90
const COHESION = 4.0

/** Amortissement de la vitesse relative entre voisines. Le terme « visqueux ». */
const VISCOSITY = 2.5

const POINTER_RADIUS = 2.2
const POINTER_STRENGTH = 14.5

/**
 * Traînée du curseur. La répulsion seule fait fuir la position du pointeur,
 * quelle que soit la façon dont on le déplace : les gouttes s'écartent mais
 * n'obéissent pas. Ce terme les entraîne dans le **sens du déplacement**, ce
 * qui rend le balayage lisible — on pousse la matière, on ne la disperse plus
 * seulement.
 */
const POINTER_DRAG = 0.55

/** Au-delà, un mouvement de souris brusque enverrait tout contre la paroi. */
const MAX_POINTER_SPEED = 6

/**
 * Bornes du volume. La contrainte sur XY est **radiale**, pas par axe : avec des
 * bornes cubiques, un corps coincé dans un coin respecte chaque axe tout en se
 * retrouvant à une distance hypot(b, b) du centre — soit 41 % plus loin que la
 * limite voulue, donc hors cadre.
 */
const BOUNDS_RADIUS = 0.85
const BOUNDS_Z = 0.45

/**
 * Plafond de vitesse. Il ne doit rattraper que les valeurs aberrantes : dès
 * qu'une part notable des gouttes s'y colle, elles avancent toutes à la même
 * vitesse exacte et le mouvement devient uniforme — l'inverse d'un fluide.
 */
const MAX_SPEED = 4.5

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

      // Positif = les deux gouttes se rapprochent, négatif = elles s'écartent.
      let force: number
      if (distance < rest) {
        force = -REPULSION * (rest - distance)
      } else {
        const t = (distance - rest) / (range - rest)
        force = COHESION * (1 - t)
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
      const weight = (1 - distance / range) * VISCOSITY * dt
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

  resolvePairs(bodies, dt)

  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i]

    // Ressort vers l'attracteur central.
    body.vx -= body.x * ATTRACTOR_STRENGTH * dt
    body.vy -= body.y * ATTRACTOR_STRENGTH * dt
    // L'axe de profondeur est plus contraint : la masse reste lisible de face.
    body.vz -= body.z * ATTRACTOR_STRENGTH * 1.8 * dt

    // Dérive entretenue, déphasée goutte par goutte.
    body.vx += Math.sin(elapsed * 3.62 + body.phase) * DRIFT_STRENGTH * dt
    body.vy += Math.cos(elapsed * 2.82 + body.phase * 1.7) * DRIFT_STRENGTH * dt
    body.vz += Math.sin(elapsed * 2.16 + body.phase * 2.3) * DRIFT_STRENGTH * 0.5 * dt

    // Répulsion du curseur, en 1/d² plafonné pour éviter les impulsions folles.
    if (pointer.weight > 0.001) {
      const dx = body.x - pointer.x
      const dy = body.y - pointer.y
      const distanceSq = dx * dx + dy * dy + 0.06

      if (distanceSq < POINTER_RADIUS * POINTER_RADIUS) {
        const distance = Math.sqrt(distanceSq)
        const force = (POINTER_STRENGTH * pointer.weight) / distanceSq
        body.vx += (dx / distance) * force * dt
        body.vy += (dy / distance) * force * dt

        // Traînée dans le sens du déplacement du curseur. L'atténuation est
        // linéaire en distance, pas en 1/d² comme la répulsion : on veut que
        // le balayage emporte une nappe large, pas qu'il perce un trou.
        const falloff = 1 - distance / POINTER_RADIUS
        let dragX = pointer.vx
        let dragY = pointer.vy

        const pointerSpeed = Math.hypot(dragX, dragY)
        if (pointerSpeed > MAX_POINTER_SPEED) {
          const scale = MAX_POINTER_SPEED / pointerSpeed
          dragX *= scale
          dragY *= scale
        }

        const drag = POINTER_DRAG * falloff * pointer.weight * dt
        body.vx += dragX * drag
        body.vy += dragY * drag
      }
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
  // premières secondes — précisément à l'ouverture de la page. On absorbe ce
  // transitoire hors écran, le hero s'ouvre sur une masse déjà stable.
  const idle: PointerState = { x: 0, y: 0, vx: 0, vy: 0, weight: 0 }
  for (let i = 0; i < 260; i++) {
    integrate(bodies, idle, FIXED_STEP, elapsed)
    elapsed += FIXED_STEP
  }

  return {
    bodies,
    step(pointer: PointerState, delta: number) {
      elapsed += delta
      carry = Math.min(carry + delta, MAX_ACCUMULATED)

      while (carry >= FIXED_STEP) {
        integrate(bodies, pointer, FIXED_STEP, elapsed)
        carry -= FIXED_STEP
      }
    },
  }
}
