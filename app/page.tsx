"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/levels";
import { loadScores, loadDailyResult, type Scores } from "@/lib/storage";
import { getTodayString, generateDaily } from "@/lib/daily";
import { getHolidayForDate, type HolidayConfig } from "@/lib/holidays";

interface TodayInfo {
  dateString: string;
  holiday: HolidayConfig | null;
  alreadyPlayed: boolean;
  par: number;
}

export default function Home() {
  const [scores, setScores] = useState<Scores>({});
  const [todayInfo, setTodayInfo] = useState<TodayInfo | null>(null);

  const visibleLevels = LEVELS.filter((l) => !l.hidden);

  useEffect(() => {
    setScores(loadScores());
  }, []);

  useEffect(() => {
    const dateString = getTodayString();
    const holiday = getHolidayForDate(dateString);
    const alreadyPlayed = loadDailyResult(dateString) !== null;
    const { par } = generateDaily(dateString);
    setTodayInfo({ dateString, holiday, alreadyPlayed, par });
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-3 barber-stripes" />

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-10 mt-4">
          <p className="text-xs font-mono tracking-[0.4em] text-[#ea580c] uppercase mb-3">
            ✂ Est. 2026 ✂
          </p>
          <h1 className="font-display text-5xl sm:text-7xl md:text-9xl font-black leading-none tracking-tight">
            Buzz<span className="text-[#ea580c]">.</span>Cut
          </h1>
          <p className="mt-4 text-lg max-w-md mx-auto opacity-70">
            A pendulum-clipper barbershop puzzle. Time your drops. Buzz the dome.
            Don&apos;t waste passes.
          </p>
        </header>

        {/* ── Daily Challenge Hero ───────────────────────────────────────── */}
        <section className="mb-12">
          <div className="bg-[#0f2942] text-[#fef3e7] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0_#ea580c] border-4 border-[#0f2942]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <p className="font-mono text-[10px] tracking-[0.4em] text-[#ea580c] uppercase mb-1">
                  Today&apos;s Cut
                </p>
                {todayInfo === null ? (
                  <div className="h-8 w-40 bg-white/10 rounded animate-pulse" />
                ) : (
                  <>
                    <h2 className="font-display text-3xl sm:text-4xl font-black leading-none">
                      {todayInfo.holiday
                        ? `${todayInfo.holiday.emoji} ${todayInfo.holiday.name}`
                        : todayInfo.dateString}
                    </h2>
                    <p className="mt-1 font-mono text-xs opacity-60">
                      {todayInfo.holiday ? todayInfo.dateString + " · " : ""}
                      Par {todayInfo.par}
                    </p>
                  </>
                )}
              </div>

              <div className="w-full sm:w-auto shrink-0">
                {todayInfo?.alreadyPlayed ? (
                  <Link
                    href="/play/daily"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 border-2 border-white/20 font-mono text-sm uppercase tracking-widest hover:bg-white/20 transition-colors"
                  >
                    ✓ View My Result
                  </Link>
                ) : (
                  <Link
                    href="/play/daily"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#ea580c] font-mono text-sm uppercase tracking-widest hover:bg-[#c2410c] transition-colors shadow-[4px_4px_0_rgba(255,255,255,0.2)]"
                  >
                    Play Today&apos;s Cut →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Practice Mode ─────────────────────────────────────────────── */}
        <section id="practice">
          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="font-display text-3xl font-bold">Practice Mode</h2>
            <p className="text-sm opacity-50 font-mono">Classic cuts. No pressure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleLevels.map((level) => {
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
                          className={score && i <= score.stars ? "text-[#ea580c]" : "opacity-20"}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="font-display text-2xl font-bold leading-tight mb-1">{level.name}</h3>
                  <p className="text-sm opacity-70 mb-4">{level.subtitle}</p>
                  <div className="flex justify-between items-center text-xs font-mono opacity-60">
                    <span>PAR {level.par}</span>
                    {score && <span>BEST: {score.passes}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Leaderboard hidden — see commit message. Re-enable by uncommenting. */}
        {/*
        <section className="mt-16">
          <h2 className="font-display text-3xl font-bold text-center mb-8">All-Time Top Cuts</h2>
          ...top-cuts-per-level grid...
        </section>
        */}

        <footer className="mt-16 text-center text-xs font-mono opacity-40 tracking-widest uppercase">
          Click • Tap • Spacebar to drop the clippers
        </footer>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-3 barber-stripes" />
    </main>
  );
}
