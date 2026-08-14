import { Droplet, HeartPulse, MapPin } from "lucide-react";
import { HeroScene } from "@/components/HeroScene";

export function Hero() {
  return (
    <section
      id="top"
      className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden"
    >
      {/* Background gradient mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-cream-100 via-cream-50 to-cream-50" />
        <div className="absolute top-0 right-0 w-150 h-150 bg-blood-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-sage-300/15 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-8 items-center">
          {/* Left: copy */}
          <div className="reveal is-visible">
            <div className="inline-flex items-center gap-2 bg-blood-50 border border-blood-200/60 text-blood-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <HeartPulse className="w-4 h-4" />
              <span>10 000 dons nécessaires chaque jour en France</span>
            </div>

            <h1 className="font-display font-semibold text-[2.5rem] leading-[1.05] sm:text-6xl md:text-7xl text-ink-950 text-balance">
              Un geste{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-blood-600">simple</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 8 Q 100 2 198 8"
                    stroke="#e64d4d"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                </svg>
              </span>
              ,<br />
              une vie sauvée.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-ink-500 leading-relaxed max-w-xl text-pretty">
              Vous n'avez jamais donné ? Ce n'est pas grave. Trois questions
              suffisent pour commencer :{" "}
              <span className="text-ink-800 font-medium">
                suis-je éligible, où aller, comment ça se passe
              </span>
              . On vous explique tout, simplement.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#eligibilite"
                className="inline-flex items-center justify-center gap-2 bg-blood-600 hover:bg-blood-700 text-white font-semibold px-7 py-4 rounded-full transition-all hover:shadow-xl hover:shadow-blood-600/30 hover:-translate-y-0.5"
              >
                <Droplet className="w-5 h-5 fill-white/30" />
                Tester mon éligibilité
              </a>
              <a
                href="#centres"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-cream-100 border border-cream-300 text-ink-800 font-semibold px-7 py-4 rounded-full transition-all hover:-translate-y-0.5"
              >
                <MapPin className="w-5 h-5 text-blood-600" />
                Trouver un centre
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-ink-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sage-400 animate-pulse-soft" />
                <span>Don sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blood-400 animate-pulse-soft" />
                <span>Anonyme &amp; gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" />
                <span>45 min sur place</span>
              </div>
            </div>
          </div>

          {/* Right: WebGL scene */}
          <div
            className="relative reveal is-visible"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <HeroScene />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
