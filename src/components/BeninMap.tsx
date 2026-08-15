import {
  COUNTRY_PATH,
  DEPARTMENT_PATHS,
  MAP_VIEW_BOX,
  NEIGHBOUR_PATHS,
  projectToMap,
} from '@/data/beninMap'

export type CityMarker = {
  city: string
  lat: number
  lng: number
  /** Nombre de centres regroupés sous ce point. */
  count: number
}

type BeninMapProps = {
  markers: CityMarker[]
  activeCity: string | null
  onSelectCity?: (city: string | null) => void
}

/**
 * Carte du Bénin dans son contexte ouest-africain, en SVG pur.
 *
 * Aucune bibliothèque cartographique, aucune tuile, aucune requête réseau : les
 * contours sont projetés en Mercator à la compilation (voir beninMap.ts) et les
 * centres utilisent la même projection, donc s'alignent exactement dessus.
 *
 * La fenêtre déborde sur les pays limitrophes parce que le Bénin seul affiche
 * un ratio de 1:2,05 — un panneau bien trop haut pour la mise en page. Cadré
 * avec ses voisins, on retombe à 1:1,03.
 *
 * Les points sont regroupés par ville : à cette échelle, les deux centres de
 * Cotonou se recouvriraient entièrement. Le regroupement règle la lisibilité et
 * rend le point utile, puisqu'il pilote le filtre par ville.
 *
 * Le SVG est masqué aux technologies d'assistance : la liste adjacente expose
 * les mêmes centres sous forme de vrais boutons, et dupliquer douze arrêts de
 * tabulation nuirait à la navigation clavier au lieu de la servir.
 */
export function BeninMap({ markers, activeCity, onSelectCity }: BeninMapProps) {
  return (
    <svg
      viewBox={`0 0 ${MAP_VIEW_BOX.width} ${MAP_VIEW_BOX.height}`}
      className="block h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" floodColor="#3e0f0f" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Voisins : Togo, Ghana, Burkina, Niger, Nigeria — en net retrait. */}
      <g className="fill-cream-100 stroke-cream-200" strokeWidth={0.3}>
        {NEIGHBOUR_PATHS.map(({ name, path }) => (
          <path key={name} d={path} />
        ))}
      </g>

      {/* Départements du Bénin : la texture qui donne du relief au pays. */}
      <g className="fill-cream-200 stroke-cream-300" strokeWidth={0.3}>
        {DEPARTMENT_PATHS.map(({ name, path }) => (
          <path key={name} d={path} />
        ))}
      </g>

      {/* Contour national par-dessus : c'est lui qui désigne le sujet. */}
      <path
        d={COUNTRY_PATH}
        className="fill-none stroke-ink-400"
        strokeWidth={0.55}
        strokeLinejoin="round"
      />

      {markers.map((marker) => {
        const { x, y } = projectToMap(marker.lng, marker.lat)
        const active = marker.city === activeCity
        // Une ville qui concentre plusieurs centres pèse un peu plus lourd.
        const radius = 1.7 + Math.min(marker.count - 1, 3) * 0.3

        return (
          <g
            key={marker.city}
            transform={`translate(${x} ${y})`}
            className={onSelectCity ? 'cursor-pointer' : undefined}
            onClick={onSelectCity ? () => onSelectCity(active ? null : marker.city) : undefined}
          >
            {active && (
              <circle r={radius + 2.2} className="fill-blood-500/20 motion-safe:animate-pulse-soft" />
            )}

            {/* Cible de clic élargie : le pin visible est trop petit au doigt. */}
            {onSelectCity && <circle r={radius + 3} className="fill-transparent" />}

            <circle
              r={radius}
              className={`stroke-white transition-all ${active ? 'fill-blood-700' : 'fill-blood-600'}`}
              strokeWidth={0.55}
              filter="url(#pin-shadow)"
            />

            {marker.count > 1 && (
              <text
                y={0.8}
                textAnchor="middle"
                className="fill-white font-sans font-bold"
                fontSize={2.2}
              >
                {marker.count}
              </text>
            )}

            {active && (
              <text
                y={-radius - 2}
                textAnchor="middle"
                className="fill-ink-900 font-sans font-semibold"
                fontSize={3.2}
              >
                {marker.city}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}