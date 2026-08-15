/**
 * État des réserves par groupe sanguin.
 *
 * ⚠️ NIVEAUX ILLUSTRATIFS. Les pourcentages ci-dessous sont composés pour ce
 * projet : aucun flux public ne publie les stocks de l'Agence Nationale pour la
 * Transfusion Sanguine. La section affiche un avertissement explicite ; en
 * production, ces valeurs viendraient d'une API et non d'un fichier statique.
 *
 * Les compatibilités transfusionnelles, elles, sont des faits médicaux établis.
 * La fréquence des groupes est en revanche restée qualitative à dessein : elle
 * varie fortement d'une population à l'autre, et les chiffres européens qu'on
 * recopie partout ne décrivent pas l'Afrique de l'Ouest.
 */

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export type ReserveLevel = 'critical' | 'low' | 'ok' | 'good'

export type BloodReserve = {
  group: BloodGroup
  level: ReserveLevel
  /** Taux de remplissage de la réserve, en pourcentage de la cible. */
  percentage: number
  label: string
}

/** Date du relevé affiché. À faire évoluer avec les niveaux ci-dessous. */
export const RESERVES_UPDATED_AT = '14 août 2026'

export const BLOOD_RESERVES: BloodReserve[] = [
  { group: 'O-', level: 'critical', percentage: 22, label: 'Urgence vitale — besoin critique' },
  { group: 'O+', level: 'low', percentage: 38, label: 'Besoin élevé' },
  { group: 'A-', level: 'critical', percentage: 25, label: 'Urgence vitale — besoin critique' },
  { group: 'A+', level: 'ok', percentage: 55, label: 'Réserve modérée' },
  { group: 'B-', level: 'low', percentage: 35, label: 'Besoin élevé' },
  { group: 'B+', level: 'ok', percentage: 58, label: 'Réserve modérée' },
  { group: 'AB-', level: 'low', percentage: 40, label: 'Besoin élevé' },
  { group: 'AB+', level: 'good', percentage: 72, label: 'Réserve confortable' },
]

/**
 * Habillage de chaque palier. `bar` est une classe et non un code hexadécimal :
 * la couleur reste ainsi définie une seule fois, dans les jetons du thème.
 */
export const RESERVE_META: Record<
  ReserveLevel,
  { bar: string; bg: string; text: string; label: string }
> = {
  critical: { bar: 'bg-blood-600', bg: 'bg-blood-100', text: 'text-blood-700', label: 'Critique' },
  low: { bar: 'bg-amber-500', bg: 'bg-amber-400/20', text: 'text-amber-600', label: 'Bas' },
  ok: { bar: 'bg-sage-500', bg: 'bg-sage-100', text: 'text-sage-700', label: 'Modéré' },
  good: { bar: 'bg-sage-600', bg: 'bg-sage-200', text: 'text-sage-800', label: 'Confortable' },
}

export type BloodGroupFacts = {
  canGiveTo: BloodGroup[]
  canReceiveFrom: BloodGroup[]
  /** Rôle transfusionnel et fréquence, formulés sans chiffre de population. */
  rarity: string
}

export const BLOOD_GROUP_FACTS: Record<BloodGroup, BloodGroupFacts> = {
  'O-': {
    canGiveTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    canReceiveFrom: ['O-'],
    rarity: 'Donneur universel · groupe rare, toujours attendu',
  },
  'O+': {
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    rarity: 'Le plus répandu · le plus consommé aussi',
  },
  'A-': {
    canGiveTo: ['A+', 'A-', 'AB+', 'AB-'],
    canReceiveFrom: ['A-', 'O-'],
    rarity: 'Peu fréquent · précieux pour tous les A et AB',
  },
  'A+': {
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    rarity: 'Fréquent · besoin constant',
  },
  'B-': {
    canGiveTo: ['B+', 'B-', 'AB+', 'AB-'],
    canReceiveFrom: ['B-', 'O-'],
    rarity: 'Rare · difficile à remplacer',
  },
  'B+': {
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    rarity: 'Assez fréquent · besoin régulier',
  },
  'AB-': {
    canGiveTo: ['AB+', 'AB-'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    rarity: 'Le plus rare · donneur de plasma universel',
  },
  'AB+': {
    canGiveTo: ['AB+'],
    canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    rarity: 'Receveur universel · peu fréquent',
  },
}
