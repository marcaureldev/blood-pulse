import { useEffect, useRef, useState } from "react";
import { AlertCircle, Droplet, Info, TrendingUp } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  BLOOD_GROUP_FACTS,
  BLOOD_RESERVES,
  RESERVES_UPDATED_AT,
  RESERVE_META,
  type BloodGroup,
} from "@/data/bloodReserves";

export function BloodReserves() {
  const gauges = useRef<HTMLDivElement>(null);

  // Les huit jauges montent en cascade, puis se remplissent.
  //
  // Le remplissage passe par `scaleX` et non par `width` : une largeur animée
  // force un recalcul de mise en page à chaque image, une transformation non.
  // La largeur finale reste posée en style inline, donc juste dans le DOM même
  // si l'animation ne joue jamais.
  useGSAP(
    () => {
      const root = gauges.current;
      if (!root) return;

      const media = gsap.matchMedia();

      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const timeline = gsap.timeline({
            scrollTrigger: { trigger: root, start: "top 85%", once: true },
          });

          timeline
            .from("button", {
              opacity: 0,
              y: 24,
              duration: 0.5,
              ease: "power3.out",
              stagger: 0.06,
            })
            .from(
              "[data-bar]",
              { scaleX: 0, duration: 0.8, ease: "power2.out", stagger: 0.06 },
              0.2,
            );
        },
        gauges,
      );

      return () => media.revert();
    },
    { scope: gauges },
  );
  const [selected, setSelected] = useState<BloodGroup | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Sur grand écran le panneau de détail est à côté des jauges, on le voit
  // changer. Sur mobile il est sous les huit barres : sans ce rappel, cliquer
  // un groupe ne produirait aucun effet visible.
  useEffect(() => {
    if (!selected || window.matchMedia("(min-width: 1024px)").matches) return;
    detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <section
      id="reserves"
      className="bg-linear-to-b from-cream-50 to-cream-100 py-20"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="État des réserves"
          title={
            <>
              Certains groupes sont plus{" "}
              <span className="fx-marker [--ink:var(--color-blood-300)]">
                attendus
              </span>{" "}
              que d'autres
            </>
          }
          description="Les besoins varient selon les groupes sanguins. Sélectionnez un groupe pour comprendre qui il peut aider."
        />

        <p className="mb-8 flex items-center gap-2 text-xs font-medium text-ink-400">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-blood-500"
          />
          Relevé du {RESERVES_UPDATED_AT}
        </p>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Jauges */}
          <div ref={gauges} className="space-y-3">
            {BLOOD_RESERVES.map((reserve) => {
              const meta = RESERVE_META[reserve.level];
              const isSelected = selected === reserve.group;

              return (
                <button
                  key={reserve.group}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : reserve.group)}
                  aria-pressed={isSelected}
                  className={`w-full rounded-2xl border-[1.5px] bg-white p-5 text-left transition-colors duration-300 hover:border-blood-400 ${
                    isSelected ? "border-blood-500" : "border-cream-200"
                  }`}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-2xl font-bold text-ink-900">
                        {reserve.group}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.bg} ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <span className="font-display text-lg font-semibold text-ink-700">
                      {reserve.percentage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-cream-200">
                    <div
                      data-bar
                      className={`h-full origin-left rounded-full ${meta.bar}`}
                      style={{ width: `${reserve.percentage}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-ink-400">{reserve.label}</p>
                </button>
              );
            })}
          </div>

          {/* Détail du groupe sélectionné */}
          <div
            ref={detailRef}
            aria-live="polite"
            className="self-start lg:sticky lg:top-24"
          >
            {!selected ? (
              <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cream-300 bg-white p-8 text-center">
                <Droplet
                  className="mb-4 h-14 w-14 text-blood-200"
                  strokeWidth={1}
                  aria-hidden="true"
                />
                <h3 className="mb-2 font-display text-lg font-semibold text-ink-700">
                  Explorez les groupes
                </h3>
                <p className="max-w-xs text-sm text-ink-500">
                  Sélectionnez un groupe sanguin pour voir sa compatibilité et
                  son rôle dans le système de transfusion.
                </p>
              </div>
            ) : (
              <div className="animate-fade-in rounded-3xl border-2 border-blood-200 bg-white p-7 shadow-sm">
                <div className="mb-5 flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blood-50">
                    <Droplet
                      className="h-9 w-9 fill-blood-200 text-blood-500"
                      strokeWidth={1.2}
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h3 className="font-display text-3xl font-bold text-ink-900">
                      {selected}
                    </h3>
                    <p className="text-sm text-ink-500">
                      {BLOOD_GROUP_FACTS[selected].rarity}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <CompatibilityList
                    icon={TrendingUp}
                    label="Peut donner à"
                    accent="text-sage-600"
                    chip="border-sage-200 bg-sage-50 text-sage-700"
                    groups={BLOOD_GROUP_FACTS[selected].canGiveTo}
                  />
                  <CompatibilityList
                    icon={AlertCircle}
                    label="Peut recevoir de"
                    accent="text-blood-600"
                    chip="border-blood-200 bg-blood-50 text-blood-700"
                    groups={BLOOD_GROUP_FACTS[selected].canReceiveFrom}
                  />
                </div>

                <p className="mt-5 flex items-start gap-2.5 border-t border-cream-200 pt-5 text-xs leading-relaxed text-ink-400">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    En pratique, on transfuse dans la mesure du possible le même
                    groupe que le patient. Les compatibilités ci-dessus sont des
                    recours d'urgence.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompatibilityList({
  icon: Icon,
  label,
  accent,
  chip,
  groups,
}: {
  icon: typeof TrendingUp;
  label: string;
  accent: string;
  chip: string;
  groups: BloodGroup[];
}) {
  return (
    <div>
      <p
        className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${accent}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <li
            key={group}
            className={`rounded-lg border px-3 py-1.5 font-display text-sm font-semibold ${chip}`}
          >
            {group}
          </li>
        ))}
      </ul>
    </div>
  );
}
