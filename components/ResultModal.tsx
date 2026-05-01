"use client";

import Link from "next/link";
import type { Level } from "@/lib/levels";
import { LEVELS } from "@/lib/levels";

interface Props {
  level: Level;
  result: { passes: number; timeMs: number; stars: 1 | 2 | 3 };
  onRetry: () => void;
}

export default function ResultModal({ level, result, onRetry }: Props) {
  const next = LEVELS.find((l) => l.id === level.id + 1);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2942]/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#fef3e7] rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border-4 border-[#0f2942] text-[#0f2942]">
        <p className="text-xs uppercase tracking-[0.3em] opacity-60 font-mono text-center">
          Cut Complete
        </p>
        <h2 className="text-3xl font-display font-bold text-center mt-1 mb-6">
          {level.name}
        </h2>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Star key={i} filled={i <= result.stars} />
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono">
          <div className="bg-[#0f2942]/5 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest opacity-60">Passes</p>
            <p className="text-2xl font-bold">
              {result.passes}
              <span className="text-sm opacity-50"> / par {level.par}</span>
            </p>
          </div>
          <div className="bg-[#0f2942]/5 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest opacity-60">Time</p>
            <p className="text-2xl font-bold">{(result.timeMs / 1000).toFixed(1)}s</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onRetry}
            className="w-full py-3 rounded-lg border-2 border-[#0f2942] text-[#0f2942] font-mono uppercase tracking-widest text-sm hover:bg-[#0f2942] hover:text-[#fef3e7] transition-colors"
          >
            Retry
          </button>
          {next ? (
            <Link
              href={`/play/${next.id}`}
              className="w-full py-3 rounded-lg bg-[#ea580c] text-white font-mono uppercase tracking-widest text-sm text-center hover:bg-[#c2410c] transition-colors"
            >
              Next: {next.name} →
            </Link>
          ) : (
            <Link
              href="/"
              className="w-full py-3 rounded-lg bg-[#ea580c] text-white font-mono uppercase tracking-widest text-sm text-center hover:bg-[#c2410c] transition-colors"
            >
              All Done — Back to Shop
            </Link>
          )}
          <Link
            href="/"
            className="w-full py-2 text-xs font-mono uppercase tracking-widest text-[#0f2942]/60 hover:text-[#0f2942] text-center transition-colors"
          >
            ← Level Select
          </Link>
        </div>
      </div>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      className={filled ? "text-[#ea580c] animate-pop" : "text-[#0f2942]/15"}
    >
      <path
        fill="currentColor"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  );
}
