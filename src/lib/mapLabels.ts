import { DOTS_VIEW_BOX } from '@/data/beninDots'
import { projectToMap } from '@/data/beninMap'

export type MapCity = {
  city: string
  lat: number
  lng: number
  /** Centres retenus par les filtres. À 0, la ville reste située mais éteinte. */
  count: number
}

export type PlacedCity = MapCity & {
  /** Position géographique du point, dans le repère de la viewBox. */
  x: number
  y: number
  side: 'left' | 'right'
  /** Ordonnée de l'étiquette, écartée de sa ville quand la place manque. */
  labelY: number
}

/** Abscisse de partage : à gauche du pays, l'étiquette part dans la gouttière gauche. */
const SPLIT_X = 49.6

/** Bords intérieurs des gouttières. Le pays s'étend de x=30,2 à x=69,0. */
export const LEFT_ANCHOR = 29.4
export const RIGHT_ANCHOR = 69.8

/** Hauteur d'une pilule, en unités de viewBox. Sert d'écart minimal. */
const LABEL_GAP = 3.8
const LABEL_TOP = DOTS_VIEW_BOX.y + 3
const LABEL_BOTTOM = DOTS_VIEW_BOX.y + DOTS_VIEW_BOX.height - 3

/** Position horizontale dans la fenêtre de la carte, en pourcentage. */
export const toLeft = (x: number) => ((x - DOTS_VIEW_BOX.x) / DOTS_VIEW_BOX.width) * 100

/** Position verticale dans la fenêtre de la carte, en pourcentage. */
export const toTop = (y: number) => ((y - DOTS_VIEW_BOX.y) / DOTS_VIEW_BOX.height) * 100

/**
 * Écarte verticalement une colonne d'étiquettes qui se recouvrent.
 *
 * Une passe descendante impose l'écart minimal, une passe remontante rattrape
 * le débordement en bas de cadre. Le tableau est modifié sur place.
 */
function spreadColumn(column: PlacedCity[]) {
  const sorted = [...column].sort((first, second) => first.y - second.y)

  for (let index = 1; index < sorted.length; index += 1) {
    sorted[index].labelY = Math.max(sorted[index].labelY, sorted[index - 1].labelY + LABEL_GAP)
  }

  const last = sorted.at(-1)
  if (!last || last.labelY <= LABEL_BOTTOM) return

  last.labelY = LABEL_BOTTOM

  for (let index = sorted.length - 2; index >= 0; index -= 1) {
    sorted[index].labelY = Math.max(
      LABEL_TOP,
      Math.min(sorted[index].labelY, sorted[index + 1].labelY - LABEL_GAP),
    )
  }
}

/**
 * Projette les villes et place leurs étiquettes dans les deux gouttières.
 *
 * Cinq des onze villes d'accueil tiennent dans une bande de 3,5 unités sur le
 * littoral : à leur ordonnée réelle, leurs pilules se superposeraient. Elles
 * sont donc écartées juste ce qu'il faut, et un trait de rappel relie chacune
 * à son point. Le calcul porte toujours sur la liste complète des villes, pour
 * qu'un filtre qui en éteint une ne déplace pas les autres.
 */
export function placeCities(cities: MapCity[]): PlacedCity[] {
  const placed: PlacedCity[] = cities.map((entry) => {
    const { x, y } = projectToMap(entry.lng, entry.lat)

    return { ...entry, x, y, side: x < SPLIT_X ? 'left' : 'right', labelY: y }
  })

  spreadColumn(placed.filter((entry) => entry.side === 'left'))
  spreadColumn(placed.filter((entry) => entry.side === 'right'))

  return placed
}
