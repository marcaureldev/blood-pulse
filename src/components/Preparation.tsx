import {
  CircleAlert,
  Coffee,
  Cigarette,
  Droplet,
  Dumbbell,
  FileText,
  GlassWater,
  Hand,
  Heart,
  MessageCircle,
  Shirt,
  Utensils,
  Wind,
  Wine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeading } from '@/components/SectionHeading'
import { useReveal } from '@/hooks/useReveal'
import { ADVICE, type AdviceIcon, type AdvicePhase } from '@/data/process'

const ADVICE_ICONS: Record<AdviceIcon, LucideIcon> = {
  water: GlassWater,
  meal: Utensils,
  id: FileText,
  alcohol: Wine,
  clothes: Shirt,
  effort: Dumbbell,
  signal: Hand,
  breathe: Wind,
  still: Hand,
  ask: MessageCircle,
  smoke: Cigarette,
  warning: CircleAlert,
}

type PhaseStyle = {
  surface: string
  border: string
  icon: LucideIcon
  badge: string
  accent: string
}

const PHASE_STYLES: Record<AdvicePhase['phase'], PhaseStyle> = {
  before: {
    surface: 'from-sage-50 to-sage-100',
    border: 'border-sage-200',
    icon: Droplet,
    badge: 'bg-sage-500',
    accent: 'text-sage-700',
  },
  during: {
    surface: 'from-blood-50 to-cream-100',
    border: 'border-blood-200/60',
    icon: Heart,
    badge: 'bg-blood-500',
    accent: 'text-blood-700',
  },
  after: {
    surface: 'from-amber-400/10 to-cream-100',
    border: 'border-amber-400/30',
    icon: Coffee,
    badge: 'bg-amber-500',
    accent: 'text-amber-600',
  },
}

export function Preparation() {
  const cards = useReveal<HTMLDivElement>({ items: 'article' })

  return (
    <section
      id="preparation"
      className="bg-linear-to-b from-cream-100 to-cream-50 py-20"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Préparation au don"
          title={
            <p>
              Bien préparé, c'est <br/> déjà à <span className="text-blood-600">moitié donné</span>
            </p>
          }
          description="Trois moments, trois listes simples. Suivez-les et votre don se passera en douceur."
        />

        <div ref={cards} className="mt-12 grid gap-6 md:grid-cols-3">
          {ADVICE.map((phase, index) => {
            const style = PHASE_STYLES[phase.phase]
            const PhaseIcon = style.icon

            return (
              <article
                key={phase.phase}
                className={`rounded-3xl border-2 bg-linear-to-br p-7 ${style.surface} ${style.border}`}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${style.badge}`}
                  >
                    <PhaseIcon className="h-6 w-6 text-white" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${style.accent}`}>
                      Phase {index + 1}
                    </p>
                    <h3 className="font-display text-xl font-semibold text-ink-900">
                      {phase.title}
                    </h3>
                  </div>
                </div>

                <ul className="space-y-3">
                  {phase.items.map((item) => {
                    const ItemIcon = ADVICE_ICONS[item.icon]

                    return (
                      <li key={item.text} className="flex items-start gap-3 text-sm text-ink-600">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 ${style.accent}`}
                        >
                          <ItemIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span className="leading-relaxed">{item.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
