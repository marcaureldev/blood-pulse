import { useMemo, useRef } from 'react'
import { BENIN_BANDS, DOTS_VIEW_BOX, NEIGHBOUR_BANDS, bandToPath } from '@/data/beninDots'
import { gsap, useGSAP } from '@/lib/gsap'
import {
  LEFT_ANCHOR,
  RIGHT_ANCHOR,
  placeCities,
  toLeft,
  toTop,
  type MapCity,
} from '@/lib/mapLabels'

export type DotMapCity = MapCity


const BANDS = Array.from(
  { length: Math.max(BENIN_BANDS.length, NEIGHBOUR_BANDS.length) },
  (_, ring) => [
    { key: `alentours-${ring}`, band: NEIGHBOUR_BANDS[ring] ?? '', benin: false },
    { key: `benin-${ring}`, band: BENIN_BANDS[ring] ?? '', benin: true },
  ],
)
  .flat()
  .filter((entry) => entry.band !== '')
  .map((entry) => ({ key: entry.key, benin: entry.benin, d: bandToPath(entry.band) }))

type BeninDotMapProps = {
  cities: DotMapCity[]
  activeCity: string | null
  onSelectCity: (city: string | null) => void
  /** Met la trame en veille pendant un chargement. */
  busy?: boolean
}

/**
 * Carte du Bénin en trame de points, avec une étiquette par ville d'accueil.
 *
 * Le fond est un échantillonnage des contours réels (voir beninDots.ts), donc
 * les points et les villes partagent la même projection Mercator : un centre
 * tombe exactement sur son territoire.
 *
 * Le SVG n'est que décor — il est masqué aux technologies d'assistance. Chaque
 * ville n'expose qu'un seul bouton, qui se place dans les gouttières à partir
 * de `lg` et redevient une puce sous la carte en dessous. Une seule commande
 * par ville, donc un seul arrêt de tabulation, et une cible tactile qui reste
 * confortable là où le point ne ferait que huit pixels.
 */
export function BeninDotMap({ cities, activeCity, onSelectCity, busy = false }: BeninDotMapProps) {
  const root = useRef<HTMLDivElement>(null)

  const placed = useMemo(() => placeCities(cities), [cities])

  useGSAP(
    () => {
      const media = gsap.matchMedia()

      media.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          const timeline = gsap.timeline({
            scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
          })

          // Un tween par anneau, pas un par point : la trame se déploie depuis
          // Cotonou en 36 cibles au lieu de 1237.
          timeline
            .from('[data-band]', {
              autoAlpha: 0,
              duration: 0.5,
              stagger: 0.035,
              ease: 'power1.out',
            })
            .from(
              '[data-pin]',
              { attr: { r: 0 }, autoAlpha: 0, duration: 0.4, stagger: 0.05, ease: 'back.out(2)' },
              '-=0.5',
            )
            .from(
              '[data-label]',
              { autoAlpha: 0, y: 6, duration: 0.4, stagger: 0.04, ease: 'power2.out' },
              '<0.1',
            )
        },
        root,
      )

      return () => media.revert()
    },
    { scope: root },
  )

  return (
    <div ref={root} className="lg:relative">
      <svg
        viewBox={`${DOTS_VIEW_BOX.x} ${DOTS_VIEW_BOX.y} ${DOTS_VIEW_BOX.width} ${DOTS_VIEW_BOX.height}`}
        className={`block h-auto w-full transition-opacity duration-500 ${busy ? 'opacity-40' : 'opacity-100'}`}
        aria-hidden="true"
        focusable="false"
      >
        {/* Le Bénin plus clair et plus gros que ses voisins : c'est lui le sujet. */}
        {BANDS.map((entry) => (
          <path
            key={entry.key}
            data-band
            d={entry.d}
            className={entry.benin ? 'stroke-cream-300/80' : 'stroke-ink-700'}
            strokeWidth={entry.benin ? 1.15 : 0.85}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* Traits de rappel : ils relient l'étiquette écartée à sa ville. */}
        {placed.map((entry) => (
          <line
            key={`rappel-${entry.city}`}
            x1={entry.side === 'left' ? LEFT_ANCHOR : RIGHT_ANCHOR}
            y1={entry.labelY}
            x2={entry.x}
            y2={entry.y}
            strokeWidth={0.25}
            className={`hidden lg:block ${
              entry.city === activeCity
                ? 'stroke-blood-400/80'
                : entry.count > 0
                  ? 'stroke-ink-600'
                  : 'stroke-ink-800'
            }`}
          />
        ))}

        {placed.map((entry) => {
          const active = entry.city === activeCity
          const radius = entry.count > 1 ? 1.5 : 1.2

          return (
            <g key={`pin-${entry.city}`}>
              {active && (
                <circle
                  cx={entry.x}
                  cy={entry.y}
                  r={radius + 2.4}
                  className="fill-blood-500/25 motion-safe:animate-pulse-soft"
                />
              )}

              <circle
                data-pin
                cx={entry.x}
                cy={entry.y}
                r={radius}
                className={
                  active
                    ? 'fill-blood-400'
                    : entry.count > 0
                      ? 'fill-blood-500'
                      : 'fill-ink-600'
                }
              />
            </g>
          )
        })}
      </svg>

      <ul className="mt-5 flex flex-wrap justify-center gap-1.5 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:block">
        {placed.map((entry) => {
          const active = entry.city === activeCity
          const available = entry.count > 0

          return (
            <li
              key={entry.city}
              style={{
                '--x': `${toLeft(entry.side === 'left' ? LEFT_ANCHOR : RIGHT_ANCHOR)}%`,
                '--y': `${toTop(entry.labelY)}%`,
              } as React.CSSProperties}
              className={`lg:absolute lg:left-(--x) lg:top-(--y) lg:-translate-y-1/2 ${
                entry.side === 'left' ? 'lg:-translate-x-full lg:pr-2' : 'lg:pl-2'
              }`}
            >
              {/* La pilule active est en blood-600 et non blood-500 : le blanc
                  n'atteint 4,5:1 qu'à partir de cette nuance, et le libellé est
                  trop petit pour relever du seuil « grand texte ». */}
              <button
                data-label
                type="button"
                disabled={!available}
                aria-pressed={active}
                onClick={() => onSelectCity(active ? null : entry.city)}
                className={`pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blood-400 lg:px-2.5 lg:py-1 lg:text-[0.7rem] ${
                  active
                    ?
                      'bg-blood-600 text-white'
                    : available
                      ? 'bg-white text-ink-950 hover:bg-blood-100'
                      : 'cursor-not-allowed bg-ink-900 text-ink-400'
                }`}
              >
                {entry.city}

                {/* Pendant le chargement, aucun compte : « 0 » annoncerait une
                    absence de centre au lieu d'une absence de données. */}
                {!busy && (
                  <>
                    <span
                      className={`tabular-nums ${
                        active ? 'text-white' : available ? 'text-ink-400' : 'text-ink-600'
                      }`}
                    >
                      {entry.count}
                    </span>
                    <span className="sr-only">
                      {available
                        ? `centre${entry.count > 1 ? 's' : ''} — ${active ? 'filtre actif' : 'filtrer sur cette ville'}`
                        : 'centre correspondant à votre recherche'}
                    </span>
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
