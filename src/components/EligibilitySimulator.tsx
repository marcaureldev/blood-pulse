import { useEffect, useRef, useState } from 'react'
import { FillButton } from '@/components/FillButton'
import { gsap, useGSAP } from '@/lib/gsap'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  Timer,
  XCircle,
} from 'lucide-react'
import {
  evaluateEligibility,
  formatEligibilityDate,
  MAX_AGE,
  MEDICAL_DISCLAIMER,
  MIN_AGE,
  MIN_DELAY_MONTHS,
  MIN_WEIGHT_KG,
  type EligibilityResult,
  type Sex,
} from '@/data/eligibility'

const TOTAL_STEPS = 4

/**
 * Accent propre à chaque question, résolu en dur plutôt qu'en `var()` : GSAP
 * interpole des couleurs, pas des références CSS.
 *
 * La suite réchauffe à mesure qu'on approche du verdict — vert de gorge, sable,
 * ambre, puis le rouge de la marque sur la dernière question, celle qui ouvre
 * sur la réponse. Le parcours se lit donc aussi à la couleur.
 */
const STEP_ACCENTS = ['#9fbfa8', '#c9a96e', '#f5b73e', '#e64d4d']

/**
 * Fond de la section pour chaque question.
 */
const SECTION_TINTS = ['#082008', '#251a08', '#2e1408', '#370808']

/**
 * Pose d'une carte selon sa profondeur dans la pile.
 *
 * `depth` vaut 0 pour la question courante, 1 pour celle qu'on vient de
 * quitter, et ainsi de suite ; une valeur négative désigne une question pas
 * encore atteinte, qui attend sous la pile.
 *
 * Les cartes en retrait restent visibles et légèrement décalées vers le haut :
 * c'est ce qui donne le sentiment d'empilement, et surtout ce qui montre d'où
 * l'on vient. `transformOrigin` est posé en haut pour qu'elles reculent vers
 * leur bord supérieur au lieu de se contracter vers leur centre.
 */
function poseFor(depth: number) {
  if (depth < 0) return { y: 64, scale: 0.97, autoAlpha: 0, zIndex: 0 }
  if (depth === 0) return { y: 0, scale: 1, autoAlpha: 1, zIndex: 40 }
  if (depth === 1) return { y: -20, scale: 0.95, autoAlpha: 0.7, zIndex: 30 }
  if (depth === 2) return { y: -36, scale: 0.9, autoAlpha: 0.4, zIndex: 20 }
  return { y: -48, scale: 0.86, autoAlpha: 0, zIndex: 10 }
}

/** Bornes de saisie, volontairement larges : elles écartent l'absurde, pas l'inéligible. */
const AGE_BOUNDS = { min: 1, max: 120 }
const WEIGHT_BOUNDS = { min: 20, max: 300 }

const FIELD =
  'w-full rounded-xl border bg-ink-950 px-4 py-3.5 text-cream-50 transition-colors placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-blood-500'


const PANEL = 'rounded-3xl border border-ink-800 bg-ink-900 p-6 sm:p-8'

const CARD = `absolute inset-0 flex flex-col overflow-hidden ${PANEL}`

/**
 * Simulateur d'éligibilité, en parcours de quatre questions.
 */
export function EligibilitySimulator() {
  const [step, setStep] = useState(0)
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [sex, setSex] = useState<Sex | null>(null)

  const [donatedBefore, setDonatedBefore] = useState<boolean | null>(null)
  const [lastDonation, setLastDonation] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'form' | 'loading' | 'done'>('form')
  const [result, setResult] = useState<EligibilityResult | null>(null)

  /**
   * Les quatre questions coexistent dans le DOM, donc une référence unique
   * ne suffit plus : la dernière montée écraserait les précédentes.
   */
  const fieldRefs = useRef<Array<HTMLInputElement | HTMLButtonElement | null>>([])
  const setFieldRef =
    (index: number) => (element: HTMLInputElement | HTMLButtonElement | null) => {
      fieldRefs.current[index] = element
    }

  const stack = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)

  /** Vrai tant que le système demande un mouvement réduit. */
  const reducedMotion = useRef(false)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: reduce)', () => {
      reducedMotion.current = true
      return () => {
        reducedMotion.current = false
      }
    })
    return () => media.revert()
  }, [])

  /**
   * L'empilement, piloté par l'étape.
   *
   * Chaque carte reçoit la pose correspondant à sa distance à la question
   * courante, toutes au même instant de la timeline : elles se déplacent
   * ensemble, la sortante recule pendant que l'entrante se pose dessus.
   *
   * Le calcul part de `step` plutôt que d'une timeline à étiquettes parcourue
   * par `tweenTo` : le retour arrière, le saut et le redémarrage tombent alors
   * juste sans code supplémentaire, puisqu'une pose ne dépend que de l'état
   * courant, jamais du chemin parcouru pour y arriver.
   *
   * `overwrite: 'auto'` protège du clic rapide : un nouveau mouvement tue les
   * propriétés encore en cours sur les mêmes cartes au lieu de lutter contre.
   */
  useGSAP(
    () => {
      const root = stack.current
      if (!root) return

      const cards = gsap.utils.toArray<HTMLElement>('[data-card]', root)
      if (cards.length === 0) return

      const instant = root.dataset.posed !== 'true'
      root.dataset.posed = 'true'

      const duration = instant || reducedMotion.current ? 0 : 0.55

      gsap.set(cards, { transformOrigin: 'center top' })

      const timeline = gsap.timeline({
        defaults: { duration, ease: 'power3.out', overwrite: 'auto' },
      })

      cards.forEach((element, index) => {
        timeline.to(element, poseFor(step - index), 0)
      })

      timeline.to(section.current, { backgroundColor: SECTION_TINTS[step] }, 0)
    },
    { dependencies: [step, status], scope: stack },
  )

  const previousStep = useRef(step)

  useEffect(() => {
    const changedQuestion = previousStep.current !== step
    previousStep.current = step

    if (changedQuestion && status === 'form') fieldRefs.current[step]?.focus()
  }, [step, status])

  const today = new Date().toISOString().slice(0, 10)

  const validate = (): string | null => {
    if (step === 0) {
      const value = Number(age)
      if (age.trim() === '' || !Number.isFinite(value)) return 'Indiquez votre âge.'
      if (!Number.isInteger(value)) return 'Indiquez un âge en années entières.'
      if (value < AGE_BOUNDS.min || value > AGE_BOUNDS.max) {
        return `Indiquez un âge compris entre ${AGE_BOUNDS.min} et ${AGE_BOUNDS.max} ans.`
      }
    }

    if (step === 1) {
      const value = Number(weight)
      if (weight.trim() === '' || !Number.isFinite(value)) return 'Indiquez votre poids.'
      if (value < WEIGHT_BOUNDS.min || value > WEIGHT_BOUNDS.max) {
        return `Indiquez un poids compris entre ${WEIGHT_BOUNDS.min} et ${WEIGHT_BOUNDS.max} kg.`
      }
    }

    if (step === 2 && sex === null) return 'Sélectionnez une réponse pour continuer.'

    if (step === 3) {
      if (donatedBefore === null) return 'Indiquez si vous avez déjà donné.'
    }

    if (step === 3 && donatedBefore) {
      if (!lastDonation) return 'Indiquez la date de votre dernier don, ou cochez « je n’ai jamais donné ».'
      if (lastDonation > today) return 'Cette date est dans le futur.'
    }

    return null
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const message = validate()
    if (message) {
      setError(message)
      return
    }
    setError(null)

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
      return
    }

    setStatus('loading')
    window.setTimeout(() => {
      setResult(
        evaluateEligibility(
          {
            age: Number(age),
            weightKg: Number(weight),
            sex: sex ?? 'male',
            lastDonationDate: donatedBefore ? lastDonation : null,
          },
          new Date(),
        ),
      )
      setStatus('done')
    }, 700)
  }

  const back = () => {
    setError(null)
    setStep((current) => Math.max(0, current - 1))
  }

  const restart = () => {
    setStep(0)
    setAge('')
    setWeight('')
    setSex(null)
    setDonatedBefore(null)
    setLastDonation('')
    setError(null)
    setResult(null)
    setStatus('form')
  }

  return (
    <section
      ref={section}
      id="eligibilite"
      className="bg-ink-950 py-20 text-cream-100 md:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
        {/* Colonne d'intro */}
        <div className="lg:pt-6">
          <p className="mb-5 flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-blood-400">
            <span
              aria-hidden="true"
              className="h-1.75 w-1.75 rounded-full bg-blood-500 shadow-[0_0_0_5px_rgba(230,77,77,0.15)]"
            />
            Test d'éligibilité
          </p>

          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-cream-50 text-balance sm:text-5xl">
            Quatre questions.
            <br />
            <span className="text-blood-400">Une réponse claire.</span>
          </h2>

          <p className="mt-5 max-w-md leading-relaxed text-ink-300 text-pretty">
            Une première indication, immédiate. Elle ne remplace pas l'entretien médical, mais elle
            vous dit si vous pouvez déjà vous déplacer.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[0.78rem] text-ink-400">
            <li className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blood-400" aria-hidden="true" />2 minutes
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blood-400" aria-hidden="true" />
              Rien n'est envoyé ni enregistré
            </li>
          </ul>
        </div>

        <div>
          {status === 'done' && result ? (
            <div className={`min-h-120 ${PANEL}`}>
              <Verdict result={result} onRestart={restart} />
            </div>
          ) : status === 'loading' ? (
            <div
              role="status"
              className={`flex min-h-120 flex-col items-center justify-center text-center ${PANEL}`}
            >
              <Loader2 className="h-8 w-8 animate-spin text-blood-400" aria-hidden="true" />
              <p className="mt-4 text-sm text-ink-300">Analyse de vos réponses…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div ref={stack} className={`relative min-h-120`}>
                <Panel index={0} active={step === 0} onBack={back}>
                  <Question
                    label="Quel âge avez-vous ?"
                    help={`Le don est ouvert de ${MIN_AGE} à ${MAX_AGE} ans.`}
                    htmlFor="sim-age"
                    error={step === 0 ? error : null}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        ref={setFieldRef(0)}
                        id="sim-age"
                        type="text"
                        inputMode="numeric"
                        value={age}
                        onChange={(event) => setAge(event.target.value)}
                        placeholder="28"
                        aria-invalid={error !== null}
                        aria-describedby={error ? 'sim-error' : undefined}
                        className={`${FIELD} ${error ? 'border-blood-500' : 'border-ink-700'}`}
                      />
                      <span className="shrink-0 text-sm text-ink-400">ans</span>
                    </div>
                  </Question>
                </Panel>

                <Panel index={1} active={step === 1} onBack={back}>
                  <Question
                    label="Quel est votre poids ?"
                    help={`Le minimum requis est de ${MIN_WEIGHT_KG} kg.`}
                    htmlFor="sim-weight"
                    error={step === 1 ? error : null}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        ref={setFieldRef(1)}
                        id="sim-weight"
                        type="text"
                        inputMode="numeric"
                        value={weight}
                        onChange={(event) => setWeight(event.target.value)}
                        placeholder="68"
                        aria-invalid={error !== null}
                        aria-describedby={error ? 'sim-error' : undefined}
                        className={`${FIELD} ${error ? 'border-blood-500' : 'border-ink-700'}`}
                      />
                      <span className="shrink-0 text-sm text-ink-400">kg</span>
                    </div>
                  </Question>
                </Panel>

                <Panel index={2} active={step === 2} onBack={back}>
                  <Question
                    label="Vous êtes :"
                    help={`Le délai entre deux dons diffère : ${MIN_DELAY_MONTHS.male} mois pour un homme, ${MIN_DELAY_MONTHS.female} mois pour une femme.`}
                    error={step === 2 ? error : null}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(['male', 'female'] as const).map((value, index) => (
                        <button
                          key={value}
                          ref={index === 0 ? setFieldRef(2) : undefined}
                          type="button"
                          onClick={() => {
                            setSex(value)
                            setError(null)
                          }}
                          aria-pressed={sex === value}
                          className={`rounded-xl border px-4 py-4 text-left font-medium transition-colors ${
                            sex === value
                              ? 'border-blood-500 bg-blood-950/40 text-cream-50'
                              : 'border-ink-700 text-ink-300 hover:border-ink-600 hover:bg-ink-800'
                          }`}
                        >
                          {value === 'male' ? 'Un homme' : 'Une femme'}
                        </button>
                      ))}
                    </div>
                  </Question>
                </Panel>

                <Panel index={3} active={step === 3} onBack={back}>
                  <Question
                    label="Avez-vous déjà donné votre sang ?"
                    help="Cette date sert à calculer votre prochain don possible."
                    error={step === 3 ? error : null}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { value: false, label: "C'est mon premier don" },
                        { value: true, label: "J'ai déjà donné" },
                      ].map((choice, index) => (
                        <button
                          key={choice.label}
                          ref={index === 0 ? setFieldRef(3) : undefined}
                          type="button"
                          onClick={() => {
                            setDonatedBefore(choice.value)
                            if (!choice.value) setLastDonation('')
                            setError(null)
                          }}
                          aria-pressed={donatedBefore === choice.value}
                          className={`rounded-xl border px-4 py-4 text-left font-medium transition-colors ${
                            donatedBefore === choice.value
                              ? 'border-blood-500 bg-blood-950/40 text-cream-50'
                              : 'border-ink-700 text-ink-300 hover:border-ink-600 hover:bg-ink-800'
                          }`}
                        >
                          {choice.label}
                        </button>
                      ))}
                    </div>

                    {/* La date n'apparaît que lorsqu'elle a un sens. */}
                    {donatedBefore === true && (
                      <div className="mt-5">
                        <label
                          htmlFor="sim-date"
                          className="mb-2 block text-[0.82rem] font-medium text-ink-300"
                        >
                          Date de votre dernier don
                        </label>
                        <input
                          id="sim-date"
                          type="date"
                          max={today}
                          value={lastDonation}
                          onChange={(event) => setLastDonation(event.target.value)}
                          aria-invalid={error !== null}
                          aria-describedby={error ? 'sim-error' : undefined}
                          className={`${FIELD} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert ${
                            error ? 'border-blood-500' : 'border-ink-700'
                          }`}
                        />
                      </div>
                    )}
                  </Question>
                </Panel>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}


function Panel({
  index,
  active,
  onBack,
  children,
}: {
  index: number
  active: boolean
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div data-card className={CARD} inert={!active}>
      <div className="mb-8">
        <div className="mb-2.5 flex items-center justify-between text-[0.72rem] font-medium">
          <span className="text-ink-300">
            Question <strong className="text-cream-50">{index + 1}</strong> sur {TOTAL_STEPS}
          </span>
          <span className="text-ink-500">{Math.round((index / TOTAL_STEPS) * 100)} %</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label="Progression du test"
          className="h-1 overflow-hidden rounded-full bg-ink-800"
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${((index + 1) / TOTAL_STEPS) * 100}%`,
              backgroundColor: STEP_ACCENTS[index],
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center">{children}</div>

      <div className="mt-8 flex items-center justify-between gap-4">
        {index > 0 ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-400 transition-colors hover:text-cream-100"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour
          </button>
        ) : (
          <span />
        )}

        <FillButton
          type="submit"
          variant="onDark"
          icon={<ArrowRight className="h-4 w-4" />}
          iconPosition="end"
        >
          {index === TOTAL_STEPS - 1 ? 'Voir mon résultat' : 'Continuer'}
        </FillButton>
      </div>
    </div>
  )
}

function Question({
  label,
  help,
  htmlFor,
  error,
  children,
}: {
  label: string
  help: string
  htmlFor?: string
  error: string | null
  children: React.ReactNode
}) {
  return (
    <div className="animate-fade-in">
      <label
        htmlFor={htmlFor}
        className="block font-display text-xl font-semibold text-cream-50 sm:text-2xl"
      >
        {label}
      </label>
      <p className="mb-6 mt-2 text-[0.82rem] leading-relaxed text-ink-400">{help}</p>

      {children}

      {error && (
        <p
          id="sim-error"
          role="alert"
          className="mt-3 flex items-center gap-2 text-[0.82rem] font-medium text-blood-400"
        >
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

function Verdict({
  result,
  onRestart,
}: {
  result: EligibilityResult
  onRestart: () => void
}) {
  const { eligible, blockers, nextEligibleDate } = result

  return (
    <div className="flex min-h-96 flex-col animate-fade-in">
      <span
        className={`grid h-14 w-14 place-items-center rounded-2xl ${
          eligible ? 'bg-sage-500/15 text-sage-400' : 'bg-blood-500/15 text-blood-400'
        }`}
      >
        {eligible ? (
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <XCircle className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
        )}
      </span>

      <h3 className="mt-5 font-display text-2xl font-semibold text-cream-50 sm:text-3xl">
        {eligible ? 'Vous pouvez donner.' : 'Pas aujourd’hui.'}
      </h3>

      <p className="mt-2.5 leading-relaxed text-ink-300">
        {eligible
          ? 'Vous remplissez les quatre critères de base. Il ne reste qu’à vous présenter dans un centre.'
          : 'Un ou plusieurs critères ne sont pas réunis pour le moment.'}
      </p>

      {blockers.length > 0 && (
        <ul className="mt-6 space-y-2.5">
          {blockers.map((blocker) => (
            <li
              key={blocker.code}
              className="flex gap-3 rounded-xl border border-ink-800 bg-ink-950/60 px-4 py-3.5 text-[0.85rem] leading-relaxed text-ink-300"
            >
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-blood-400" aria-hidden="true" />
              {blocker.message}
            </li>
          ))}
        </ul>
      )}

      {nextEligibleDate && (
        <p className="mt-4 flex items-start gap-3 rounded-xl border border-blood-500/30 bg-blood-950/30 px-4 py-3.5 text-[0.85rem] leading-relaxed text-cream-100">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-blood-400" aria-hidden="true" />
          <span>
            Vous pourrez donner à partir du{' '}
            <strong className="font-semibold text-cream-50">
              {formatEligibilityDate(nextEligibleDate)}
            </strong>
            .
          </span>
        </p>
      )}

      <div className="mt-auto pt-8">
        <p className="flex items-start gap-2.5 border-t border-ink-800 pt-5 text-[0.78rem] leading-relaxed text-ink-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {MEDICAL_DISCLAIMER}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {eligible && (
            <FillButton
              href="#centres"
              variant="onDark"
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="end"
            >
              Trouver un centre
            </FillButton>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-400 transition-colors hover:text-cream-100"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Recommencer le test
          </button>
        </div>
      </div>
    </div>
  )
}