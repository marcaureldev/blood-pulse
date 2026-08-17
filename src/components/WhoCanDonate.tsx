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
    value: `${MIN_AGE}-${MAX_AGE}`,
    unit: "ans",
    title: "Âge",
    body: `À partir de ${MIN_AGE} ans, jusqu'à ${MAX_AGE} ans révolus.`,
  },
  {
    value: `${MIN_WEIGHT_KG}`,
    unit: "kg minimum",
    title: "Poids",
    body: "En dessous, le volume prélevé représenterait une part trop grande de votre sang.",
  },
  {
    value: "Le jour J",
    unit: "sans fièvre",
    title: "Bonne santé",
    body: "Ni infection en cours, ni fatigue inhabituelle. Se sentir bien, simplement.",
  },
  {
    value: `${MIN_DELAY_MONTHS.male}-${MIN_DELAY_MONTHS.female}`,
    unit: "mois d'écart",
    title: "Entre deux dons",
    body: `${MIN_DELAY_MONTHS.male} mois pour les hommes, ${MIN_DELAY_MONTHS.female} mois pour les femmes.`,
  },
];

const TILE_TONES = [
  "bg-cream-50 hover:bg-white",
  "bg-white hover:bg-cream-50",
  "bg-cream-50 hover:bg-white sm:bg-white sm:hover:bg-cream-50",
  "bg-white hover:bg-cream-50 sm:bg-cream-50 sm:hover:bg-white",
];

export function WhoCanDonate() {
  const grid = useReveal<HTMLDivElement>({ items: "article" });

  return (
    <section id="qui-peut-donner" className="bg-cream-50 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Qui peut donner"
          title={
            <>
              Vous êtes peut
              <p className="">
              être <span className="sm:inline fx-marker [--ink:var(--color-blood-300)]">éligible.</span>
              </p>
            </>
          }
          description="Les règles sont là pour vous protéger. Dans la majorité des cas, être en bonne santé suffit."
        />

        <div
          ref={grid}
          className="mt-12 grid border-l border-t border-cream-200 sm:grid-cols-2"
        >
          {CRITERIA.map(({ value, unit, title, body }, index) => (
            <article
              key={title}
              className={`flex min-h-60 flex-col justify-between border-b border-r border-cream-200 p-8 transition-colors duration-300 ${TILE_TONES[index]}`}
            >
              <p className="sm:self-end text-start sm:text-right">
                <span className="block font-display text-4xl font-semibold leading-none tracking-tight text-blood-500 lg:text-4xl">
                  {value}
                </span>
                <span className="mt-2 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-ink-400">
                  {unit}
                </span>
              </p>

              <div className="mt-10">
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink-950">
                  {title}
                </h3>
                <p className="mt-2 max-w-xs text-[0.85rem] leading-relaxed text-ink-500">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
