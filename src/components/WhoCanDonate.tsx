import { ArrowRight, Check } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { useReveal } from "@/hooks/useReveal";
import {
  MAX_AGE,
  MIN_AGE,
  MIN_DELAY_MONTHS,
  MIN_WEIGHT_KG,
} from "@/data/eligibility";

const CRITERIA = [
  {
    value: `${MIN_AGE}–${MAX_AGE}`,
    title: "Âge",
    body: `À partir de ${MIN_AGE} ans, jusqu'à ${MAX_AGE} ans révolus.`,
  },
  {
    value: `${MIN_WEIGHT_KG} kg`,
    title: "Poids",
    body: "Un poids minimum pour que le volume prélevé reste sans risque pour vous.",
  },
  {
    value: "Le jour J",
    title: "Bonne santé",
    body: "Se sentir bien le jour du don, tout simplement.",
  },
  {
    value: `${MIN_DELAY_MONTHS.male}–${MIN_DELAY_MONTHS.female} mois`,
    title: "Entre deux dons",
    body: `Un délai de ${MIN_DELAY_MONTHS.male} mois pour les hommes, ${MIN_DELAY_MONTHS.female} mois pour les femmes.`,
  },
];

export function WhoCanDonate() {
  const grid = useReveal();

  return (
    <section
      id="qui-peut-donner"
      className="bg-cream-50 py-20 md:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-25">
          <SectionHeading
            stacked
            eyebrow="Qui peut donner"
            title={
              <>
                Vous êtes peut-être
                <br />
                <span className="text-blood-600">déjà prêt·e.</span>
              </>
            }
            description="Les règles sont là pour vous protéger. Dans la majorité des cas, si vous êtes en bonne santé, vous pouvez donner."
          >
            <div className="mt-7 flex gap-3 rounded-2xl bg-sage-100 p-4 text-sage-700">
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-500 text-white"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <p>
                <strong className="block text-[0.82rem] font-semibold">
                  Vous êtes probablement éligible
                </strong>
                <span className="mt-1 block text-[0.75rem] leading-relaxed">
                  si vous avez entre {MIN_AGE} et {MAX_AGE} ans et pesez au
                  moins {MIN_WEIGHT_KG} kg.
                </span>
              </p>
            </div>

            <a
              href="#eligibilite"
              className="group mt-7 inline-flex items-center gap-2.5 text-[0.8rem] font-bold text-blood-600 transition-colors hover:text-blood-700"
            >
              Faire le test en 2 minutes
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </SectionHeading>

          <div
            ref={grid.ref}
            className={`reveal ${grid.visible ? "is-visible" : ""} grid gap-3.5 sm:grid-cols-2`}
          >
            {CRITERIA.map(({ value, title, body }) => (
              <article
                key={title}
                className="min-h-45 rounded-[18px] border border-cream-200 bg-white p-7 shadow-[0_12px_32px_rgba(76,43,38,0.06)]"
              >
                <span className="mb-7 inline-grid h-8.75 place-items-center rounded-[9px] bg-blood-50 px-2.75 font-display text-[0.75rem] font-bold text-blood-700">
                  {value}
                </span>
                <strong className="block font-display text-base font-bold text-ink-950">
                  {title}
                </strong>
                <p className="mt-1.75 text-[0.78rem] leading-relaxed text-ink-500">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
