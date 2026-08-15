import { useState, type ReactNode } from "react";
import { Drawer } from "@base-ui/react/drawer";
import {
  CalendarCheck,
  Clock,
  Droplet,
  Info,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BeninMap } from "@/components/BeninMap";
import {
  APPOINTMENT_LABELS,
  CENTER_KIND_LABELS,
  DONATION_TYPE_LABELS,
  formatHours,
  getOpenState,
  WEEKDAY_LABELS,
  type Center,
} from "@/data/centers";

/**
 * Courbe de sortie de Base UI : longue décélération, aucun rebond. C'est elle
 * qui donne la sensation « poussée à la main » plutôt que « déclenchée ».
 */
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

type CenterDrawerProps = {
  /** `null` ferme le tiroir ; le contenu reste affiché le temps de la sortie. */
  center: Center | null;
  now: Date;
  onClose: () => void;
};

export function CenterDrawer({ center, now, onClose }: CenterDrawerProps) {
  // Le contenu survit à `center = null` pour ne pas se vider pendant la sortie.
  const [shown, setShown] = useState(center);
  if (center && center !== shown) setShown(center);

  if (!shown) return null;

  const state = getOpenState(shown, now);

  return (
    <Drawer.Root
      open={center !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      swipeDirection="right"
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className={`fixed inset-0 z-60 min-h-dvh bg-ink-950 [--backdrop-opacity:0.45] opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ${EASE} data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute`}
        />
        <Drawer.Viewport className="fixed inset-0 z-70 flex items-stretch justify-end">
          <Drawer.Popup
            className={`flex h-full w-[calc(var(--panel)+var(--bleed))] max-w-[calc(100vw+var(--bleed))] -mr-(--bleed) flex-col bg-cream-50 pr-(--bleed) shadow-2xl outline-none [--bleed:3rem] [--panel:32rem] lg:[--panel:38rem] transform-[translateX(var(--drawer-swipe-movement-x))] transition-transform duration-450 ${EASE} data-swiping:select-none data-starting-style:transform-[translateX(calc(100%-var(--bleed)+2px))] data-ending-style:transform-[translateX(calc(100%-var(--bleed)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]`}
          >
            <Drawer.Content className="flex min-h-0 flex-1 flex-col">
              {/* En-tête */}
              <div className="flex items-start gap-3 border-b border-cream-200 bg-white px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blood-50 px-2 py-0.5 text-[0.65rem] font-bold text-blood-700">
                      {CENTER_KIND_LABELS[shown.kind]}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[0.68rem] font-semibold ${
                        state.open ? "text-sage-600" : "text-ink-400"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${
                          state.open ? "bg-sage-500" : "bg-ink-300"
                        }`}
                      />
                      {state.open ? "Ouvert maintenant" : "Fermé"}
                    </span>
                  </div>

                  <Drawer.Title className="mt-2 font-display text-lg font-bold leading-tight tracking-tight text-ink-950">
                    {shown.name}
                  </Drawer.Title>
                  <Drawer.Description className="mt-1 text-[0.78rem] text-ink-500">
                    {shown.nature}
                  </Drawer.Description>
                </div>

                <Drawer.Close className="shrink-0 rounded-full p-2 text-ink-400 transition-colors hover:bg-cream-100 hover:text-ink-700">
                  <X className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="sr-only">Fermer la fiche</span>
                </Drawer.Close>
              </div>

              {/* Corps */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                <div className="mx-auto max-w-xs overflow-hidden rounded-xl border border-cream-200 bg-white p-2">
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
                      <li
                        key={`${slot.days.join("-")}-${slot.open}`}
                        className="text-ink-700"
                      >
                        {formatHours(slot)}
                      </li>
                    ))}
                  </ul>
                  <p
                    className={`mt-2 font-semibold ${state.open ? "text-sage-600" : "text-ink-500"}`}
                  >
                    {state.open
                      ? `Ferme à ${state.closesAt}`
                      : state.opensAt
                        ? `Ouvre ${WEEKDAY_LABELS[state.opensDay!].toLowerCase()} à ${state.opensAt}`
                        : "Horaires à confirmer"}
                  </p>
                </DetailRow>

                <DetailRow icon={CalendarCheck} label="Modalités d'accueil">
                  <p className="text-ink-700">
                    {APPOINTMENT_LABELS[shown.appointment]}
                  </p>
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
                    href={`tel:${shown.phone.replace(/\s/g, "")}`}
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
                  <Info
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <span>
                    Horaires, adresse précise et coordonnées sont{" "}
                    <strong className="font-semibold text-ink-800">
                      fictifs
                    </strong>
                    , composés pour ce projet de démonstration.
                  </span>
                </p>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 flex gap-3 border-t border-cream-200 pt-5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blood-50 text-blood-600">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-ink-400">
          {label}
        </p>
        <div className="mt-1.5 flex flex-col text-[0.8rem] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
