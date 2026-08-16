/**
 * Seuils d'éligibilité au don de sang.
 *
 * Source unique de vérité : la synthèse affichée dans « Qui peut donner » et le
 * simulateur lisent ces mêmes constantes. C'est délibéré - dans le proto de
 * référence, la carte des critères annonçait « 8 semaines pour les hommes »
 * pendant que le texte voisin disait « 4 mois », et rien dans le code ne
 * pouvait le signaler. Ici, changer un seuil met à jour les deux.
 *
 * Valeurs issues de l'annexe du brief. Elles sont simplifiées : seul un
 * entretien médical peut confirmer l'aptitude réelle au don.
 */

export const MIN_AGE = 18
export const MAX_AGE = 65
export const MIN_WEIGHT_KG = 50

/** Délai minimal entre deux dons, en mois. */
export const MIN_DELAY_MONTHS = {
  male: 3,
  female: 4,
} as const

export type Sex = keyof typeof MIN_DELAY_MONTHS

/**
 * Mention légale obligatoire selon le brief. Centralisée pour qu'elle soit
 * identique partout où elle apparaît.
 */
export const MEDICAL_DISCLAIMER =
  'Seul un entretien médical avec un professionnel de santé peut confirmer votre aptitude au don.'

/* -------------------------------------------------------------------------- */
/*  Simulateur                                                                 */
/* -------------------------------------------------------------------------- */

export type EligibilityInput = {
  age: number
  weightKg: number
  sex: Sex
  /** Date du dernier don au format ISO, ou `null` si la personne n'a jamais donné. */
  lastDonationDate: string | null
}

export type BlockerCode = 'age-min' | 'age-max' | 'weight' | 'delay'

export type EligibilityBlocker = {
  code: BlockerCode
  message: string
}

export type EligibilityResult = {
  eligible: boolean
  /** Tous les motifs, pas seulement le premier : un dossier peut en cumuler. */
  blockers: EligibilityBlocker[]
  /** Date à laquelle le délai entre deux dons sera écoulé. `null` hors de ce cas. */
  nextEligibleDate: Date | null
}

/**
 * Ajoute des mois à une date en bornant le quantième.
 *
 * `setMonth` seul déborde : au 30 novembre, ajouter trois mois donne un
 * 30 février que JavaScript reporte au 1er ou 2 mars. On ramène donc au dernier
 * jour du mois visé — sinon la date de prochaine éligibilité affichée serait
 * fausse de un à trois jours pour tous les dons de fin de mois.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime())
  const day = result.getDate()

  result.setDate(1)
  result.setMonth(result.getMonth() + months)

  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate()
  result.setDate(Math.min(day, lastDayOfTargetMonth))

  return result
}

/** Minuit, pour comparer des jours sans que l'heure courante ne s'en mêle. */
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Évalue une candidature au don.
 *
 * Fonction pure, `now` injecté : c'est ce qui la rend vérifiable en headless,
 * là où une logique noyée dans le composant ne se contrôlerait qu'à l'œil.
 *
 * Elle renvoie tous les motifs de refus et non le premier rencontré — quelqu'un
 * de 16 ans pesant 45 kg doit voir les deux, sinon il corrige un critère pour
 * se heurter au suivant.
 *
 * Ces règles sont une simplification : {@link MEDICAL_DISCLAIMER}.
 */
export function evaluateEligibility(input: EligibilityInput, now: Date): EligibilityResult {
  const blockers: EligibilityBlocker[] = []
  let nextEligibleDate: Date | null = null

  if (input.age < MIN_AGE) {
    blockers.push({
      code: 'age-min',
      message: `Le don est ouvert à partir de ${MIN_AGE} ans.`,
    })
  } else if (input.age > MAX_AGE) {
    blockers.push({
      code: 'age-max',
      message: `Le don de sang total s'arrête après ${MAX_AGE} ans.`,
    })
  }

  if (input.weightKg < MIN_WEIGHT_KG) {
    blockers.push({
      code: 'weight',
      message: `Un poids d'au moins ${MIN_WEIGHT_KG} kg est nécessaire pour que le volume prélevé reste sans risque.`,
    })
  }

  // Aucun don antérieur : le délai est réputé écoulé, conformément à l'annexe.
  if (input.lastDonationDate) {
    const last = parseLocalDate(input.lastDonationDate)
    const delayMonths = MIN_DELAY_MONTHS[input.sex]
    const available = addMonths(last, delayMonths)

    if (available > startOfDay(now)) {
      nextEligibleDate = available
      blockers.push({
        code: 'delay',
        message: `Il faut ${delayMonths} mois entre deux dons. Le vôtre remonte à moins de ${delayMonths} mois.`,
      })
    }
  }

  return { eligible: blockers.length === 0, blockers, nextEligibleDate }
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const formatEligibilityDate = (date: Date) => DATE_FORMAT.format(date)
