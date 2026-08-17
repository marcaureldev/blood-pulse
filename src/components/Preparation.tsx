import { useCallback, useEffect, useRef, useState } from 'react'
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
import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeading } from '@/components/SectionHeading'
import { gsap, useGSAP } from '@/lib/gsap'
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

type PhaseKey = AdvicePhase['phase']

type Palette = {
  /** Version assombrie, seule utilisée pour du texte et les fonds de puces. */
  deep: string
  /** Fond des conseils. */
  tint: string
  /** Bordure des conseils. */
  line: string
}

/** Nom de la variable CSS portant chaque teinte, sur le conteneur de section. */
const PALETTE_VARS: Record<keyof Palette, string> = {
  deep: '--pd',
  tint: '--pt',
  line: '--pl',
}

const PALETTE_KEYS = Object.keys(PALETTE_VARS) as (keyof Palette)[]

const PHASES: Record<
  PhaseKey,
  { icon: LucideIcon; moment: string; palette: Palette }
> = {
  before: {
    icon: Droplet,
    moment: 'Dans les heures qui précèdent',
    palette: { deep: '#32533a', tint: '#eef4ef', line: '#cfe0d4' },
  },
  during: {
    icon: Heart,
    moment: 'Une dizaine de minutes',
    palette: { deep: '#b02525', tint: '#fdeeee', line: '#f9d5d5' },
  },
  after: {
    icon: Coffee,
    moment: 'Les 24 heures suivantes',
    palette: { deep: '#8f6100', tint: '#fdf4e2', line: '#f2dfae' },
  },
}

/**
 * Durées et décalages, en secondes.*/
const MOTION = {
  exit: 0.34,
  enter: 0.66,
  paint: 0.75,
  slide: 0.55,
  stagger: 0.07,
  /** Recouvrement : l'entrée démarre avant la fin de la sortie. */
  overlap: 0.2,
}

const HALO: CSSProperties = {
  background: [
    'radial-gradient(42rem 26rem at 14% 6%, rgba(235,220,191,0.6), transparent 68%)',
    'radial-gradient(34rem 22rem at 92% 96%, rgba(235,220,191,0.6), transparent 70%)',
  ].join(','),
}


const PILL: CSSProperties = {
  backgroundColor: 'var(--pt)',
  borderColor: 'var(--pl)',
}

/** Dégradé de la carte : la teinte de la phase, délavée vers le blanc. */
const CARD_SURFACE: CSSProperties = {
  backgroundImage: 'linear-gradient(to bottom right, var(--pt), white)',
}

/**
 * Préparation au don : trois moments, en onglets à surbrillance glissante.*/
export function Preparation() {
  const [active, setActive] = useState(0)

  const shell = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const highlight = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLButtonElement | null)[]>([])
  const panels = useRef<(HTMLDivElement | null)[]>([])

  /** Phase quittée. `null` tant que rien n'a encore été peint. */
  const previous = useRef<number | null>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)

  const live = useRef<Palette>({ ...PHASES[ADVICE[0].phase].palette })
  const paint = useRef({ t: 1 })

  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  
  const tallest = useCallback(() => {
    let height = 0

    for (const panel of panels.current) {
      const card = panel?.querySelector<HTMLElement>('[data-card]')
      if (!card) continue

      card.style.height = 'auto'
      height = Math.max(height, card.offsetHeight)
      card.style.height = ''
    }

    return height
  }, [])

  useGSAP(
    () => {
      const host = shell.current
      const stageEl = stage.current
      const bar = highlight.current
      const row = rows.current[active]
      const incoming = panels.current[active]
      if (!host || !stageEl || !bar || !row || !incoming) return

      const from = previous.current
      previous.current = active

      const outgoing = from === null || from === active ? null : panels.current[from]

      const palette = PHASES[ADVICE[active].phase].palette
      const seat = { y: row.offsetTop, height: row.offsetHeight }
      const items = incoming.querySelectorAll<HTMLElement>('[data-advice]')
      const icons = incoming.querySelectorAll<HTMLElement>('[data-advice-icon]')

      /** Pose les quatre teintes sans transition. */
      const applyPalette = () => {
        for (const key of PALETTE_KEYS) {
          live.current[key] = palette[key]
          host.style.setProperty(PALETTE_VARS[key], palette[key])
        }
      }

      timeline.current?.kill()

      // Premier passage, ou « animations réduites » : on pose l'état d'arrivée.
      if (from === null || reduced) {
        applyPalette()
        gsap.set(bar, seat)
        gsap.set(stageEl, { height: tallest() })
        gsap.set(panels.current.filter(Boolean) as HTMLDivElement[], { autoAlpha: 0 })
        gsap.set(incoming, { autoAlpha: 1 })
        gsap.set([...items, ...icons], { clearProps: 'opacity,visibility,transform' })
        return
      }

      /**
       * Un seul tween repeint tout.
       */
      const mix = PALETTE_KEYS.map(
        (key) => [key, gsap.utils.interpolate(live.current[key], palette[key])] as const,
      )
      paint.current.t = 0

      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } })
      timeline.current = tl

      tl.to(
        paint.current,
        {
          t: 1,
          duration: MOTION.paint,
          ease: 'sine.inOut',
          onUpdate: () => {
            for (const [key, at] of mix) {
              const value = at(paint.current.t)
              live.current[key] = value
              host.style.setProperty(PALETTE_VARS[key], value)
            }
          },
        },
        0,
      )

      // La pilule glisse jusqu'à la ligne choisie, en même temps que la teinte.
      tl.to(bar, { ...seat, duration: MOTION.slide, ease: 'power3.inOut' }, 0)

      // Sortie : du bas vers le haut, l'inverse de l'ordre d'arrivée.
      if (outgoing) {
        tl.to(
          outgoing.querySelectorAll<HTMLElement>('[data-advice]'),
          {
            autoAlpha: 0,
            y: -12,
            duration: MOTION.exit,
            ease: 'power2.in',
            stagger: { each: 0.035, from: 'end' },
          },
          0,
        ).set(outgoing, { autoAlpha: 0 })
      }

      const stale = panels.current.filter(
        (panel): panel is HTMLDivElement =>
          Boolean(panel) && panel !== incoming && panel !== outgoing,
      )
      if (stale.length > 0) gsap.set(stale, { autoAlpha: 0 })

      tl.set(incoming, { autoAlpha: 1 }, 0)

      const resumed = Number(gsap.getProperty(incoming, 'opacity')) > 0
      const rise = {
        autoAlpha: 1,
        y: 0,
        duration: MOTION.enter,
        ease: 'power3.out',
        stagger: MOTION.stagger,
      }
      const bloom = {
        scale: 1,
        duration: 0.5,
        ease: 'back.out(2.4)',
        stagger: MOTION.stagger,
      }

      if (resumed) {
        tl.to(items, rise, MOTION.overlap).to(icons, bloom, MOTION.overlap + 0.06)
      } else {
        tl.fromTo(items, { autoAlpha: 0, y: 20 }, rise, MOTION.overlap).fromTo(
          icons,
          { scale: 0.6 },
          bloom,
          MOTION.overlap + 0.06,
        )
      }

      return () => {
        previous.current = null
        live.current = { ...PHASES[ADVICE[0].phase].palette }
      }
    },
    { dependencies: [active, reduced], scope: shell },
  )


  useEffect(() => {
    const stageEl = stage.current
    if (!stageEl) return

    const observer = new ResizeObserver(() => {
      gsap.set(stageEl, { height: tallest() })

      if (timeline.current?.isActive()) return

      const bar = highlight.current
      const row = rows.current[active]
      if (bar && row) gsap.set(bar, { y: row.offsetTop, height: row.offsetHeight })
    })

    if (list.current) observer.observe(list.current)

    return () => observer.disconnect()
  }, [active, tallest])

  /** Flèches, Origine et Fin : navigation attendue d'une liste d'onglets. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = ADVICE.length - 1
    const moves: Record<string, number> = {
      ArrowDown: active === last ? 0 : active + 1,
      ArrowRight: active === last ? 0 : active + 1,
      ArrowUp: active === 0 ? last : active - 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    }

    const next = moves[event.key]
    if (next === undefined) return

    event.preventDefault()
    setActive(next)
    rows.current[next]?.focus()
  }

  return (
    <section
      id="preparation"
      className="bg-linear-to-b from-cream-100 to-cream-50 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Préparation au don"
          title={
            <p>
              Bien préparé, c'est <br /> déjà à{' '}
              <span className="text-blood-600">moitié donné</span>
            </p>
          }
          description="Trois moments, trois listes simples. Suivez-les et votre don se passera en douceur."
        />

        {/* Porte les quatre variables de teinte : tout ce qui se colore est en
            dessous, halo compris. */}
        <div ref={shell} className="relative mt-14">
          <div
            aria-hidden="true"
            style={HALO}
            className="pointer-events-none absolute -inset-4 rounded-[40px]"
          />

          {/* Le verre. `backdrop-blur` diffuse les nappes posées derrière. */}
          <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-linear-to-br from-white/75 to-white/35 p-6 backdrop-blur-2xl sm:p-10 lg:p-14">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-20">
              <div
                ref={list}
                role="tablist"
                aria-orientation="vertical"
                aria-label="Moments de la préparation"
                onKeyDown={onKeyDown}
                className="relative flex w-full flex-col gap-6 lg:max-w-112.5"
              >

                <div
                  ref={highlight}
                  aria-hidden="true"
                  style={PILL}
                  className="absolute inset-x-0 top-0 rounded-[20px] border"
                />

                {ADVICE.map((phase, index) => {
                  const selected = index === active

                  return (
                    <button
                      key={phase.phase}
                      ref={(element) => {
                        rows.current[index] = element
                      }}
                      type="button"
                      role="tab"
                      id={`phase-onglet-${index}`}
                      aria-selected={selected}
                      aria-controls={`phase-panneau-${index}`}
                      tabIndex={selected ? 0 : -1}
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      onClick={() => setActive(index)}
                      style={
                        {
                          '--row-ink': PHASES[phase.phase].palette.deep,
                        } as CSSProperties
                      }
                      className={`relative z-1 flex cursor-pointer flex-col rounded-[20px] py-6 pr-7 text-left transition-[padding,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blood-400 gap-2 ${
                        selected ? 'pl-14' : 'pl-8'
                      }`}
                    >
                      <span
                        className={`text-2xl text-right tabular-nums transition-colors duration-500 ${
                          selected ? 'text-(--row-ink)' : 'text-ink-400'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <span
                        className={`font-display text-4xl font-semibold leading-[1.1] tracking-tight transition-colors duration-500 sm:text-5xl ${
                          selected ? 'text-ink-950' : 'text-ink-400'
                        }`}
                      >
                        {phase.title}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Scène : les trois blocs s'y superposent, à la hauteur de la
                  phase la plus longue. */}
              <div
                ref={stage}
                className="relative min-h-95 w-full lg:min-h-120 lg:max-w-110"
              >
                {ADVICE.map((phase, index) => {
                  const { icon: PhaseIcon } = PHASES[phase.phase]

                  return (
                    <div
                      key={phase.phase}
                      ref={(element) => {
                        panels.current[index] = element
                      }}
                      role="tabpanel"
                      id={`phase-panneau-${index}`}
                      aria-labelledby={`phase-onglet-${index}`}
                      tabIndex={index === active ? 0 : -1}
                      className="invisible absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blood-400"
                    >
                      <article
                        data-card
                        style={CARD_SURFACE}
                        className="flex h-full flex-col rounded-3xl border-2 border-(--pl) p-7 sm:p-8"
                      >
                        <div data-advice className="mb-7 flex shrink-0 items-center gap-4">
                          <span
                            data-advice-icon
                            className="flex h-13 w-13 items-center justify-center rounded-2xl bg-(--pd) shadow-md"
                          >
                            <PhaseIcon
                              className="h-6.5 w-6.5 text-white"
                              strokeWidth={1.5}
                              aria-hidden="true"
                            />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-(--pd)">
                              Phase {index + 1}
                            </p>
                            <h3 className="font-display text-2xl font-semibold text-ink-900">
                              {phase.title}
                            </h3>
                          </div>
                        </div>

                        <ul className="flex flex-1 flex-col justify-between gap-4">
                          {phase.items.map((item) => {
                            const ItemIcon = ADVICE_ICONS[item.icon]

                            return (
                              <li
                                key={item.text}
                                data-advice
                                className="flex items-center gap-4 text-[0.95rem] text-ink-600"
                              >
                                <span
                                  data-advice-icon
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-(--pd)"
                                >
                                  <ItemIcon className="h-4.5 w-4.5" aria-hidden="true" />
                                </span>
                                <span className="leading-relaxed">{item.text}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </article>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}