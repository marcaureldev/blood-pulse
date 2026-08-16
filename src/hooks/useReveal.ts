import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

type RevealOptions = {
  /**
   * Sélecteur CSS des éléments à révéler en cascade, résolu **dans** le
   * conteneur. Sans lui, c'est le conteneur entier qui est révélé d'un bloc.
   */
  items?: string
  /** Décalage entre deux éléments, en secondes. Sans effet sans `items`. */
  stagger?: number
  /** Distance parcourue vers le haut pendant l'apparition, en pixels. */
  y?: number
  /** Point de déclenchement, au format ScrollTrigger « cible viewport ». */
  start?: string
}

/**
 * Révèle un élément — ou ses enfants en cascade — à son entrée dans le viewport.
 *
 * Le déclenchement passe par ScrollTrigger plutôt que par un `IntersectionObserver`
 * maison, pour trois raisons concrètes :
 *
 * 1. La cascade. Un observateur ne sait dire que « visible / pas visible » ; le
 *    décalage entre éléments devait être bricolé en `animationDelay` inline,
 *    calculé sur l'index. GSAP le prend en charge par `stagger`.
 * 2. Le recalcul. ScrollTrigger repositionne ses seuils au redimensionnement et
 *    au chargement des polices, deux événements qui décalent silencieusement un
 *    seuil d'observateur figé.
 * 3. L'annulation. `useGSAP` révoque animations et ScrollTriggers au démontage,
 *    là où React 19 en StrictMode monte deux fois en développement.
 *
 * L'état de départ est posé par GSAP, jamais par le CSS. Si le JavaScript ne
 * s'exécute pas, le contenu reste donc visible au lieu de disparaître — l'inverse
 * d'un `opacity: 0` posé en feuille de style.
 *
 * @returns La ref à poser sur le conteneur.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  items,
  stagger = 0.09,
  y = 28,
  start = 'top 85%',
}: RevealOptions = {}) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      const root = ref.current
      if (!root) return

      // Un sélecteur qui ne correspond à rien ferait échouer le tween en
      // silence ; on préfère ne rien créer du tout.
      if (items && root.querySelectorAll(items).length === 0) return

      const media = gsap.matchMedia()

      media.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          gsap.from(items ?? root, {
            autoAlpha: 0,
            y,
            duration: 0.75,
            ease: 'power3.out',
            stagger: items ? stagger : 0,
            scrollTrigger: { trigger: root, start, once: true },
          })
        },
        ref,
      )

      return () => media.revert()
    },
    { scope: ref },
  )

  return ref
}
