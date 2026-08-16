import { useRef } from "react";
import { Droplet, HeartPulse, MapPin } from "lucide-react";
import { FillButton } from "@/components/FillButton";
import { HeroScene } from "@/components/HeroScene";
import { gsap, useGSAP } from "@/lib/gsap";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const timeline = gsap.timeline({
            defaults: { ease: "power3.out", duration: 0.8 },
          });

          timeline
            .from("[data-hero='badge']", {
              autoAlpha: 0,
              y: 14,
              duration: 0.55,
            })
            .from("[data-hero='title']", { autoAlpha: 0, y: 26 }, "-=0.3")
            .from("[data-hero='lede']", { autoAlpha: 0, y: 20 }, "-=0.5")
            .from(
              "[data-hero='actions']",
              { autoAlpha: 0, y: 18, duration: 0.6 },
              "-=0.45",
            )
            .from(
              "[data-hero='scene']",
              { autoAlpha: 0, scale: 0.92, duration: 1.2, ease: "power2.out" },
              0.1,
            );
        },
        root,
      );

      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      className="pt-28 pb-20 min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-8 flex-1">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-8 items-center">
          {/* Left: copy */}
          <div>
            <div
              data-hero="badge"
              className="inline-flex items-center gap-2 bg-blood-50 border border-blood-200/60 text-blood-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6"
            >
              <HeartPulse className="w-4 h-4" />
              <span>
                1 % de la population : le seuil minimal fixé par l'OMS
              </span>
            </div>

            <h1
              data-hero="title"
              className="font-display font-semibold text-4xl leading-[1.05] sm:text-6xl md:text-7xl text-ink-950 text-balance"
            >
              Un geste{" "}
              <span className="relative inline-block">
                <span className="relative z-10 fx-marker [--ink:var(--color-blood-300)]">
                  simple
                </span>
              </span>
              ,<br />
              une vie sauvée.
            </h1>

            <p
              data-hero="lede"
              className="mt-6 text-lg text-ink-500 leading-relaxed max-w-xl text-pretty"
            >
              Vous n'avez jamais donné ? Ce n'est pas grave. Trois questions
              suffisent pour commencer :{" "}
              <span className="text-ink-800 font-medium">
                suis-je éligible, où aller, comment ça se passe
              </span>
              . On vous explique tout, simplement.
            </p>

            <div
              data-hero="actions"
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <FillButton
                href="#eligibilite"
                variant="solid"
                icon={<Droplet className="h-5 w-5" />}
              >
                Tester mon éligibilité
              </FillButton>
              <FillButton
                href="#centres"
                variant="ghost"
                icon={<MapPin className="h-5 w-5" />}
              >
                Trouver un centre
              </FillButton>
            </div>
          </div>

          {/* Right: WebGL scene */}
          <div data-hero="scene" className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              <HeroScene />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
