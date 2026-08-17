import { useCallback, useEffect, useState } from 'react'
import { BloodCells } from '@/components/BloodCells'

/**
 * Visuel de repli : la goutte de la référence.
 * Sert dans trois cas - préférence « animations réduites », absence de WebGL2,
 * et perte du contexte graphique. Le hero n'est donc jamais vide.
 */
function DropFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative motion-safe:animate-float">
        <img src="/fallback-hero.png" alt="Blood drop" className="w-full h-full object-cover" />
      </div>
    </div>
  )
}

/** Suit la préférence système en direct : elle peut changer sans rechargement. */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    list.addEventListener('change', onChange)
    setMatches(list.matches)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function HeroScene() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const compact = useMediaQuery('(max-width: 639px)')
  const [failed, setFailed] = useState(false)

  const onUnavailable = useCallback(() => setFailed(true), [])

  if (import.meta.env.DEV && reducedMotion) {
    console.info(
      '[HeroScene] repli sur la goutte : « animations réduites » est actif dans les réglages système.',
    )
  }

  if (reducedMotion || failed) {
    return <DropFallback />
  }

  // Sur mobile le budget par pixel est le facteur limitant : on réduit d'abord
  // le nombre de pas de raymarch, puis la résolution interne, avant de toucher
  // à la fréquence de rendu - la physique, elle, reste à pas fixe.
  return (
    <BloodCells
      renderScale={compact ? 0.5 : 0.65}
      maxPixelRatio={compact ? 1.5 : 2}
      steps={compact ? 40 : 56}
      targetFps={compact ? 40 : 60}
      onUnavailable={onUnavailable}
    />
  )
}
