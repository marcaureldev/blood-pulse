import { useEffect, useRef } from 'react'
import {
  CELL_COUNT,
  boundingSphere,
  createSimulation,
  packBodies,
  type PointerState,
} from '@/lib/cellPhysics'

/**
 * Rendu de l'amas cellulaire par sphere-tracing.
 *
 * La physique tourne sur CPU (voir cellPhysics.ts), le shader ne fait que
 * dessiner : il reçoit les seize corps en uniforms et raymarche une SDF unique,
 * l'union lissée des corps. Le lissage `smin` est ce qui fait que deux cellules
 * qui se touchent fusionnent au lieu de s'interpénétrer.
 *
 * Le canvas est créé en JavaScript puis inséré dans le conteneur, jamais déclaré
 * en JSX : React réutilise un élément JSX au remontage (StrictMode monte deux
 * fois en développement) et le contexte WebGL du premier passage reste attaché
 * au canvas, définitivement inerte. Créer et retirer l'élément soi-même donne un
 * contexte neuf à chaque montage.
 */

/** Distance caméra-origine, et focale. Aussi utilisés pour projeter le curseur. */
const CAMERA_Z = 4.2
/**
 * Focale choisie pour que la masse au repos respire dans le cadre (~14 % de
 * marge) et ne vienne le remplir que lorsque le curseur la bouscule.
 */
const FOCAL = 1.6

/**
 * Rayon de fusion entre gouttes voisines. Doit être du même ordre que leurs
 * rayons (~0.26) : plus bas, les surfaces se rejoignent par un sillon visible
 * et la masse se lit comme un assemblage de billes au lieu d'un liquide.
 */
const BLEND = 0.34

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const buildFragmentShader = (steps: number) => `#version 300 es
precision highp float;

#define COUNT ${CELL_COUNT}
#define STEPS ${steps}

const float BLEND = ${BLEND.toFixed(4)};
const float CAMERA_Z = ${CAMERA_Z.toFixed(4)};
const float FOCAL = ${FOCAL.toFixed(4)};

uniform vec2 uResolution;
uniform vec4 uBodies[COUNT];
uniform float uBoundRadius;
uniform float uPulse;
uniform float uTime;

out vec4 fragColor;

// Teinte du sang en transmission. Le vert et le bleu sont fortement éteints
// dans l'épaisseur, le rouge presque pas : c'est de cet écart, et non d'un
// dégradé peint à la main, que naît la saturation.
//
// L'absorption du rouge est le réglage sensible. À 1,15 la matière épaisse
// virait au bordeaux ; à 0 elle devenait un rouge plat sans profondeur. À 0,13
// le coeur se densifie juste assez pour qu'on lise du volume, sans que la
// teinte ne glisse.
const vec3 ABSORPTION = vec3(0.13, 3.4, 4.0);

const vec3 C_SCATTER = vec3(0.94, 0.115, 0.095);
const vec3 C_RIM = vec3(1.0, 0.40, 0.33);

/** Amplitude du relief de surface. Au-delà de 0,6, la masse se met à grésiller. */
const float RIPPLE = 0.34;

/* --- Relief de surface ----------------------------------------------------
   La SDF donne une surface rigoureusement lisse, et c'est elle qui faisait
   lire du caoutchouc : une bille parfaite ne ressemble à aucun liquide.

   Le relief est appliqué sur la **normale** seulement, pas sur la distance. La
   silhouette reste donc nette — ce qui est correct, la tension superficielle
   lisse le contour d'un liquide — mais la lumière, elle, court sur des rides
   qui se déplacent. C'est aussi bien plus économique que de perturber la SDF,
   qui est évaluée des dizaines de fois par rayon là où la normale l'est une
   seule fois.
   ------------------------------------------------------------------------- */
float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // lissage de Hermite : pas d'arête entre cellules
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

// Deux échelles : une houle lente qui fait couler la matière, des rides fines
// par-dessus qui brisent les reflets. Une seule échelle donne soit un blob
// mou, soit du grain.
vec3 rippleNormal(vec3 p, vec3 n) {
  vec3 slow = p * 2.6 + vec3(0.0, uTime * 0.45, uTime * 0.25);
  vec3 fine = p * 8.5 - vec3(uTime * 0.7, 0.0, uTime * 0.4);

  vec3 d =
    vec3(valueNoise(slow), valueNoise(slow + 19.3), valueNoise(slow + 41.7)) - 0.5;
  d += (vec3(valueNoise(fine), valueNoise(fine + 7.1), valueNoise(fine + 63.9)) - 0.5) * 0.55;

  return normalize(n + d * RIPPLE);
}

// Union lissée polynomiale : en dessous de k, les deux surfaces se rejoignent
// par un raccord continu au lieu d'une arête.
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
  float d = length(p - uBodies[0].xyz) - uBodies[0].w;
  for (int i = 1; i < COUNT; i++) {
    d = smin(d, length(p - uBodies[i].xyz) - uBodies[i].w, BLEND);
  }
  return d;
}

// Gradient par tétraèdre : quatre évaluations au lieu de six.
vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0016;
  return normalize(
    e.xyy * map(p + e.xyy) +
    e.yyx * map(p + e.yyx) +
    e.yxy * map(p + e.yxy) +
    e.xxx * map(p + e.xxx)
  );
}

// Épaisseur de matière sous le point d'impact : on redescend le long de la
// normale et on cumule la profondeur négative de la SDF. C'est ce qui distingue
// un bord fin, qui laisse passer la lumière, d'un coeur dense qui l'absorbe.
float thicknessAt(vec3 p, vec3 n) {
  float acc = 0.0;
  for (int i = 1; i <= 5; i++) {
    acc += max(0.0, -map(p - n * float(i) * 0.075));
  }
  return acc;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

  vec3 ro = vec3(0.0, 0.0, CAMERA_Z);
  vec3 rd = normalize(vec3(uv, -FOCAL));

  // Sphère englobante centrée sur l'origine : les rayons qui la ratent sortent
  // en une intersection au lieu de marcher dans le vide sur STEPS pas.
  float b = dot(ro, rd);
  float c = dot(ro, ro) - uBoundRadius * uBoundRadius;
  float disc = b * b - c;
  if (disc < 0.0) discard;

  float root = sqrt(disc);
  float tNear = max(-b - root, 0.0);
  float tFar = -b + root;
  if (tFar <= tNear) discard;

  float t = tNear;
  bool hit = false;

  for (int i = 0; i < STEPS; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0014) {
      hit = true;
      break;
    }
    t += d;
    if (t > tFar) break;
  }

  if (!hit) discard;

  vec3 p = ro + rd * t;
  // La normale géométrique sert à sonder l'épaisseur, la normale ridée à
  // éclairer : perturber avant la mesure ferait rebondir l'épaisseur au rythme
  // des rides et la masse clignoterait.
  vec3 geoN = calcNormal(p);
  vec3 n = rippleNormal(p, geoN);
  vec3 view = -rd;

  vec3 keyDir = normalize(vec3(-0.55, 0.72, 0.62));
  // Source placée derrière l'amas : c'est elle qui embrase les bords.
  vec3 backDir = normalize(vec3(0.28, 0.35, -1.0));

  float lambert = clamp(dot(n, keyDir), 0.0, 1.0);
  float back = clamp(dot(n, backDir), 0.0, 1.0);
  float fresnel = pow(1.0 - clamp(dot(n, view), 0.0, 1.0), 3.5);

  float thick = thicknessAt(p, geoN);

  // Beer-Lambert par canal. Additionner un rose sur du rouge sombre saturait le
  // canal rouge et faisait monter vert et bleu - d'où le gris. Ici la couleur
  // naît de ce qui reste après absorption, la saturation est donc garantie.
  vec3 transmit = exp(-thick * ABSORPTION);

  // L'éclairage ne produit plus qu'un **scalaire d'intensité**. Auparavant
  // chaque source ajoutait sa propre couleur — une réflexion de surface sombre,
  // un contre-jour teinté — et leur somme dérivait la teinte vers le brique.
  // Ici la lumière fait varier la luminosité, jamais la teinte : le rouge est
  // décidé une fois, par C_SCATTER, et rien ne le déplace.
  float lit = 0.66 + back * 0.62 + lambert * 0.48;

  // La systole embrase la matière en même temps qu'elle la gonfle. Le gain
  // s'applique **par le bas** : la couleur sature près du blanc, donc éclaircir
  // au-dessus du repos ne se voyait pas — la compression des hautes lumières
  // avalait tout. En posant la diastole à 0,78, le battement se lit comme un
  // retour de la braise et non comme un éclair.
  lit *= 0.78 + uPulse * 0.50;

  vec3 color = C_SCATTER * transmit * lit;

  // Liseré de bord, seule entorse admise : il reste rouge, simplement plus clair.
  color += C_RIM * fresnel * 0.55;

  // Deux lobes spéculaires. Un point unique et serré est la signature du
  // plastique ; un liquide porte une nappe brillante large, sur laquelle
  // courent des éclats fins. Ce sont les rides qui brisent le lobe serré en
  // une multitude de points mobiles — l'aspect mouillé vient de là.
  vec3 halfVec = normalize(keyDir + view);
  float ndoth = clamp(dot(n, halfVec), 0.0, 1.0);
  color += vec3(1.0, 0.92, 0.90) * pow(ndoth, 16.0) * 0.09;
  color += vec3(1.0) * pow(ndoth, 240.0) * 0.55;

  // Compression douce des hautes lumières : sans elle, l'écrêtage brutal du
  // canal rouge reproduit exactement le délavage qu'on vient de corriger.
  color = 1.0 - exp(-color * 1.72);

  // Opacité relevée : sous 0,72, le crème de la page transparaissait et
  // délavait le rouge sur toute la périphérie.
  float alpha = clamp(0.72 + thick * 3.0, 0.0, 1.0);

  fragColor = vec4(color, alpha);
}
`

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (import.meta.env.DEV) {
      console.error('[BloodCells] compilation échouée\n', gl.getShaderInfoLog(shader))
    }
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGL2RenderingContext, steps: number) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, buildFragmentShader(steps))
  if (!vertex || !fragment) return null

  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (import.meta.env.DEV) {
      console.error('[BloodCells] édition de liens échouée\n', gl.getProgramInfoLog(program))
    }
    gl.deleteProgram(program)
    return null
  }
  return program
}

type BloodCellsProps = {
  /** Résolution interne de rendu. 0.65 = ~42% des pixels, filtrés à l'affichage. */
  renderScale?: number
  /** Plafond du devicePixelRatio. */
  maxPixelRatio?: number
  /** Pas de raymarch. Le coût par pixel est directement proportionnel. */
  steps?: number
  /** Plafond de fréquence de rendu. La physique reste à pas fixe. */
  targetFps?: number
  /** Appelé si WebGL2 est absent ou si le contexte est perdu. */
  onUnavailable?: () => void
}

export function BloodCells({
  renderScale = 0.65,
  maxPixelRatio = 2,
  steps =56,
  targetFps = 60,
  onUnavailable,
}: BloodCellsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const onUnavailableRef = useRef(onUnavailable)
  useEffect(() => {
    onUnavailableRef.current = onUnavailable
  }, [onUnavailable])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      depth: false,
      powerPreference: 'low-power',
    })

    if (!gl) {
      if (import.meta.env.DEV) console.error('[BloodCells] WebGL2 indisponible')
      onUnavailableRef.current?.()
      return
    }

    const program = createProgram(gl, steps)
    if (!program) {
      onUnavailableRef.current?.()
      return
    }

    container.appendChild(canvas)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    const aPosition = gl.getAttribLocation(program, 'aPosition')
    const uResolution = gl.getUniformLocation(program, 'uResolution')
    const uBodies = gl.getUniformLocation(program, 'uBodies')
    const uBoundRadius = gl.getUniformLocation(program, 'uBoundRadius')
    const uPulse = gl.getUniformLocation(program, 'uPulse')
    const uTime = gl.getUniformLocation(program, 'uTime')

    gl.useProgram(program)
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    const simulation = createSimulation()
    // Tampons réutilisés d'une frame à l'autre : aucune allocation dans la boucle.
    const positions = new Float32Array(CELL_COUNT * 4)

    const pointer: PointerState = { x: 0, y: 0, vx: 0, vy: 0, weight: 0 }
    let targetX = 0
    let targetY = 0
    let targetWeight = 0

    let resizePending = false

    const setSize = () => {
      const rect = container.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)

      const width = Math.max(1, Math.floor(rect.width * ratio * renderScale))
      const height = Math.max(1, Math.floor(rect.height * ratio * renderScale))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const shortSide = Math.min(rect.width, rect.height)
      if (shortSide === 0) return

      // Pixels écran → repère normalisé → plan z = 0 de la scène.
      const ndcX = (event.clientX - rect.left - rect.width / 2) / shortSide
      const ndcY = -(event.clientY - rect.top - rect.height / 2) / shortSide

      targetX = (ndcX * CAMERA_Z) / FOCAL
      targetY = (ndcY * CAMERA_Z) / FOCAL
      targetWeight = 1
    }

    const onPointerLeave = () => {
      targetWeight = 0
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      cancelAnimationFrame(frame)
      onUnavailableRef.current?.()
    }

    // Suivi sur toute la fenêtre : l'amas réagit à l'approche du curseur,
    // pas seulement quand il entre dans le cadre.
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    container.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('webglcontextlost', onContextLost)

    const resizeObserver = new ResizeObserver(() => {
      // Un redimensionnement de fenêtre émet en rafale : on n'en garde qu'un par frame.
      if (resizePending) return
      resizePending = true
      requestAnimationFrame(() => {
        resizePending = false
        setSize()
      })
    })
    resizeObserver.observe(container)
    setSize()

    let onScreen = true
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
      },
      { threshold: 0 },
    )
    visibilityObserver.observe(container)

    let frame = 0
    let last = performance.now()
    let lastDraw = 0
    /** Horloge de la scène, en secondes. Alimente le défilement des rides. */
    let elapsedSeconds = 0
    const frameInterval = 1000 / targetFps

    const render = (now: number) => {
      frame = requestAnimationFrame(render)

      const delta = Math.min((now - last) / 1000, 0.1)
      last = now
      elapsedSeconds += delta

      if (!onScreen || document.hidden) return
      if (now - lastDraw < frameInterval) return
      lastDraw = now

      // Lissage exponentiel indépendant du framerate : le curseur exerce une
      // traction, il ne téléporte pas la force d'un point à l'autre.
      // Le suivi doit être isotrope : deux constantes différentes sur X et Y
      // font traîner un axe derrière l'autre et la force tire en biais.
      const follow = 1 - Math.exp(-delta * 30)
      const previousX = pointer.x
      const previousY = pointer.y

      pointer.x += (targetX - pointer.x) * follow
      pointer.y += (targetY - pointer.y) * follow
      pointer.weight += (targetWeight - pointer.weight) * (1 - Math.exp(-delta * 10))

      // Vitesse du curseur, dérivée de la position déjà lissée : brute, elle
      // serait hachée par l'échantillonnage irrégulier des événements pointeur.
      const smoothing = 1 - Math.exp(-delta * 18)
      pointer.vx += ((pointer.x - previousX) / delta - pointer.vx) * smoothing
      pointer.vy += ((pointer.y - previousY) / delta - pointer.vy) * smoothing

      simulation.step(pointer, delta)
      packBodies(simulation.bodies, positions)

      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform4fv(uBodies, positions)
      gl.uniform1f(uBoundRadius, boundingSphere(simulation.bodies, BLEND))
      gl.uniform1f(uPulse, simulation.pulse)
      gl.uniform1f(uTime, elapsedSeconds)

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('webglcontextlost', onContextLost)

      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      canvas.remove()
    }
  }, [renderScale, maxPixelRatio, steps, targetFps])

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden" />
}
