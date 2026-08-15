/**
 * Répertoire des centres de transfusion du Bénin.
 *
 * ⚠️ DONNÉES ILLUSTRATIVES. Les villes, départements et établissements existent,
 * mais les horaires, numéros de téléphone, adresses précises et types de dons
 * acceptés sont fictifs, produits pour les besoins du challenge. Ils ne doivent
 * jamais être présentés comme opérationnels : la page affiche un avertissement
 * explicite sous le répertoire. Pour une mise en production réelle, ces données
 * seraient à obtenir auprès de l'Agence Nationale pour la Transfusion Sanguine.
 */

export type DonationType = 'sang-total' | 'plasma' | 'plaquettes'

export const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  'sang-total': 'Sang total',
  plasma: 'Plasma',
  plaquettes: 'Plaquettes',
}

/** Établissement permanent, ou collecte mobile ponctuelle. */
export type CenterKind = 'fixe' | 'collecte'

export const CENTER_KIND_LABELS: Record<CenterKind, string> = {
  fixe: 'Centre fixe',
  collecte: 'Collecte mobile',
}

export type Appointment = 'libre' | 'recommande' | 'requis'

export const APPOINTMENT_LABELS: Record<Appointment, string> = {
  libre: 'Sans rendez-vous',
  recommande: 'Rendez-vous conseillé',
  requis: 'Sur rendez-vous',
}

/** Indices alignés sur Date.getDay() : 0 = dimanche. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: 'Dim',
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
}

export type OpeningSlot = {
  days: Weekday[]
  /** Format 24 h, « HH:MM ». */
  open: string
  close: string
}

export type Center = {
  id: string
  name: string
  /** Nature de l'établissement, affichée sous le nom. */
  nature: string
  kind: CenterKind
  city: string
  department: string
  address: string
  coordinates: { lat: number; lng: number }
  phone: string
  email: string
  hours: OpeningSlot[]
  donationTypes: DonationType[]
  appointment: Appointment
}

export const CENTERS: Center[] = [
  {
    id: 'ants-cotonou',
    name: 'Agence Nationale pour la Transfusion Sanguine',
    nature: 'Établissement national de référence',
    kind: 'fixe',
    city: 'Cotonou',
    department: 'Littoral',
    address: 'Boulevard de la Marina, Cotonou',
    coordinates: { lat: 6.3654, lng: 2.4183 },
    phone: '+229 01 21 30 12 40',
    email: 'contact@ants-benin.example',
    hours: [
      { days: [1, 2, 3, 4, 5], open: '07:30', close: '18:00' },
      { days: [6], open: '08:00', close: '13:00' },
    ],
    donationTypes: ['sang-total', 'plasma', 'plaquettes'],
    appointment: 'libre',
  },
  {
    id: 'cnhu-hkm-cotonou',
    name: 'CNHU-HKM — Banque de sang',
    nature: 'Centre hospitalier universitaire',
    kind: 'fixe',
    city: 'Cotonou',
    department: 'Littoral',
    address: 'Avenue Jean-Paul II, Cadjèhoun, Cotonou',
    coordinates: { lat: 6.3574, lng: 2.4013 },
    phone: '+229 01 21 30 01 55',
    email: 'don@cnhu-hkm.example',
    hours: [
      { days: [1, 2, 3, 4, 5, 6], open: '07:00', close: '19:00' },
      { days: [0], open: '08:00', close: '12:00' },
    ],
    donationTypes: ['sang-total', 'plaquettes'],
    appointment: 'libre',
  },
  {
    id: 'chud-oueme-porto-novo',
    name: 'CHUD Ouémé-Plateau',
    nature: 'Centre hospitalier départemental',
    kind: 'fixe',
    city: 'Porto-Novo',
    department: 'Ouémé',
    address: 'Quartier Djègan-Kpèvi, Porto-Novo',
    coordinates: { lat: 6.4969, lng: 2.6283 },
    phone: '+229 01 20 21 34 18',
    email: 'transfusion@chud-oueme.example',
    hours: [
      { days: [1, 2, 3, 4, 5], open: '07:30', close: '17:00' },
      { days: [6], open: '08:00', close: '12:30' },
    ],
    donationTypes: ['sang-total', 'plasma'],
    appointment: 'recommande',
  },
  {
    id: 'chud-borgou-parakou',
    name: 'CHUD Borgou-Alibori',
    nature: 'Centre hospitalier universitaire départemental',
    kind: 'fixe',
    city: 'Parakou',
    department: 'Borgou',
    address: 'Route de Tchaourou, Parakou',
    coordinates: { lat: 9.3372, lng: 2.6303 },
    phone: '+229 01 23 61 07 22',
    email: 'don@chud-borgou.example',
    hours: [
      { days: [1, 2, 3, 4, 5], open: '07:00', close: '17:30' },
      { days: [6], open: '08:00', close: '13:00' },
    ],
    donationTypes: ['sang-total', 'plasma'],
    appointment: 'libre',
  },
  {
    id: 'chud-zou-abomey',
    name: 'CHUD Zou-Collines',
    nature: 'Centre hospitalier départemental',
    kind: 'fixe',
    city: 'Abomey',
    department: 'Zou',
    address: 'Quartier Djègbé, Abomey',
    coordinates: { lat: 7.1826, lng: 1.9912 },
    phone: '+229 01 22 50 03 76',
    email: 'transfusion@chud-zou.example',
    hours: [{ days: [1, 2, 3, 4, 5], open: '08:00', close: '16:30' }],
    donationTypes: ['sang-total'],
    appointment: 'recommande',
  },
  {
    id: 'chd-atacora-natitingou',
    name: 'CHD Atacora-Donga',
    nature: 'Centre hospitalier départemental',
    kind: 'fixe',
    city: 'Natitingou',
    department: 'Atacora',
    address: 'Route de Boukoumbé, Natitingou',
    coordinates: { lat: 10.3042, lng: 1.3796 },
    phone: '+229 01 23 82 11 09',
    email: 'don@chd-atacora.example',
    hours: [
      { days: [1, 2, 3, 4, 5], open: '07:30', close: '16:00' },
      { days: [6], open: '08:00', close: '12:00' },
    ],
    donationTypes: ['sang-total'],
    appointment: 'libre',
  },
  {
    id: 'saint-jean-de-dieu-tanguieta',
    name: 'Hôpital Saint-Jean-de-Dieu',
    nature: 'Hôpital confessionnel',
    kind: 'fixe',
    city: 'Tanguiéta',
    department: 'Atacora',
    address: 'Centre-ville, Tanguiéta',
    coordinates: { lat: 10.6215, lng: 1.2661 },
    phone: '+229 01 23 83 00 41',
    email: 'contact@hsjd-tanguieta.example',
    hours: [{ days: [1, 2, 3, 4, 5, 6], open: '07:00', close: '18:00' }],
    donationTypes: ['sang-total', 'plasma'],
    appointment: 'recommande',
  },
  {
    id: 'hz-djougou',
    name: 'Hôpital de zone de Djougou',
    nature: 'Hôpital de zone',
    kind: 'fixe',
    city: 'Djougou',
    department: 'Donga',
    address: 'Quartier Zongo, Djougou',
    coordinates: { lat: 9.7085, lng: 1.666 },
    phone: '+229 01 23 80 05 63',
    email: 'don@hz-djougou.example',
    hours: [{ days: [1, 2, 3, 4, 5], open: '08:00', close: '16:00' }],
    donationTypes: ['sang-total'],
    appointment: 'libre',
  },
  {
    id: 'chd-mono-lokossa',
    name: 'CHD Mono-Couffo',
    nature: 'Centre hospitalier départemental',
    kind: 'fixe',
    city: 'Lokossa',
    department: 'Mono',
    address: 'Route Inter-État, Lokossa',
    coordinates: { lat: 6.6389, lng: 1.7167 },
    phone: '+229 01 22 41 10 28',
    email: 'transfusion@chd-mono.example',
    hours: [{ days: [1, 2, 3, 4, 5], open: '07:30', close: '16:30' }],
    donationTypes: ['sang-total', 'plasma'],
    appointment: 'libre',
  },
  {
    id: 'hz-ouidah',
    name: 'Hôpital de zone de Ouidah',
    nature: 'Hôpital de zone',
    kind: 'fixe',
    city: 'Ouidah',
    department: 'Atlantique',
    address: 'Quartier Tovè, Ouidah',
    coordinates: { lat: 6.3631, lng: 2.0853 },
    phone: '+229 01 21 34 12 90',
    email: 'don@hz-ouidah.example',
    hours: [{ days: [1, 2, 3, 4, 5], open: '08:00', close: '16:00' }],
    donationTypes: ['sang-total'],
    appointment: 'libre',
  },
  {
    id: 'collecte-uac-abomey-calavi',
    name: "Collecte mobile — Université d'Abomey-Calavi",
    nature: 'Collecte mobile sur campus',
    kind: 'collecte',
    city: 'Abomey-Calavi',
    department: 'Atlantique',
    address: 'Campus universitaire, Abomey-Calavi',
    coordinates: { lat: 6.4489, lng: 2.3556 },
    phone: '+229 01 21 36 04 17',
    email: 'collectes@ants-benin.example',
    hours: [{ days: [2, 4], open: '09:00', close: '16:00' }],
    donationTypes: ['sang-total'],
    appointment: 'libre',
  },
  {
    id: 'collecte-dantokpa-cotonou',
    name: 'Collecte mobile — Marché Dantokpa',
    nature: 'Collecte mobile de proximité',
    kind: 'collecte',
    city: 'Cotonou',
    department: 'Littoral',
    address: 'Esplanade du marché Dantokpa, Cotonou',
    coordinates: { lat: 6.3712, lng: 2.4342 },
    phone: '+229 01 21 32 08 55',
    email: 'collectes@ants-benin.example',
    hours: [{ days: [1, 5], open: '08:30', close: '14:00' }],
    donationTypes: ['sang-total'],
    appointment: 'libre',
  },
  {
    id: 'collecte-up-parakou',
    name: 'Collecte mobile — Université de Parakou',
    nature: 'Collecte mobile sur campus',
    kind: 'collecte',
    city: 'Parakou',
    department: 'Borgou',
    address: 'Campus universitaire, Parakou',
    coordinates: { lat: 9.3465, lng: 2.6108 },
    phone: '+229 01 23 61 09 30',
    email: 'collectes@ants-benin.example',
    hours: [{ days: [3, 6], open: '09:00', close: '15:00' }],
    donationTypes: ['sang-total'],
    appointment: 'libre',
  },
  {
    id: 'chd-alibori-kandi',
    name: 'CHD Alibori',
    nature: 'Centre hospitalier départemental',
    kind: 'fixe',
    city: 'Kandi',
    department: 'Alibori',
    address: 'Route de Malanville, Kandi',
    coordinates: { lat: 11.1342, lng: 2.9386 },
    phone: '+229 01 23 63 02 84',
    email: 'don@chd-alibori.example',
    hours: [{ days: [1, 2, 3, 4, 5], open: '08:00', close: '15:30' }],
    donationTypes: ['sang-total'],
    appointment: 'libre',
  },
]

/** Villes présentes, dédoublonnées et triées — alimente le filtre. */
export const CITIES = [...new Set(CENTERS.map((center) => center.city))].sort((a, b) =>
  a.localeCompare(b, 'fr'),
)

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export type OpenState =
  | { open: true; closesAt: string }
  | { open: false; opensAt: string | null; opensDay: Weekday | null }

/**
 * Statut d'ouverture à un instant donné.
 *
 * `now` est injecté plutôt que lu depuis l'horloge : c'est ce qui rend la
 * fonction testable et permet de figer l'heure dans les tests.
 */
export function getOpenState(center: Center, now: Date): OpenState {
  const today = now.getDay() as Weekday
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const slot of center.hours) {
    if (!slot.days.includes(today)) continue

    const open = toMinutes(slot.open)
    const close = toMinutes(slot.close)

    if (currentMinutes >= open && currentMinutes < close) {
      return { open: true, closesAt: slot.close }
    }
  }

  // Fermé : on cherche la prochaine ouverture dans les sept jours à venir,
  // aujourd'hui compris si un créneau n'a pas encore commencé.
  for (let offset = 0; offset < 7; offset++) {
    const day = ((today + offset) % 7) as Weekday

    const candidates = center.hours
      .filter((slot) => slot.days.includes(day))
      .map((slot) => slot.open)
      .filter((open) => offset > 0 || toMinutes(open) > currentMinutes)
      .sort()

    if (candidates.length > 0) {
      return { open: false, opensAt: candidates[0], opensDay: day }
    }
  }

  return { open: false, opensAt: null, opensDay: null }
}

export type CenterFilters = {
  /** Texte libre : nom, nature, ville, département ou adresse. */
  query: string
  city: string | null
  kind: 'all' | CenterKind
  donationType: 'all' | DonationType
  openOnly: boolean
}

/**
 * Applique les filtres du répertoire.
 *
 * Extrait du composant à dessein : le brief exige que la recherche soit
 * « opérationnelle », et une fonction pure se vérifie, là où une logique noyée
 * dans un `useMemo` ne se contrôle qu'à l'œil.
 */
export function filterCenters(centers: Center[], filters: CenterFilters, now: Date): Center[] {
  const needle = filters.query.trim().toLowerCase()

  return centers.filter((center) => {
    if (filters.city && center.city !== filters.city) return false
    if (filters.kind !== 'all' && center.kind !== filters.kind) return false
    if (filters.donationType !== 'all' && !center.donationTypes.includes(filters.donationType)) {
      return false
    }
    if (filters.openOnly && !getOpenState(center, now).open) return false

    if (needle) {
      const haystack =
        `${center.name} ${center.nature} ${center.city} ${center.department} ${center.address}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }

    return true
  })
}

/** Regroupe les créneaux en libellés lisibles : « Lun–Ven · 07:30–18:00 ». */
export function formatHours(slot: OpeningSlot): string {
  const days = [...slot.days].sort((a, b) => a - b)

  // Une plage contiguë s'écrit avec un tiret, sinon on énumère.
  const contiguous = days.every((day, index) => index === 0 || day === days[index - 1] + 1)
  const label =
    days.length > 2 && contiguous
      ? `${WEEKDAY_SHORT[days[0]]}–${WEEKDAY_SHORT[days[days.length - 1]]}`
      : days.map((day) => WEEKDAY_SHORT[day]).join(', ')

  return `${label} · ${slot.open}–${slot.close}`
}
