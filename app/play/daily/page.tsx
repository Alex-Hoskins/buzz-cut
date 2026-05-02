"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Game from "@/components/Game";
import DailyResultModal from "@/components/DailyResultModal";
import type { Level } from "@/lib/levels";
import { generateDaily, getTodayString, type DailyConfig } from "@/lib/daily";
import { loadDailyResult, saveDailyResult, type ScoreRecord } from "@/lib/storage";
import ShareButton from "@/components/ShareButton";
import { buildShareText, type PassQuality } from "@/lib/share";
// Leaderboard import preserved for future re-enabling:
// import { getHandle } from "@/lib/player";

type Result = { passes: number; timeMs: number; stars: 1 | 2 | 3; passQualities: PassQuality[] };
type PageState = "loading" | "playing" | "finished" | "already-played";

export default function DailyPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [config, setConfig] = useState<DailyConfig | null>(null);
  const [dateString, setDateString] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const today = getTodayString();
    setDateString(today);
    const cfg = generateDaily(today);
    setConfig(cfg);

    const existing = loadDailyResult(today);
    if (existing) {
      setResult({ ...existing, passQualities: existing.passQualities ?? [] });
      setPageState("already-played");
    } else {
      setPageState("playing");
    }
  }, []);

  // saveDailyResult fires before the modal renders so one-shot is enforced
  // even if the player closes the tab immediately after finishing.
  const handleFinish = useCallback(
    (r: Result) => {
      saveDailyResult(dateString, r);
      setResult(r);
      setPageState("finished");
    },
    [dateString]
  );

  if (pageState === "loading" || !config) {
    return (
      <main className="h-dvh flex items-center justify-center bg-[#fef3e7]">
        <p className="font-mono text-sm opacity-40 tracking-widest uppercase">Loading…</p>
      </main>
    );
  }

  const dailyLevel: Level = {
    id: 0,
    name: config.holiday ? `${config.holiday.emoji} Today's Cut` : "Today's Cut",
    subtitle: config.customerLabel,
    headConfig: config.headConfig,
    swingSpeed: config.swingSpeed,
    par: config.par,
  };

  if (pageState === "already-played" && result) {
    return <AlreadyPlayedScreen config={config} result={result} />;
  }

  return (
    <main className="h-dvh overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-2 barber-stripes" />

      <nav className="px-4 py-3 flex items-center justify-between mt-2 shrink-0">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
        >
          ← Shop
        </Link>
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] opacity-50">DAILY CUT</p>
          <h1 className="font-display text-xl font-bold leading-tight">
            {config.holiday
              ? `${config.holiday.emoji} ${config.holiday.shortLabel}`
              : config.dateString}
          </h1>
        </div>
        <div className="w-16" />
      </nav>

      <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4">
        <Game level={dailyLevel} onFinish={handleFinish} />
      </div>

      {pageState === "finished" && result && (
        <DailyResultModal config={config} result={result} />
      )}
    </main>
  );
}

// ─── Already-played screen ────────────────────────────────────────────────────

function AlreadyPlayedScreen({ config, result }: { config: DailyConfig; result: Result }) {
  const title = config.holiday
    ? `${config.holiday.emoji} ${config.holiday.name}`
    : "Today's Cut";

  const shareText = buildShareText({
    title,
    dateString: config.dateString,
    passes: result.passes,
    par: config.par,
    stars: result.stars,
    passQualities: result.passQualities ?? [],
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fef3e7]">
      <div className="absolute top-0 left-0 right-0 h-2 barber-stripes" />

      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-[#0f2942] shadow-2xl text-[#0f2942]">
        <p className="text-xs uppercase tracking-[0.3em] opacity-60 font-mono text-center">
          Already Played Today
        </p>
        <h2 className="text-3xl font-display font-bold text-center mt-1 mb-1">{title}</h2>
        <p className="text-xs font-mono text-center opacity-50 mb-6">{config.dateString}</p>

        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Star key={i} filled={i <= result.stars} />
          ))}
        </div>

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

        <p className="text-xs font-mono text-center opacity-50 mb-4">Come back tomorrow for a new cut ✂</p>
        <div className="flex flex-col gap-2">
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
    </main>
  );
}

// Leaderboard fetch preserved for future re-enabling:
// useEffect(() => {
//   fetch(`/api/daily-scores?date=${config.dateString}`)
//     .then(r => r.json())
//     .then(setLeaderboard)
//     .catch(() => setLeaderboard([]));
// }, [config.dateString]);

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" className={filled ? "text-[#ea580c] animate-pop" : "text-[#0f2942]/15"}>
      <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
