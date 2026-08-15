import { Droplet, Info } from 'lucide-react'
import { MEDICAL_DISCLAIMER } from '@/data/eligibility'

const FOOTER_LINKS = [
  { href: '#pourquoi', label: 'Pourquoi donner' },
  { href: '#eligibilite', label: 'Éligibilité' },
  { href: '#centres', label: 'Centres' },
  { href: '#reserves', label: 'Réserves' },
  { href: '#faq', label: 'FAQ' },
]

/**
 * Pied de page repris de la référence locale : bandeau sombre, marque à gauche,
 * baseline au centre, liens alignés à droite, puis une barre légale séparée
 * d'un filet.
 *
 * Les liens pointent tous vers une section réelle de la page. La référence
 * plaçait des « À propos » et « Contact » en `href="#"` : sur une page sans
 * backend, un lien mort coûte plus qu'il ne rapporte.
 */
export function Footer() {
  return (
    <footer className="bg-ink-950 pb-6 pt-10 text-cream-100">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 items-start gap-6 pb-9 md:grid-cols-3 md:gap-8">
          <a href="#top" className="group flex items-center gap-2" aria-label="Retour en haut">
            <Droplet
              className="h-6 w-6 fill-blood-500 text-blood-500 transition-transform group-hover:scale-110"
              aria-hidden="true"
            />
            <p className="font-display text-lg font-semibold text-blood-400">
              Blood<span className="text-white">Pulse</span>
            </p>
          </a>

          <p className="order-3 col-span-2 text-[0.78rem] leading-[1.7] text-ink-400 md:order-none md:col-span-1">
            Comprendre le don de sang.
            <br />
            Donner en confiance.
          </p>

          <nav aria-label="Navigation de bas de page">
            <ul className="flex flex-wrap gap-x-4.5 gap-y-2 text-[0.74rem] text-ink-200 md:justify-end">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="flex items-start gap-2 border-t border-ink-800 pt-4.5 text-[0.7rem] leading-relaxed text-ink-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{MEDICAL_DISCLAIMER}</span>
        </p>

        <div className="mt-4 flex flex-col gap-1 text-[0.65rem] leading-[1.8] text-ink-500 sm:flex-row sm:justify-between">
          <span>© 2026 BloodPulse · Projet de démonstration, Figma to Code Challenge</span>
          <span>Fait avec soin pour les donneurs</span>
        </div>
      </div>
    </footer>
  )
}
