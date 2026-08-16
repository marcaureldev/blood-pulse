import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'

export function FinalCta() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const media = gsap.matchMedia()

      media.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          gsap.to('[data-orb]', {
            // Valeur par cible : le premier anneau remonte, le second descend.
            yPercent: (index: number) => (index === 0 ? -16 : 12),
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          })
        },
        root,
      )

      return () => media.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-blood-600 py-[clamp(4rem,10vw,4rem)] text-center text-white"
    >
      <span
        data-orb
        aria-hidden="true"
        className="pointer-events-none absolute -left-67.5 -top-45 h-117.5 w-117.5 rounded-full border border-white/15 shadow-[0_0_0_25px_rgba(255,255,255,0.03),0_0_0_50px_rgba(255,255,255,0.025)]"
      />
      <span
        data-orb
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-75 -right-62.5 h-117.5 w-117.5 rounded-full border border-white/15 shadow-[0_0_0_25px_rgba(255,255,255,0.03),0_0_0_50px_rgba(255,255,255,0.025)]"
      />

      <div className="relative z-1 mx-auto max-w-4xl px-5 sm:px-8">
        <p className="flex items-center justify-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-blood-100">
          <span
            aria-hidden="true"
            className="h-1.75 w-1.75 rounded-full bg-white shadow-[0_0_0_5px_rgba(255,255,255,0.15)]"
          />
          Et si c'était aujourd'hui ?
        </p>

        <h2 className="mt-5 font-display text-[clamp(2.8rem,6vw,5.5rem)] font-semibold leading-[1.02] tracking-tight text-balance">
          Un petit oui peut
          <br />
          <span className="text-blood-200">changer une vie.</span>
        </h2>

        <p className="mx-auto mt-5 max-w-lg leading-relaxed text-blood-100 text-pretty">
          Faites le premier pas. Le test prend deux minutes.
        </p>

        <a
          href="#eligibilite"
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-blood-700 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blood-950/25"
        >
          Vérifier mon éligibilité
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  )
}