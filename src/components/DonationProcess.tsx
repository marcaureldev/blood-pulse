import { ArrowRight, ClipboardList, Clock, Coffee, Droplet, Stethoscope } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeading } from '@/components/SectionHeading'
import { useReveal } from '@/hooks/useReveal'
import { PROCESS_STEPS, TOTAL_DURATION, type StepIcon } from '@/data/process'

const STEP_ICONS: Record<StepIcon, LucideIcon> = {
  clipboard: ClipboardList,
  stethoscope: Stethoscope,
  droplet: Droplet,
  coffee: Coffee,
}

export function DonationProcess() {
  const { ref, visible } = useReveal()

  return (
    <section id="deroulement" className="bg-cream-50 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            stacked
            eyebrow="Comment ça se passe"
            title={
              <>
                Pas à pas, sans <span className="text-blood-600">surprise</span>
              </>
            }
            description="Le don de sang n'est pas un événement mystérieux. Voici exactement ce qui vous attend, minute par minute."
          />

          <p className="flex shrink-0 items-center gap-2 rounded-2xl border border-blood-200/60 bg-blood-50 px-6 py-4 text-blood-700">
            <Clock className="h-5 w-5" aria-hidden="true" />
            <span className="font-display text-lg font-bold">Durée totale : {TOTAL_DURATION}</span>
          </p>
        </div>

        <div ref={ref} className="relative">
          {/* Fil conducteur, aligné sur le centre des pastilles (96px / 2). */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-12 hidden h-0.5 bg-cream-300 lg:block"
          >
            <div
              className={`h-full origin-left bg-blood-400 ${visible ? 'animate-grow-w' : 'scale-x-0'}`}
            />
          </div>

          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step) => {
              const Icon = STEP_ICONS[step.icon]

              return (
                <li
                  key={step.num}
                  className={`relative`}
                >
                  <div className="relative z-10 mx-auto mb-4 flex h-24 w-24 flex-col items-center justify-center rounded-full border-[1.5px] border-cream-400 bg-white transition-colors duration-300 hover:border-blood-500 lg:mx-0">
                    <Icon className="mb-1 h-8 w-8 text-blood-500" strokeWidth={1.5} aria-hidden="true" />
                    <span className="text-xs font-semibold text-ink-400">Étape {step.num}</span>
                  </div>

                  <div className="text-center lg:text-left">
                    <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blood-50 px-2.5 py-1 text-xs font-semibold text-blood-600">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {step.duration}
                    </p>
                    <h3 className="mb-2 font-display text-lg font-semibold text-ink-900">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-500">{step.description}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="mt-12 text-center">
          <a
            href="#preparation"
            className="group inline-flex items-center gap-2 font-semibold text-blood-600 transition-colors hover:text-blood-700"
          >
            Comment me préparer ?
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </section>
  )
}
