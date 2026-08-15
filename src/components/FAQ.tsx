import { useState } from 'react'
import { Minus, Plus, Sparkles } from 'lucide-react'
import { SectionHeading } from '@/components/SectionHeading'
import { useReveal } from '@/hooks/useReveal'
import { FAQ_ITEMS } from '@/data/faq'

export function FAQ() {
  const { ref, visible } = useReveal()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-cream-50 py-20">
      <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} mx-auto max-w-5xl px-5`}>
        <SectionHeading
          eyebrow="FAQ & idées reçues"
          title={
            <>
              Les questions qu'on n'ose <span className="text-blood-600">pas toujours</span> poser
            </>
          }
          description="La peur du don vient souvent de l'inconnu. Voici les réponses franches aux questions les plus courantes."
        />

        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = open === index
            const panelId = `faq-reponse-${index}`

            return (
              <div
                key={item.q}
                className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                  isOpen ? 'border-blood-200 shadow-sm' : 'border-cream-200 hover:border-cream-300'
                } ${visible ? 'animate-fade-up' : 'reveal'}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                      {item.myth && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          Idée reçue
                        </span>
                      )}
                      <span className="font-display text-base font-semibold text-ink-900 md:text-lg">
                        {item.q}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                        isOpen ? 'bg-blood-500 text-white' : 'bg-cream-100 text-ink-500'
                      }`}
                    >
                      {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </span>
                  </button>
                </h3>

                {/*
                  La réponse reste montée et se déplie par la hauteur de la
                  ligne de grille : c'est le seul moyen d'animer vers `auto`
                  sans mesurer le contenu au JavaScript. Un simple montage
                  conditionnel, lui, ferait sauter le panneau d'un coup.

                  `invisible` est indispensable : sans lui, une réponse repliée
                  reste lisible par les lecteurs d'écran alors que le bouton
                  annonce `aria-expanded="false"`. La transition sur
                  `visibility` étant discrète mais tenue jusqu'au bout, le texte
                  reste affiché pendant tout le repli avant de disparaître.
                */}
                <div
                  id={panelId}
                  role="region"
                  aria-label={item.q}
                  className={`grid transition-[grid-template-rows,visibility] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'invisible grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pl-6 leading-relaxed text-ink-500">{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
