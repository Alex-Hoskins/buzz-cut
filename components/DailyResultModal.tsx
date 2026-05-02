"use client";

import Link from "next/link";
import type { DailyConfig } from "@/lib/daily";
import ShareButton from "./ShareButton";
import { buildShareText, type PassQuality } from "@/lib/share";
// Leaderboard imports preserved for future re-enabling:
// import { useState, useEffect, useCallback } from "react";
// import { getPlayerId, getHandle, setHandle, hasHandle } from "@/lib/player";
// import HandlePicker from "./HandlePicker";

interface Props {
  config: DailyConfig;
  result: { passes: number; timeMs: number; stars: 1 | 2 | 3; passQualities: PassQuality[] };
}

export default function DailyResultModal({ config, result }: Props) {
  const title = config.holiday
    ? `${config.holiday.emoji} ${config.holiday.name}`
    : "Today's Cut";

  const shareText = buildShareText({
    title,
    dateString: config.dateString,
    passes: result.passes,
    par: config.par,
    stars: result.stars,
    passQualities: result.passQualities,
  });

  return (
    <>
      {/* Handle picker hidden — see commit message. Re-enable by uncommenting.
      {showHandlePicker && (
        <HandlePicker onSubmit={...} initialError={handleError} />
      )}
      */}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2942]/70 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-[#fef3e7] rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border-4 border-[#0f2942] text-[#0f2942] overflow-y-auto max-h-[90vh]">
          <p className="text-xs uppercase tracking-[0.3em] opacity-60 font-mono text-center">
            Daily Cut Complete
          </p>
          <h2 className="text-3xl font-display font-bold text-center mt-1 mb-1">
            {title}
          </h2>
          <p className="text-xs font-mono text-center opacity-50 mb-6">{config.dateString}</p>

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
                <span className="text-sm opacity-50"> / par {config.par}</span>
              </p>
            </div>
            <div className="bg-[#0f2942]/5 rounded-lg p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest opacity-60">Time</p>
              <p className="text-2xl font-bold">{(result.timeMs / 1000).toFixed(1)}s</p>
            </div>
          </div>

          {/* Leaderboard hidden — see commit message. Re-enable by uncommenting.
          <div className="mb-6 border-t-2 border-[#0f2942]/10 pt-4">
            <p className="...">Today's Top Cuts</p>
            ...leaderboard rows...
          </div>
          */}

          <div className="flex flex-col gap-2">
            <p className="text-center text-xs font-mono opacity-50">Come back tomorrow for a new cut ✂</p>
            <ShareButton text={shareText} />
            <Link
              href="/"
              className="w-full py-3 rounded-lg border-2 border-[#0f2942] text-[#0f2942] font-mono uppercase tracking-widest text-sm text-center hover:bg-[#0f2942] hover:text-[#fef3e7] transition-colors"
            >
              Back to Shop ←
            </Link>
            <Link
              href="/#practice"
              className="w-full py-2 text-xs font-mono uppercase tracking-widest text-[#0f2942]/60 hover:text-[#0f2942] text-center transition-colors"
            >
              Practice Mode
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/*
 * submitAndFetch preserved for future re-enabling:
 *
 * async function submitAndFetch(handle, signal, ...) {
 *   // Leaderboard submission disabled — see commit message.
 *   return;
 *
 *   const postResp = await fetch("/api/daily-scores", { method: "POST", ... });
 *   const res = await fetch(`/api/daily-scores?date=${config.dateString}`, { signal });
 *   ...
 * }
 */

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" className={filled ? "text-[#ea580c] animate-pop" : "text-[#0f2942]/15"}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
