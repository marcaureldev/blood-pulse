import type { ReactNode } from 'react'
import { useReveal } from '@/hooks/useReveal'

type SectionHeadingProps = {
  /** Surtitre court, en capitales. */
  eyebrow: string
  /** Titre de section. Accepte du JSX pour mettre un fragment en accent. */
  title: ReactNode
  /** Chapô aligné à droite du titre sur grand écran, en dessous sur mobile. */
  description?: ReactNode
  /**
   * En pile : chapô sous le titre au lieu d'être à sa droite. C'est la variante
   * utilisée quand le bandeau occupe une colonne d'une mise en page scindée.
   */
  stacked?: boolean
  /** Contenu additionnel sous le chapô - encart, lien. Variante en pile. */
  children?: ReactNode
}

/**
 * Bandeau de titre commun à toutes les sections : surtitre, titre à gauche,
 * chapô à droite alignés sur la même ligne de base. Extrait dès la première
 * section parce que le motif se répète sur les huit blocs du brief.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  stacked = false,
  children,
}: SectionHeadingProps) {
  const { ref, visible } = useReveal()

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${
        stacked ? 'max-w-2xl' : 'mb-8 md:mb-12 md:flex md:items-end md:justify-between md:gap-10'
      }`}
    >
      <div>
        <p className="mb-5 flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-blood-600">
          <span
            aria-hidden="true"
            className="h-1.75 w-1.75 rounded-full bg-blood-600 shadow-[0_0_0_5px_rgba(211,47,47,0.1)]"
          />
          {eyebrow}
        </p>
        <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-950 text-balance sm:text-5xl md:text-6xl">
          {title}
        </h2>
      </div>

      {description && (
        <p
          className={`mt-5 leading-relaxed text-ink-500 text-pretty ${
            stacked ? '' : 'max-w-88.75 md:mt-0'
          }`}
        >
          {description}
        </p>
      )}

      {children}
    </div>
  )
}
