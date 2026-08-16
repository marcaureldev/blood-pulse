import { useRef } from 'react'
import { ArrowRight, ClipboardList, Clock, Coffee, Droplet, Stethoscope } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeading } from '@/components/SectionHeading'
import { gsap, useGSAP } from '@/lib/gsap'
import { PROCESS_STEPS, TOTAL_DURATION, type StepIcon } from '@/data/process'

const STEP_ICONS: Record<StepIcon, LucideIcon> = {
  clipboard: ClipboardList,
  stethoscope: Stethoscope,
  droplet: Droplet,
  coffee: Coffee,
}

const SCROLL_PER_STEP = 320


const OUTRO_SPAN = 0.6

export function DonationProcess() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = section.current
      const steps = track.current
      if (!root || !steps) return

      const media = gsap.matchMedia()

      media.add(
        {
          pinnable: '(min-width: 1024px) and (min-height: 760px)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const conditions = context.conditions ?? {}
          if (conditions.reduced) return

          const items = gsap.utils.toArray<HTMLElement>('li', steps)
          if (items.length === 0) return

          if (!conditions.pinnable) {
            gsap.from(items, {
              autoAlpha: 0,
              y: 28,
              duration: 0.6,
              ease: 'power3.out',
              stagger: 0.15,
              scrollTrigger: { trigger: steps, start: 'top 85%', once: true },
            })
            return
          }

          const line = steps.querySelector('[data-progress]')
          const outro = root.querySelector('[data-outro]')
          const reachedColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-blood-500')
            .trim()

          const total = items.length + OUTRO_SPAN

          const timeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: `+=${total * SCROLL_PER_STEP}`,
              pin: true,
              anticipatePin: 1,
              scrub: 1,
            },
          })

          timeline.set(line, { scaleX: 0 })

          items.forEach((item, index) => {
            const label = `etape-${index + 1}`

            timeline
              .addLabel(label, index)
              .fromTo(
                item,
                { autoAlpha: 0, y: 32 },
                { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' },
                label,
              )
              .to(line, { scaleX: (index + 1) / items.length, duration: 1 }, label)

            if (reachedColor) {
              timeline.to(
                item.querySelector('[data-dot]'),
                { borderColor: reachedColor, duration: 0.4 },
                label,
              )
            }
          })
          
          timeline.from(
            outro,
            { autoAlpha: 0, y: 20, duration: OUTRO_SPAN, ease: 'power2.out' },
            items.length,
          )
        },
        section,
      )

      return () => media.revert()
    },
    { scope: section },
  )

  return (
    <section ref={section} id="deroulement" className="bg-cream-50 py-20">
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
            description="Rien d'imprévu, rien d'inconnu. Voici ce qui vous attend, minute par minute."
          />

          <p className="flex shrink-0 items-center gap-2 rounded-2xl border border-blood-200/60 bg-blood-50 px-6 py-4 text-blood-700">
            <Clock className="h-5 w-5" aria-hidden="true" />
            <span className="font-display text-lg font-bold">Durée totale : {TOTAL_DURATION}</span>
          </p>
        </div>

        <div ref={track} className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-12 hidden h-0.5 lg:block"
          >
            <div data-progress className="h-full origin-left bg-blood-400" />
          </div>

          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step) => {
              const Icon = STEP_ICONS[step.icon]

              return (
                <li key={step.num} className="relative">
                  <div
                    data-dot
                    className="relative z-10 mx-auto mb-4 flex h-24 w-24 flex-col items-center justify-center rounded-full border-[1.5px] border-cream-400 bg-white lg:mx-0"
                  >
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

        <div data-outro className="mt-12 text-center">
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