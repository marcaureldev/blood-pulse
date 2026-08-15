import { Activity, ArrowRight, Ambulance} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeading } from '@/components/SectionHeading'
import { useReveal } from '@/hooks/useReveal'

type ImpactCard = {
  icon: LucideIcon
  title: string
  body: string
  /** Deux familles chromatiques pour distinguer l'urgence du soin au long cours. */
  tone: 'blood' | 'sage'
}

const IMPACT_CARDS: ImpactCard[] = [
  {
    icon: Ambulance,
    title: 'Pour les urgences',
    body: 'Hémorragie du post-partum, accidents, opérations : votre sang est là quand chaque seconde compte.',
    tone: 'blood',
  },
  {
    icon: Activity,
    title: 'Pour les maladies',
    body: 'Les patients atteints de cancers, de drépanocytose ou de paludisme grave ont besoin de transfusions régulières.',
    tone: 'sage',
  },
]

// const TIMELINE = [
//   { label: 'Votre don', detail: '10 min de prélèvement' },
//   { label: 'Trois composants', detail: 'Globules, plasma, plaquettes' },
//   { label: 'Des vies aidées', detail: 'Dans les jours qui suivent' },
// ]

const TONE_CLASSES: Record<ImpactCard['tone'], string> = {
  blood: 'bg-blood-50 text-blood-600',
  sage: 'bg-sage-100 text-sage-600',
}

/** Ombre douce et chaude, reprise du proto de référence. */
const CARD_SHADOW = 'shadow-[0_12px_32px_rgba(76,43,38,0.06)]'

export function WhyDonate() {
  const cards = useReveal()

  return (
    <section id="pourquoi" className="bg-cream-100 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Pourquoi donner"
          title={
            <>
              Le sang ne se fabrique pas.
              <br />
              <span className="text-blood-600">Il se donne.</span>
            </>
          }
          description="Aucun laboratoire n'en produit. Chaque poche vient de quelqu'un qui s'est déplacé."
        />

        <div
          ref={cards.ref}
          className={`reveal ${cards.visible ? 'is-visible' : ''} grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr]`}
        >
          {/* Carte d'impact principale */}
          <article
            className={`relative flex min-h-55 items-center gap-3.5 overflow-hidden rounded-[28px] bg-blood-600 p-7 pb-28 text-white lg:min-h-65 ${CARD_SHADOW}`}
          >
            {/* Anneaux concentriques, purement décoratifs */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-22 -right-20 h-60 w-60 rounded-full border border-white/20 shadow-[0_0_0_22px_rgba(255,255,255,0.05),0_0_0_44px_rgba(255,255,255,0.04)]"
            />

            <p className="relative font-display text-[clamp(3rem,6vw,5rem)] font-bold leading-[0.8] tracking-[-0.04em]">
              1
              <span className="mt-2.5 block font-sans text-[0.82rem] font-medium leading-none tracking-normal opacity-75">
                don
              </span>
            </p>

            <span aria-hidden="true" className="relative text-3xl opacity-50">
              =
            </span>

            <p className="relative font-display text-[clamp(3rem,6vw,5rem)] font-bold leading-[0.8] tracking-[-0.04em] text-blood-200">
              3
              <span className="mt-2.5 block font-sans text-[0.82rem] font-medium leading-none tracking-normal text-white opacity-75">
                vies
              </span>
            </p>

            <p className="absolute bottom-7 left-7 max-w-65 text-[0.8rem] leading-relaxed opacity-80">
              Votre don est séparé en trois composants et aide potentiellement trois patients
              différents.
            </p>

            <span aria-hidden="true" className="absolute bottom-8 right-7 flex gap-1.5">
              <span className="h-1.75 w-1.75 rounded-full bg-blood-200" />
              <span className="h-1.75 w-1.75 rounded-full bg-blood-200 opacity-55" />
              <span className="h-1.75 w-1.75 rounded-full bg-blood-200 opacity-25" />
            </span>
          </article>

          {IMPACT_CARDS.map(({ icon: Icon, title, body, tone }) => (
            <article
              key={title}
              className={`flex min-h-55 flex-col rounded-[28px] border border-cream-200 bg-white p-7 lg:min-h-65 ${CARD_SHADOW}`}
            >
              <span
                className={`mb-7 grid h-9.5 w-9.5 place-items-center rounded-xl ${TONE_CLASSES[tone]}`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={2} aria-hidden="true" />
              </span>

              <h3 className="font-display text-lg font-semibold tracking-tight text-ink-950">
                {title}
              </h3>
              <p className="mt-2.5 text-[0.84rem] leading-relaxed text-ink-500">{body}</p>

              <a
                href="#faq"
                className="group mt-auto inline-flex items-center gap-2 pt-6 text-[0.76rem] font-bold text-blood-600 transition-colors hover:text-blood-700"
              >
                En savoir plus
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
