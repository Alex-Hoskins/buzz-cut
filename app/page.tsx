"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/levels";
import { loadScores, type Scores } from "@/lib/storage";

export default function Home() {
  const [scores, setScores] = useState<Scores>({});

  useEffect(() => {
    setScores(loadScores());
  }, []);

  const totalStars = Object.values(scores).reduce((sum, s) => sum + s.stars, 0);
  const maxStars = LEVELS.length * 3;

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Decorative barbershop pole stripe at top */}
      <div className="absolute top-0 left-0 right-0 h-3 barber-stripes" />

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12 mt-4">
          <p className="text-xs font-mono tracking-[0.4em] text-[#ea580c] uppercase mb-3">
            ✂ Est. 2026 ✂
          </p>
          <h1 className="font-display text-7xl md:text-9xl font-black leading-none tracking-tight">
            Buzz<span className="text-[#ea580c]">.</span>Cut
          </h1>
          <p className="mt-4 text-lg max-w-md mx-auto opacity-70">
            A pendulum-clipper barbershop puzzle. Time your drops. Buzz the dome.
            Don't waste passes.
          </p>
        </header>

        {/* Star tally */}
        <div className="flex items-center justify-center gap-2 mb-10 font-mono text-sm">
          <span className="text-[#ea580c] text-2xl">★</span>
          <span className="font-bold tabular-nums">
            {totalStars} / {maxStars}
          </span>
          <span className="opacity-50">stars earned</span>
        </div>

        {/* Level grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((level) => {
            const score = scores[level.id];
            return (
              <Link
                key={level.id}
                href={`/play/${level.id}`}
                className="group relative bg-white border-2 border-[#0f2942] rounded-2xl p-6 hover:bg-[#0f2942] hover:text-[#fef3e7] transition-colors shadow-[6px_6px_0_#0f2942] hover:shadow-[2px_2px_0_#0f2942] hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-xs opacity-50 tracking-widest">
                    LEVEL {String(level.id).padStart(2, "0")}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={
                          score && i <= score.stars
                            ? "text-[#ea580c]"
                            : "opacity-20"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <h3 className="font-display text-2xl font-bold leading-tight mb-1">
                  {level.name}
                </h3>
                <p className="text-sm opacity-70 mb-4">{level.subtitle}</p>
                <div className="flex justify-between items-center text-xs font-mono opacity-60">
                  <span>PAR {level.par}</span>
                  {score && <span>BEST: {score.passes}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs font-mono opacity-40 tracking-widest uppercase">
          Click • Tap • Spacebar to drop the clippers
        </footer>
      </div>

      {/* Decorative bottom stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-3 barber-stripes" />
    </main>
  );
}
