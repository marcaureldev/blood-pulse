/**
 * Déroulement du don et conseils de préparation.
 *
 * Les icônes sont désignées par des clés typées plutôt que par des composants :
 * ce module reste du contenu pur, et le mapping vers lucide se fait côté vue.
 * L'union exhaustive garantit qu'une clé inconnue est une erreur de compilation,
 * là où le proto de référence retombait silencieusement sur une icône par défaut.
 */

export type StepIcon = 'clipboard' | 'stethoscope' | 'droplet' | 'coffee'

export type ProcessStep = {
  num: number
  title: string
  duration: string
  description: string
  icon: StepIcon
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    num: 1,
    title: 'Accueil et inscription',
    duration: '5 min',
    description:
      "Vous présentez une pièce d'identité et remplissez un questionnaire de santé. L'équipe vous accueille et vous guide.",
    icon: 'clipboard',
  },
  {
    num: 2,
    title: 'Entretien médical',
    duration: '10 min',
    description:
      "Un médecin vérifie votre état de santé et votre historique. Lui seul confirme votre aptitude au don.",
    icon: 'stethoscope',
  },
  {
    num: 3,
    title: 'Prélèvement',
    duration: '8 à 10 min',
    description:
      'Installation confortable, le sang est prélevé (environ 450 ml). Vous ne ressentez pas la quantité, seulement une petite piqûre au début.',
    icon: 'droplet',
  },
  {
    num: 4,
    title: 'Repos et collation',
    duration: '15 à 20 min',
    description:
      "Un temps de repos avec une collation sucrée, le temps que l'organisme se rééquilibre. C'est aussi un moment d'échange avec l'équipe.",
    icon: 'coffee',
  },
]

export const TOTAL_DURATION = '45 à 60 minutes'

export type AdviceIcon =
  | 'water'
  | 'meal'
  | 'id'
  | 'alcohol'
  | 'clothes'
  | 'effort'
  | 'signal'
  | 'breathe'
  | 'still'
  | 'ask'
  | 'smoke'
  | 'warning'

export type AdviceItem = {
  icon: AdviceIcon
  text: string
}

export type AdvicePhase = {
  phase: 'before' | 'during' | 'after'
  title: string
  items: AdviceItem[]
}

export const ADVICE: AdvicePhase[] = [
  {
    phase: 'before',
    title: 'Avant le don',
    items: [
      { icon: 'water', text: "Buvez 1 à 2 verres d'eau dans l'heure qui précède." },
      { icon: 'meal', text: 'Mangez léger et équilibré. Ni à jeun, ni trop lourd.' },
      {
        icon: 'id',
        text: "Apportez une pièce d'identité : carte nationale ou carte CIP.",
      },
      { icon: 'alcohol', text: "Évitez l'alcool dans les 24 heures précédentes." },
      { icon: 'clothes', text: 'Prévoyez des manches faciles à relever.' },
      { icon: 'effort', text: "Pas d'effort physique intense juste avant." },
    ],
  },
  {
    phase: 'during',
    title: 'Pendant le don',
    items: [
      { icon: 'signal', text: "Signalez à l'équipe le moindre malaise ou vertige." },
      { icon: 'breathe', text: 'Détendez le bras et respirez calmement.' },
      { icon: 'still', text: 'Gardez le bras immobile pendant le prélèvement.' },
      { icon: 'ask', text: "L'équipe est là pour vous. Posez toutes vos questions." },
    ],
  },
  {
    phase: 'after',
    title: 'Après le don',
    items: [
      { icon: 'water', text: "Buvez abondamment dans les heures qui suivent." },
      { icon: 'effort', text: 'Évitez les efforts physiques intenses pendant 24 heures.' },
      { icon: 'smoke', text: 'Ne fumez pas pendant les 2 heures suivantes.' },
      { icon: 'meal', text: 'Prenez un repas équilibré dans les 2 heures.' },
      { icon: 'warning', text: 'Si vous vous sentez mal, asseyez-vous et prévenez quelqu’un.' },
    ],
  },
]
