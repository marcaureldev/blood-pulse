import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { SectionHeading } from '@/components/SectionHeading'
import { CenterDrawer } from '@/components/CenterDrawer'
import {
  CENTERS,
  CENTER_KIND_LABELS,
  CITIES,
  DONATION_TYPE_LABELS,
  filterCenters,
  getOpenState,
  WEEKDAY_LABELS,
  type Center,
  type CenterKind,
  type DonationType,
} from '@/data/centers'

type KindFilter = 'all' | CenterKind
type TypeFilter = 'all' | DonationType

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'fixe', label: 'Centres fixes' },
  { value: 'collecte', label: 'Collectes' },
]

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Tous les dons' },
  { value: 'sang-total', label: 'Sang total' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'plaquettes', label: 'Plaquettes' },
]

/** Horloge partagée, rafraîchie chaque minute : le statut d'ouverture doit vivre. */
function useNow() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return now
}

const PILL_BASE =
  'rounded-full px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2'

const INITIAL_VISIBLE = 6

export function CentersDirectory() {
  const now = useNow()

  const [query, setQuery] = useState('')
  const [city, setCity] = useState<string | null>(null)
  const [kind, setKind] = useState<KindFilter>('all')
  const [donationType, setDonationType] = useState<TypeFilter>('all')
  const [openOnly, setOpenOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<Center | null>(null)


  const [deferredQuery, setDeferredQuery] = useState('')
  useEffect(() => {
    if (query === deferredQuery) return

    setLoading(true)
    const timer = window.setTimeout(() => {
      setDeferredQuery(query)
      setLoading(false)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, deferredQuery])

  const filtered = useMemo(
    () =>
      filterCenters(CENTERS, { query: deferredQuery, city, kind, donationType, openOnly }, now),
    [deferredQuery, city, kind, donationType, openOnly, now],
  )

  useEffect(() => {
    setExpanded(false)
  }, [deferredQuery, city, kind, donationType, openOnly])

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE)
  const remaining = filtered.length - visible.length

  const hasFilters = query !== '' || city !== null || kind !== 'all' || donationType !== 'all' || openOnly

  const resetFilters = () => {
    setQuery('')
    setDeferredQuery('')
    setCity(null)
    setKind('all')
    setDonationType('all')
    setOpenOnly(false)
  }

  return (
    <section id="centres" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Où donner"
          title={
            <>
              Un centre près de
              <br />
              <span className="text-blood-600">chez vous.</span>
            </>
          }
          description="Quatorze points de collecte répartis sur neuf départements. Filtrez par ville, par type de don ou par disponibilité, puis ouvrez une fiche pour tout le détail."
        />

        {/* Barre d'outils */}
        <div className="mb-6 rounded-2xl border border-cream-200 bg-cream-50 p-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une ville, un département ou un centre"
                aria-label="Rechercher un centre de don"
                className="w-full rounded-xl border border-cream-200 bg-white py-3 pl-10 pr-3 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring focus:ring-blood-500"
              />
            </div>

            <label className="sr-only" htmlFor="filtre-ville">
              Filtrer par ville
            </label>
            <select
              id="filtre-ville"
              value={city ?? ''}
              onChange={(event) => setCity(event.target.value || null)}
              className="rounded-xl border border-cream-200 bg-white px-3 py-3 text-sm font-medium text-ink-800 sm:w-52 focus:outline-none focus:ring focus:ring-blood-500"
            >
              <option value="">Toutes les villes</option>
              {CITIES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2">
            <SlidersHorizontal className="mr-1 h-4 w-4 text-ink-400" aria-hidden="true" />

            {KIND_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setKind(filter.value)}
                aria-pressed={kind === filter.value}
                className={`${PILL_BASE} ${
                  kind === filter.value
                    ? 'bg-blood-100 text-blood-700'
                    : 'text-ink-500 hover:bg-cream-100'
                }`}
              >
                {filter.label}
              </button>
            ))}

            <span aria-hidden="true" className="mx-1 h-5 w-px bg-cream-300" />

            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setDonationType(filter.value)}
                aria-pressed={donationType === filter.value}
                className={`${PILL_BASE} ${
                  donationType === filter.value
                    ? 'bg-blood-100 text-blood-700'
                    : 'text-ink-500 hover:bg-cream-100'
                }`}
              >
                {filter.label}
              </button>
            ))}

            <span aria-hidden="true" className="mx-1 h-5 w-px bg-cream-300" />

            <button
              type="button"
              onClick={() => setOpenOnly((value) => !value)}
              aria-pressed={openOnly}
              className={`${PILL_BASE} inline-flex items-center gap-1.5 ${
                openOnly ? 'bg-sage-100 text-sage-700' : 'text-ink-500 hover:bg-cream-100'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${openOnly ? 'bg-sage-500' : 'bg-ink-300'}`}
              />
              Ouvert maintenant
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className={`${PILL_BASE} ml-auto inline-flex items-center gap-1.5 text-ink-500 hover:bg-cream-100`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Compteur — annoncé aux lecteurs d'écran à chaque changement. */}
        <p aria-live="polite" className="mb-4 text-sm text-ink-500">
          {loading
            ? 'Recherche en cours…'
            : `${filtered.length} centre${filtered.length > 1 ? 's' : ''} ${
                filtered.length > 1 ? 'correspondent' : 'correspond'
              } à votre recherche${remaining > 0 ? ` · ${visible.length} affichés` : ''}`}
        </p>

        <div>
          {/* Liste */}
          <div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="h-52 animate-pulse rounded-2xl border border-cream-200 bg-cream-50"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-6 py-16 text-center">
                <MapPin className="mx-auto mb-3 h-10 w-10 text-ink-300" strokeWidth={1.2} />
                <h3 className="font-display text-lg font-semibold text-ink-800">
                  Aucun centre ne correspond
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
                  Essayez d'élargir votre recherche : une autre ville, un autre type de don, ou
                  sans la contrainte d'horaire.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-full bg-blood-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blood-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((center) => (
                    <CenterCard
                      key={center.id}
                      center={center}
                      now={now}
                      onSelect={() => setSelected(center)}
                    />
                  ))}
                </ul>

                {filtered.length > INITIAL_VISIBLE && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setExpanded((value) => !value)}
                      className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-blood-400 hover:text-blood-700"
                    >
                      {expanded ? 'Réduire la liste' : `Afficher les ${remaining} autres centres`}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CenterDrawer center={selected} now={now} onClose={() => setSelected(null)} />
    </section>
  )
}

function CenterCard({
  center,
  now,
  onSelect,
}: {
  center: Center
  now: Date
  onSelect: () => void
}) {
  const state = getOpenState(center, now)

  return (
    <li className="h-full">
      <button
        type="button"
        onClick={onSelect}
        aria-haspopup="dialog"
        className="group flex h-full w-full flex-col rounded-2xl border border-cream-200 bg-white p-5 text-left transition-all duration-300 hover:border-blood-500 hover:shadow-blood-950/5 cursor-pointer"
      >
        <div className="flex w-full items-start justify-between gap-2.5">
          <h3 className="line-clamp-2 font-display text-[0.93rem] font-bold leading-snug tracking-tight text-ink-950">
            {center.name}
          </h3>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap pt-0.5 text-[0.68rem] font-medium ${
              state.open ? 'text-sage-600' : 'text-ink-400'
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${state.open ? 'bg-sage-500' : 'bg-ink-300'}`}
            />
            {state.open ? 'Ouvert' : 'Fermé'}
          </span>
        </div>

        <p className="mt-1 text-[0.68rem] font-bold text-blood-600">
          {CENTER_KIND_LABELS[center.kind]} · {center.department}
        </p>

        <p className="mt-4 text-[0.78rem] leading-relaxed text-ink-500">{center.address}</p>

        <p
          className={`mt-2 text-[0.7rem] font-medium ${
            state.open ? 'text-sage-600' : 'text-ink-400'
          }`}
        >
          {state.open
            ? `Ferme à ${state.closesAt}`
            : state.opensAt
              ? `Ouvre ${WEEKDAY_LABELS[state.opensDay!].toLowerCase()} à ${state.opensAt}`
              : 'Horaires à confirmer'}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3.5">
          {center.donationTypes.map((type) => (
            <span
              key={type}
              className="rounded-[5px] bg-cream-100 px-1.75 py-1 text-[0.65rem] font-medium text-ink-500"
            >
              {DONATION_TYPE_LABELS[type]}
            </span>
          ))}
        </div>

        <span className="mt-3.5 inline-flex items-center gap-1 border-t border-cream-100 pt-3 text-[0.68rem] font-bold text-blood-600">
          Voir la fiche
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </button>
    </li>
  )
}
