import type { ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  stacked?: boolean;
  children?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  stacked = false,
  children,
}: SectionHeadingProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={
        stacked
          ? "max-w-2xl"
          : "mb-8 md:mb-12 md:flex md:items-end md:justify-between md:gap-10"
      }
    >
      <div>
        <p className="mb-5 flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-blood-600">
          <span
            aria-hidden="true"
            className="h-1.75 w-1.75 rounded-full bg-blood-600 shadow-[0_0_0_5px_rgba(211,47,47,0.1)]"
          />
          {eyebrow}
        </p>
        <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-950 text-balance sm:text-5xl">
          {title}
        </h2>
      </div>

      {description && (
        <p
          className={`mt-5 leading-relaxed text-ink-500 text-pretty ${
            stacked ? "" : "max-w-88.75 md:mt-0"
          }`}
        >
          {description}
        </p>
      )}

      {children}
    </div>
  );
}
