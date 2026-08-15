import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CalendarCheck, Clock, Droplet, Info, Mail, MapPin, Phone, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BeninMap } from '@/components/BeninMap'
import {
  APPOINTMENT_LABELS,
  CENTER_KIND_LABELS,
  DONATION_TYPE_LABELS,
  formatHours,
  getOpenState,
  WEEKDAY_LABELS,
  type Center,
} from '@/data/centers'

/** Durée de la translation d'entrée et de sortie. Doit suivre `duration-300`. */
const TRANSITION_MS = 300

type CenterDrawerProps = {
  /** `null` ferme le tiroir ; le contenu reste affiché le temps de la sortie. */
  center: Center | null
  now: Date
  onClose: () => void
}

/**
 * Fiche complète d'un centre, en tiroir latéral.
 *
 * Les cartes de la liste ne portent que l'essentiel — nom, département, adresse,
 * statut. Tout le reste (créneaux détaillés, modalités d'accueil, coordonnées,
 * position sur la carte) vit ici : c'est ce qui permet de garder une grille
 * dense et lisible sans amputer l'information exigée par le brief.
 *
 * Le composant s'appuie sur le `<dialog>` natif plutôt que sur un piège à focus
 * maison : `showModal()` rend le reste de la page inerte, gère Échap et rend le
 * focus à la carte d'origine à la fermeture. Trois comportements qu'une
 * réimplémentation rate presque toujours dans un coin.
 */
export function CenterDrawer({ center, now, onClose }: CenterDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const [entered, setEntered] = useState(false)
  // Le contenu survit à `center = null` pour ne pas se vider pendant la sortie.
  const [shown, setShown] = useState(center)
  if (center && center !== shown) setShown(center)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (center) {
      if (!dialog.open) dialog.showModal()
      document.body.style.overflow = 'hidden'

      // Un frame d'écart, sinon le panneau est peint directement à sa place
      // finale et la translation d'entrée n'a jamais lieu.
      const frame = requestAnimationFrame(() => {
        setEntered(true)
        closeRef.current?.focus()
      })
      return () => cancelAnimationFrame(frame)
    }

    setEntered(false)
    const timer = window.setTimeout(() => {
      if (dialog.open) dialog.close()
      document.body.style.overflow = ''
    }, TRANSITION_MS)
    return () => window.clearTimeout(timer)
  }, [center])

  // Filet de sécurité : un démontage en cours d'ouverture laisserait la page
  // définitivement bloquée au défilement.
  useEffect(() => () => void (document.body.style.overflow = ''), [])

  if (!shown) return null

  const state = getOpenState(shown, now)

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="centre-detail-titre"
      onCancel={(event) => {
        // Échap : on reprend la main pour jouer la sortie avant le close natif.
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (!panelRef.current?.contains(event.target as Node)) onClose()
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink-950/45"
    >
      <div className="flex h-full justify-end">
        <div
          ref={panelRef}
          className={`flex h-full w-full flex-col bg-cream-50 shadow-2xl transition-transform duration-300 ease-out sm:max-w-md ${
            entered ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* En-tête */}
          <div className="flex items-start gap-3 border-b border-cream-200 bg-white px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blood-50 px-2 py-0.5 text-[0.65rem] font-bold text-blood-700">
                  {CENTER_KIND_LABELS[shown.kind]}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[0.68rem] font-semibold ${
                    state.open ? 'text-sage-600' : 'text-ink-400'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${
                      state.open ? 'bg-sage-500' : 'bg-ink-300'
                    }`}
                  />
                  {state.open ? 'Ouvert maintenant' : 'Fermé'}
                </span>
              </div>

              <h2
                id="centre-detail-titre"
                className="mt-2 font-display text-lg font-bold leading-tight tracking-tight text-ink-950"
              >
                {shown.name}
              </h2>
              <p className="mt-1 text-[0.78rem] text-ink-500">{shown.nature}</p>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-ink-400 transition-colors hover:bg-cream-100 hover:text-ink-700"
            >
              <X className="h-4.5 w-4.5" aria-hidden="true" />
              <span className="sr-only">Fermer la fiche</span>
            </button>
          </div>

          {/* Corps */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="overflow-hidden rounded-xl border border-cream-200 bg-white p-2">
              <BeninMap
                markers={[
                  {
                    city: shown.city,
                    lat: shown.coordinates.lat,
                    lng: shown.coordinates.lng,
                    count: 1,
                  },
                ]}
                activeCity={shown.city}
              />
            </div>

            <DetailRow icon={MapPin} label="Adresse">
              <p className="text-ink-700">{shown.address}</p>
              <p className="mt-0.5 text-ink-500">
                {shown.city} · {shown.department}
              </p>
            </DetailRow>

            <DetailRow icon={Clock} label="Horaires d'ouverture">
              <ul className="space-y-1">
                {shown.hours.map((slot) => (
                  <li key={`${slot.days.join('-')}-${slot.open}`} className="text-ink-700">
                    {formatHours(slot)}
                  </li>
                ))}
              </ul>
              <p
                className={`mt-2 font-semibold ${state.open ? 'text-sage-600' : 'text-ink-500'}`}
              >
                {state.open
                  ? `Ferme à ${state.closesAt}`
                  : state.opensAt
                    ? `Ouvre ${WEEKDAY_LABELS[state.opensDay!].toLowerCase()} à ${state.opensAt}`
                    : 'Horaires à confirmer'}
              </p>
            </DetailRow>

            <DetailRow icon={CalendarCheck} label="Modalités d'accueil">
              <p className="text-ink-700">{APPOINTMENT_LABELS[shown.appointment]}</p>
            </DetailRow>

            <DetailRow icon={Droplet} label="Dons acceptés">
              <ul className="flex flex-wrap gap-1.5">
                {shown.donationTypes.map((type) => (
                  <li
                    key={type}
                    className="rounded-[5px] bg-cream-100 px-2 py-1 text-[0.7rem] font-medium text-ink-600"
                  >
                    {DONATION_TYPE_LABELS[type]}
                  </li>
                ))}
              </ul>
            </DetailRow>

            <DetailRow icon={Phone} label="Contact">
              <a
                href={`tel:${shown.phone.replace(/\s/g, '')}`}
                className="font-medium text-blood-700 underline-offset-2 hover:underline"
              >
                {shown.phone}
              </a>
              <a
                href={`mailto:${shown.email}`}
                className="mt-1 flex items-center gap-1.5 text-ink-600 underline-offset-2 hover:underline"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {shown.email}
              </a>
            </DetailRow>

            <p className="mt-6 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-3 text-[0.72rem] leading-relaxed text-ink-600">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
              <span>
                Horaires, adresse précise et coordonnées sont{' '}
                <strong className="font-semibold text-ink-800">fictifs</strong>, composés pour ce
                projet de démonstration.
              </span>
            </p>
          </div>
        </div>
      </div>
    </dialog>
  )
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="mt-5 flex gap-3 border-t border-cream-200 pt-5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blood-50 text-blood-600">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-ink-400">{label}</p>
        <div className="mt-1.5 flex flex-col text-[0.8rem] leading-relaxed">{children}</div>
      </div>
    </div>
  )
}