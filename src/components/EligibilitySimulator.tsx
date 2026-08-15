import { useEffect, useRef, useState } from 'react'
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

/** Bornes de saisie, volontairement larges : elles écartent l'absurde, pas l'inéligible. */
const AGE_BOUNDS = { min: 1, max: 120 }
const WEIGHT_BOUNDS = { min: 20, max: 300 }

const FIELD =
  'w-full rounded-xl border bg-ink-950 px-4 py-3.5 text-cream-50 transition-colors placeholder:text-ink-500'

/**
 * Simulateur d'éligibilité, en parcours de quatre questions.
 *
 * Le parcours pose de vraies valeurs — âge, poids, date — et non des tranches.
 * Le proto de référence demandait « moins de 18 ans / 18 à 70 ans », ce qui le
 * rendait structurellement incapable de calculer une date de prochaine
 * éligibilité, alors que le brief l'exige.
 *
 * Tout le calcul vit dans `evaluateEligibility`, en fonction pure. Ce composant
 * ne fait que collecter, valider la saisie et présenter le verdict.
 */
export function EligibilitySimulator() {
  const [step, setStep] = useState(0)
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [sex, setSex] = useState<Sex | null>(null)
  const [neverDonated, setNeverDonated] = useState(false)
  const [lastDonation, setLastDonation] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'form' | 'loading' | 'done'>('form')
  const [result, setResult] = useState<EligibilityResult | null>(null)

  const firstFieldRef = useRef<HTMLInputElement | HTMLButtonElement>(null)

  // Le focus suit la question : sans ça, la tabulation repartirait du haut de
  // la page à chaque étape.
  useEffect(() => {
    if (status === 'form') firstFieldRef.current?.focus()
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

    if (step === 3 && !neverDonated) {
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

    // Court délai assumé : le verdict doit se lire comme une réponse, pas comme
    // un changement d'affichage instantané.
    setStatus('loading')
    window.setTimeout(() => {
      setResult(
        evaluateEligibility(
          {
            age: Number(age),
            weightKg: Number(weight),
            sex: sex ?? 'male',
            lastDonationDate: neverDonated ? null : lastDonation,
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
    setNeverDonated(false)
    setLastDonation('')
    setError(null)
    setResult(null)
    setStatus('form')
  }

  return (
    <section id="eligibilite" className="bg-ink-950 py-20 text-cream-100 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
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

        {/* Carte du parcours */}
        <div className="rounded-3xl border border-ink-800 bg-ink-900/60 p-6 sm:p-8">
          {status === 'done' && result ? (
            <Verdict result={result} onRestart={restart} />
          ) : status === 'loading' ? (
            <div
              role="status"
              className="flex min-h-96 flex-col items-center justify-center text-center"
            >
              <Loader2 className="h-8 w-8 animate-spin text-blood-400" aria-hidden="true" />
              <p className="mt-4 text-sm text-ink-300">Analyse de vos réponses…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex min-h-96 flex-col">
              {/* Progression */}
              <div className="mb-8">
                <div className="mb-2.5 flex items-center justify-between text-[0.72rem] font-medium">
                  <span aria-live="polite" className="text-ink-300">
                    Question <strong className="text-cream-50">{step + 1}</strong> sur {TOTAL_STEPS}
                  </span>
                  <span className="text-ink-500">{Math.round((step / TOTAL_STEPS) * 100)} %</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={step + 1}
                  aria-valuemin={1}
                  aria-valuemax={TOTAL_STEPS}
                  aria-label="Progression du test"
                  className="h-1 overflow-hidden rounded-full bg-ink-800"
                >
                  <div
                    className="h-full rounded-full bg-blood-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex-1">
                {step === 0 && (
                  <Question
                    label="Quel âge avez-vous ?"
                    help={`Le don est ouvert de ${MIN_AGE} à ${MAX_AGE} ans.`}
                    htmlFor="sim-age"
                    error={error}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        ref={firstFieldRef as React.RefObject<HTMLInputElement>}
                        id="sim-age"
                        type="number"
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
                )}

                {step === 1 && (
                  <Question
                    label="Quel est votre poids ?"
                    help={`Le minimum requis est de ${MIN_WEIGHT_KG} kg.`}
                    htmlFor="sim-weight"
                    error={error}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        ref={firstFieldRef as React.RefObject<HTMLInputElement>}
                        id="sim-weight"
                        type="number"
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
                )}

                {step === 2 && (
                  <Question
                    label="Vous êtes :"
                    help={`Le délai entre deux dons diffère : ${MIN_DELAY_MONTHS.male} mois pour un homme, ${MIN_DELAY_MONTHS.female} mois pour une femme.`}
                    error={error}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(['male', 'female'] as const).map((value, index) => (
                        <button
                          key={value}
                          ref={
                            index === 0
                              ? (firstFieldRef as React.RefObject<HTMLButtonElement>)
                              : undefined
                          }
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
                )}

                {step === 3 && (
                  <Question
                    label="Quand avez-vous donné pour la dernière fois ?"
                    help="Si c'est votre premier don, cochez la case."
                    htmlFor="sim-date"
                    error={error}
                  >
                    <input
                      ref={firstFieldRef as React.RefObject<HTMLInputElement>}
                      id="sim-date"
                      type="date"
                      max={today}
                      value={lastDonation}
                      disabled={neverDonated}
                      onChange={(event) => setLastDonation(event.target.value)}
                      aria-invalid={error !== null}
                      aria-describedby={error ? 'sim-error' : undefined}
                      className={`${FIELD} disabled:opacity-40 ${
                        error ? 'border-blood-500' : 'border-ink-700'
                      }`}
                    />

                    <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-ink-300">
                      <input
                        type="checkbox"
                        checked={neverDonated}
                        onChange={(event) => {
                          setNeverDonated(event.target.checked)
                          setError(null)
                        }}
                        className="h-4 w-4 accent-blood-500"
                      />
                      Je n'ai jamais donné mon sang
                    </label>
                  </Question>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between gap-4">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={back}
                    className="inline-flex items-center gap-2 text-sm font-medium text-ink-400 transition-colors hover:text-cream-100"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Retour
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-blood-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-blood-700"
                >
                  {step === TOTAL_STEPS - 1 ? 'Voir mon résultat' : 'Continuer'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
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
            <a
              href="#centres"
              className="inline-flex items-center gap-2 rounded-full bg-blood-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-blood-700"
            >
              Trouver un centre
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
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