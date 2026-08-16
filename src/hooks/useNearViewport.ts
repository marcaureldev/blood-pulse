import { useEffect, useRef, useState } from 'react'

/**
 * Signale quand un élément approche du viewport, une fois pour toutes.
 *
 * Sert à retarder ce qui coûte cher au chargement. La carte WebGL en est le
 * cas type : ses dépendances pèsent plus lourd que tout le reste de la page
 * réuni, alors que la section vit loin sous la ligne de flottaison. Rien ne
 * part sur le réseau tant qu'on ne s'en approche pas.
 *
 * L'observateur se débranche au premier déclenchement : le montage ne doit
 * pas s'annuler si l'on remonte plus haut dans la page.
 */
export function useNearViewport<T extends HTMLElement>(rootMargin = '600px') {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || near) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true)
      },
      { rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [near, rootMargin])

  return [ref, near] as const
}
