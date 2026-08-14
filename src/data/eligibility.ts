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
