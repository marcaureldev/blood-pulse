import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RotateCcw } from 'lucide-react'
import * as THREE from 'three'
import { CLOSE, DOT_NONE, WIDE, type DotLayer } from '@/data/africaDots'
import { gsap, useGSAP } from '@/lib/gsap'

export type FlatMapCity = {
  city: string
  lat: number
  lng: number
  /** Centres retenus par les filtres. À 0, la ville est éteinte. */
  count: number
}

/** Cadre géographique visé par la caméra. */
export type MapFocus = {
  lonMin: number
  lonMax: number
  latMin: number
  latMax: number
}

type AfricaFlatMapProps = {
  cities: FlatMapCity[]
  activeCity: string | null
  onSelectCity: (city: string | null) => void
  /** Cadre à viser. `null` revient à la vue continentale. */
  focus: MapFocus | null
  busy?: boolean
}

const LON_SPAN = WIDE.window.lonMax - WIDE.window.lonMin
const LAT_SPAN = WIDE.window.latMax - WIDE.window.latMin

/** Vue par défaut : la fenêtre continentale entière. */
const WIDE_CENTER = {
  lon: (WIDE.window.lonMin + WIDE.window.lonMax) / 2,
  lat: (WIDE.window.latMin + WIDE.window.latMax) / 2,
}

/** Centre approximatif du Bénin, pour le repère du pays. */
const BENIN_ANCHOR = { lon: 2.35, lat: 9.4 }

/** Marges autour du cadre visé, en degrés. */
const FOCUS_PADDING = 0.6

/** Au-delà de ce zoom (pixels par degré), les villes se séparent assez pour être nommées. */
const CITY_LABEL_ZOOM = 26

const MAX_ZOOM = 140

/** Le dézoom manuel s'arrête à la vue de référence : au-delà, il n'y a que du vide. */
const MIN_ZOOM_FACTOR = 1

/** Sensibilité de la molette. Un cran de trackpad ne doit pas traverser l'échelle. */
const WHEEL_SENSITIVITY = 0.0022

/** Position de la caméra : longitude, latitude, et pixels par degré. */
type View = { lon: number; lat: number; zoom: number }

/**
 * Mesure du canvas, partagée par la scène et les repères HTML.
 *
 * Une seule source : celle de react-three-fiber, qui sert aussi à construire le
 * frustum. Mesurer le conteneur de son côté laissait les deux diverger dès que
 * la grille étirait la boîte, et la carte se retrouvait écrasée sur un axe.
 */
type Metrics = { width: number; height: number; baseZoom: number }

/**
 * Développe une trame en attributs de géométrie.
 *
 * Suite déterministe plutôt que `Math.random` : deux rendus successifs doivent
 * produire le même scintillement, sinon le moindre remontage le fait sauter.
 */
function toAttributes(layer: DotLayer) {
  const positions: number[] = []
  const classes: number[] = []
  const seeds: number[] = []
  let index = 0

  layer.grid.forEach((line, row) => {
    const lat = layer.window.latMax - (row + 0.5) * layer.step

    for (let column = 0; column < line.length; column += 1) {
      const value = line.charCodeAt(column) - 48
      if (value === DOT_NONE) continue

      positions.push(layer.window.lonMin + (column + 0.5) * layer.step, lat, 0)
      classes.push(value)
      seeds.push(((index * 2654435761) % 6283) / 1000)
      index += 1
    }
  })

  return {
    positions: new Float32Array(positions),
    classes: new Float32Array(classes),
    seeds: new Float32Array(seeds),
  }
}

const WIDE_ATTRIBUTES = toAttributes(WIDE)
const CLOSE_ATTRIBUTES = toAttributes(CLOSE)

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uZoom;
  uniform float uBaseZoom;
  uniform float uSize;
  uniform float uTwinkle;
  attribute float aClass;
  attribute float aSeed;
  varying float vAlpha;
  varying float vClass;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // Les points grossissent avec le zoom, mais pas indéfiniment : au-delà,
    // ils deviendraient des taches au lieu d'une trame.
    gl_PointSize = uSize * clamp(uZoom / uBaseZoom, 1.0, 2.4);

    vClass = aClass;
    vAlpha = 1.0 - uTwinkle + sin(uTime * 1.5 + aSeed) * uTwinkle;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uOther;
  uniform vec3 uAfrica;
  uniform vec3 uBenin;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vClass;

  void main() {
    // Un point carré rendu rond : on jette tout ce qui sort du disque.
    float distance = length(gl_PointCoord - vec2(0.5));
    if (distance > 0.5) discard;

    vec3 color = vClass > 2.5 ? uBenin : (vClass > 1.5 ? uAfrica : uOther);
    float edge = 1.0 - smoothstep(0.25, 0.5, distance);

    gl_FragColor = vec4(color, edge * vAlpha * uOpacity);
  }
`

type DotFieldProps = {
  attributes: ReturnType<typeof toAttributes>
  /** Diamètre du point, en pixels, à la vue de référence. */
  size: number
  /** Zoom à partir duquel le point commence à grossir. */
  referenceZoom: number | 'base'
  view: React.RefObject<View>
  metrics: React.RefObject<Metrics>
  /** Opacité visée, pour le fondu entre niveaux de détail. */
  opacityFor: (zoom: number) => number
  twinkle: number
}

function DotField({
  attributes,
  size,
  referenceZoom,
  view,
  metrics,
  opacityFor,
  twinkle,
}: DotFieldProps) {
  const material = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uZoom: { value: 1 },
      uBaseZoom: { value: 1 },
      uSize: { value: size },
      uTwinkle: { value: twinkle },
      uOpacity: { value: 1 },
      uOther: { value: new THREE.Color('#3a3938') },
      uAfrica: { value: new THREE.Color('#cdbe9e') },
      uBenin: { value: new THREE.Color('#f27575') },
    }),
    [size, twinkle],
  )

  useFrame((_, delta) => {
    const shader = material.current
    if (!shader) return

    const zoom = view.current.zoom

    shader.uniforms.uTime.value += delta
    shader.uniforms.uZoom.value = zoom
    // Lu à chaque image, jamais au rendu : la mesure n'existe pas encore au
    // premier passage, et un zoom de référence figé à 1 gonflerait les points.
    shader.uniforms.uBaseZoom.value =
      referenceZoom === 'base' ? metrics.current.baseZoom || 1 : referenceZoom
    shader.uniforms.uOpacity.value = opacityFor(zoom)
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
        <bufferAttribute attach="attributes-aClass" args={[attributes.classes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[attributes.seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        transparent
        depthWrite={false}
      />
    </points>
  )
}

function CameraRig({ view }: { view: React.RefObject<View> }) {
  const camera = useThree((state) => state.camera)

  useFrame(() => {
    const { lon, lat, zoom } = view.current
    const aimed = camera.rotation.x === 0 && camera.rotation.y === 0 && camera.rotation.z === 0

    if (aimed && camera.position.x === lon && camera.position.y === lat && camera.zoom === zoom) {
      return
    }

    camera.rotation.set(0, 0, 0)
    camera.position.set(lon, lat, 10)
    camera.zoom = zoom
    camera.updateProjectionMatrix()
  })

  return null
}

/**
 * Publie la mesure du canvas hors de la scène.
 *
 * C'est react-three-fiber qui fait autorité : sa taille sert à construire le
 * frustum, donc s'en écarter d'un pixel déforme la carte.
 */
function SizeProbe({
  metrics,
  onResize,
}: {
  metrics: React.RefObject<Metrics>
  onResize: () => void
}) {
  const size = useThree((state) => state.size)

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return

    metrics.current.width = size.width
    metrics.current.height = size.height
    metrics.current.baseZoom = Math.min(size.width / LON_SPAN, size.height / LAT_SPAN)
    onResize()
  }, [metrics, onResize, size.height, size.width])

  return null
}

/**
 * Carte plate de l'Afrique en trame de points, centrée sur le Bénin.
 *
 * Le rendu est une projection équirectangulaire : une unité de scène vaut un
 * degré, et la caméra orthographique donne directement le zoom en pixels par
 * degré. Placer une ville revient donc à lire sa longitude et sa latitude —
 * aucune projection à inverser, et les repères HTML tombent exactement sur les
 * points issus du même calcul.
 *
 * Deux trames se relaient selon le zoom : la vue continentale n'a pas la
 * finesse nécessaire une fois cadrée sur le Bénin, la vue rapprochée serait du
 * gaspillage à l'échelle du continent.
 *
 * Le canvas est purement décoratif et masqué aux technologies d'assistance.
 * Les repères sont des boutons HTML posés par-dessus : c'est la seule façon
 * d'avoir un focus visible et une navigation clavier sur du WebGL.
 */
export function AfricaFlatMap({
  cities,
  activeCity,
  onSelectCity,
  focus,
  busy = false,
}: AfricaFlatMapProps) {
  const surface = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLUListElement>(null)
  const country = useRef<HTMLLIElement>(null)
  const markers = useRef<(HTMLLIElement | null)[]>([])
  const drag = useRef<{ x: number; y: number } | null>(null)

  const metrics = useRef<Metrics>({ width: 0, height: 0, baseZoom: 1 })
  const view = useRef<View>({ lon: WIDE_CENTER.lon, lat: WIDE_CENTER.lat, zoom: 1 })

  const reduced = useRef(false)
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  /** Zoom qui fait tenir un cadre dans le canvas, marges comprises. */
  const zoomFor = useCallback((box: MapFocus) => {
    const { width, height, baseZoom } = metrics.current
    if (width === 0 || height === 0) return baseZoom

    const lonSpan = Math.max(box.lonMax - box.lonMin + FOCUS_PADDING * 2, 0.4)
    const latSpan = Math.max(box.latMax - box.latMin + FOCUS_PADDING * 2, 0.4)

    return Math.min(width / lonSpan, height / latSpan, MAX_ZOOM)
  }, [])

  /** Repositionne les repères HTML sur la projection courante. */
  const layout = useCallback(() => {
    const { width, height } = metrics.current
    if (width === 0) return

    const { lon, lat, zoom } = view.current
    const labelled = zoom >= CITY_LABEL_ZOOM

    const place = (element: HTMLElement | null, atLon: number, atLat: number, shown: boolean) => {
      if (!element) return

      element.style.transform = `translate3d(${(atLon - lon) * zoom + width / 2}px, ${
        -(atLat - lat) * zoom + height / 2
      }px, 0)`
      element.style.opacity = shown ? '1' : '0'
      element.style.pointerEvents = shown ? 'auto' : 'none'
    }

    // Hors zoom, les onze villes tiennent dans une dizaine de pixels : on
    // n'affiche que le repère du pays, sinon les étiquettes se recouvrent.
    place(country.current, BENIN_ANCHOR.lon, BENIN_ANCHOR.lat, !labelled)

    markers.current.forEach((element, index) => {
      const city = cities[index]
      if (city) place(element, city.lng, city.lat, labelled)
    })
  }, [cities])


  const zoomAt = useCallback(
    (factor: number, screenX: number, screenY: number) => {
      const { width, height, baseZoom } = metrics.current
      if (width === 0) return false

      const current = view.current.zoom
      const next = Math.min(Math.max(current * factor, baseZoom * MIN_ZOOM_FACTOR), MAX_ZOOM)
      if (Math.abs(next - current) < 0.0001) return false

      // Coordonnées géographiques sous le curseur, avant changement d'échelle.
      const offsetX = screenX - width / 2
      const offsetY = screenY - height / 2
      const lon = view.current.lon + offsetX / current
      const lat = view.current.lat - offsetY / current

      gsap.killTweensOf(view.current)
      view.current.zoom = next
      view.current.lon = lon - offsetX / next
      view.current.lat = lat + offsetY / next
      layout()

      return true
    },
    [layout],
  )

  /** Ramène la vue au cadre voulu, sans transition — au montage et au redimensionnement. */
  const settle = useCallback(() => {
    const target = focus
      ? {
          lon: (focus.lonMin + focus.lonMax) / 2,
          lat: (focus.latMin + focus.latMax) / 2,
          zoom: zoomFor(focus),
        }
      : { lon: WIDE_CENTER.lon, lat: WIDE_CENTER.lat, zoom: metrics.current.baseZoom }

    gsap.killTweensOf(view.current)
    Object.assign(view.current, target)
    layout()
  }, [focus, layout, zoomFor])

  // Déplacement de caméra : GSAP anime un objet nu, que la scène et les
  // repères lisent chacun de leur côté. Aucun rendu React pendant le vol.
  useGSAP(
    () => {
      if (metrics.current.width === 0) return

      const target = focus
        ? {
            lon: (focus.lonMin + focus.lonMax) / 2,
            lat: (focus.latMin + focus.latMax) / 2,
            zoom: zoomFor(focus),
          }
        : { lon: WIDE_CENTER.lon, lat: WIDE_CENTER.lat, zoom: metrics.current.baseZoom }

      gsap.to(view.current, {
        ...target,
        duration: reduced.current ? 0 : 1.1,
        ease: 'power3.inOut',
        overwrite: 'auto',
        onUpdate: layout,
      })
    },
    { dependencies: [focus, layout, zoomFor] },
  )

  useEffect(() => {
    const element = surface.current
    if (!element) return

    const onWheel = (event: WheelEvent) => {
      const box = element.getBoundingClientRect()
      const changed = zoomAt(
        Math.exp(-event.deltaY * WHEEL_SENSITIVITY),
        event.clientX - box.left,
        event.clientY - box.top,
      )

      if (changed) event.preventDefault()
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Un bouton de ville doit rester cliquable : on ne s'empare que du fond.
    if ((event.target as HTMLElement).closest('button')) return

    drag.current = { x: event.clientX, y: event.clientY }
    gsap.killTweensOf(view.current)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const from = drag.current
    if (!from) return

    const { zoom } = view.current
    view.current.lon -= (event.clientX - from.x) / zoom
    view.current.lat += (event.clientY - from.y) / zoom
    drag.current = { x: event.clientX, y: event.clientY }
    layout()
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  /** Zoom au clavier et par bouton, depuis le centre du cadre. */
  const step = (factor: number) => {
    const { width, height } = metrics.current
    zoomAt(factor, width / 2, height / 2)
  }

  const twinkle = reduced.current ? 0 : 0.18

  return (
    <div
      ref={surface}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={settle}
      className={`relative h-[clamp(24rem,68vh,44rem)] w-full touch-none overflow-hidden rounded-2xl transition-opacity duration-500 ${
        busy ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <Canvas
        orthographic
        // `rotation` explicite : sans elle, R3F vise l'origine et incline la caméra.
        camera={{
          position: [WIDE_CENTER.lon, WIDE_CENTER.lat, 10],
          rotation: [0, 0, 0],
          zoom: 1,
        }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        aria-hidden="true"
      >
        <SizeProbe metrics={metrics} onResize={settle} />
        <CameraRig view={view} />

        {/* Trame continentale : s'efface quand on entre dans le détail. */}
        <DotField
          attributes={WIDE_ATTRIBUTES}
          size={2.6}
          referenceZoom="base"
          view={view}
          metrics={metrics}
          twinkle={twinkle}
          opacityFor={(zoom) => 1 - THREE.MathUtils.smoothstep(zoom, 40, 90)}
        />

        {/* Trame de détail : n'apparaît qu'une fois le zoom engagé. */}
        <DotField
          attributes={CLOSE_ATTRIBUTES}
          size={2.2}
          referenceZoom={CITY_LABEL_ZOOM}
          view={view}
          metrics={metrics}
          twinkle={twinkle}
          opacityFor={(zoom) => THREE.MathUtils.smoothstep(zoom, 30, 70)}
        />
      </Canvas>

      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        {[
          { label: 'Zoomer', sign: '+', factor: 1.6 },
          { label: 'Dézoomer', sign: '−', factor: 1 / 1.6 },
        ].map((control) => (
          <button
            key={control.sign}
            type="button"
            onClick={() => step(control.factor)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-800 bg-ink-900/90 text-base font-semibold text-cream-100 transition-colors hover:border-blood-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blood-400"
          >
            <span aria-hidden="true">{control.sign}</span>
            <span className="sr-only">{control.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={settle}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-800 bg-ink-900/90 text-cream-100 transition-colors hover:border-blood-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blood-400"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Revenir à la vue d’ensemble</span>
        </button>
      </div>

      <ul ref={overlay} className="pointer-events-none absolute inset-0">
        {/* Repère du pays, tant que les villes ne sont pas séparables. */}
        <li ref={country} className="absolute left-0 top-0 transition-opacity duration-300">
          <span className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-ink-950">
            Bénin
            <span className="tabular-nums text-ink-400">
              {cities.reduce((total, city) => total + city.count, 0)}
            </span>
          </span>
        </li>

        {cities.map((city, index) => {
          const active = city.city === activeCity
          const available = city.count > 0

          return (
            <li
              key={city.city}
              ref={(element) => {
                markers.current[index] = element
              }}
              className="absolute left-0 top-0 opacity-0 transition-opacity duration-300"
            >
              <button
                type="button"
                disabled={!available}
                aria-pressed={active}
                onClick={() => onSelectCity(active ? null : city.city)}
                className={`-translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.7rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blood-400 ${
                  active
                    ? 'bg-blood-600 text-white'
                    : available
                      ? 'bg-white text-ink-950 hover:bg-blood-100'
                      : 'cursor-not-allowed bg-ink-900 text-ink-400'
                }`}
              >
                {city.city}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
