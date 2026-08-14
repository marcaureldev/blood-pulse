import { useEffect, useState } from 'react';
import { Droplet, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '#pourquoi', label: 'Pourquoi' },
  { href: '#eligibilite', label: 'Éligibilité' },
  { href: '#deroulement', label: 'Déroulement' },
  { href: '#centres', label: 'Centres' },
  { href: '#reserves', label: 'Réserves' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-[0_1px_20px_rgba(0,0,0,0.06)]' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group" aria-label="Accueil - Don de Sang">
          <span className="relative">
            <Droplet className="w-7 h-7 text-blood-600 fill-blood-500 transition-transform group-hover:scale-110" />
          </span>
          <p className="font-display font-semibold text-xl text-blood-600">Blood<span className="text-ink-950">Pulse</span></p>
        </a>

        <ul className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-ink-600 hover:text-blood-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-blood-500 after:transition-all hover:after:w-full"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#eligibilite"
          className="hidden md:inline-flex items-center gap-2 bg-blood-600 hover:bg-blood-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-blood-600/30 hover:-translate-y-0.5"
        >
          Tester mon éligibilité
        </a>

        <button
          className="md:hidden p-2 text-ink-800"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden glass border-t border-cream-300/60">
          <ul className="px-5 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 px-3 text-ink-700 font-medium rounded-lg hover:bg-blood-50 hover:text-blood-600 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#eligibilite"
                onClick={() => setOpen(false)}
                className="block mt-2 py-3 px-3 bg-blood-600 text-white text-center font-semibold rounded-lg"
              >
                Tester mon éligibilité
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
