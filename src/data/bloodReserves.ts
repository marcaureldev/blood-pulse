export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type ReserveLevel = 'critical' | 'low' | 'ok' | 'good';

export type BloodReserve = {
  group: BloodGroup;
  level: ReserveLevel;
  percentage: number;
  label: string;
};

export const BLOOD_RESERVES: BloodReserve[] = [
  { group: 'O-', level: 'critical', percentage: 22, label: 'Urgence vitale - besoin critique' },
  { group: 'O+', level: 'low', percentage: 38, label: 'Besoin élevé' },
  { group: 'A-', level: 'critical', percentage: 25, label: 'Urgence vitale - besoin critique' },
  { group: 'A+', level: 'ok', percentage: 55, label: 'Réserve modérée' },
  { group: 'B-', level: 'low', percentage: 35, label: 'Besoin élevé' },
  { group: 'B+', level: 'ok', percentage: 58, label: 'Réserve modérée' },
  { group: 'AB-', level: 'low', percentage: 40, label: 'Besoin élevé' },
  { group: 'AB+', level: 'good', percentage: 72, label: 'Réserve confortable' },
];

export const RESERVE_META: Record<ReserveLevel, { color: string; bg: string; text: string; label: string }> = {
  critical: { color: '#d32f2f', bg: 'bg-blood-100', text: 'text-blood-700', label: 'Critique' },
  low: { color: '#e8a317', bg: 'bg-amber-400/20', text: 'text-amber-600', label: 'Bas' },
  ok: { color: '#4f8059', bg: 'bg-sage-100', text: 'text-sage-700', label: 'Modéré' },
  good: { color: '#3d6747', bg: 'bg-sage-200', text: 'text-sage-800', label: 'Confortable' },
};

export const BLOOD_GROUP_FACTS: Record<BloodGroup, { canGiveTo: BloodGroup[]; canReceiveFrom: BloodGroup[]; rarity: string }> = {
  'O-': { canGiveTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canReceiveFrom: ['O-'], rarity: 'Donneur universel · 7% de la population' },
  'O+': { canGiveTo: ['O+', 'A+', 'B+', 'AB+'], canReceiveFrom: ['O+', 'O-'], rarity: 'Le plus commun · 38% de la population' },
  'A-': { canGiveTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'], rarity: 'Précieux · 7% de la population' },
  'A+': { canGiveTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'], rarity: 'Commun · 34% de la population' },
  'B-': { canGiveTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'], rarity: 'Rare · 2% de la population' },
  'B+': { canGiveTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'], rarity: 'Peu commun · 9% de la population' },
  'AB-': { canGiveTo: ['AB+', 'AB-'], canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'], rarity: 'Très rare · 1% de la population' },
  'AB+': { canGiveTo: ['AB+'], canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], rarity: 'Receveur universel · 3% de la population' },
};
