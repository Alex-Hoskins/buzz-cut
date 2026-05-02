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

        {/* ── Today's Cut ───────────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="font-display text-3xl font-bold">Today&apos;s Cut</h2>
            <p className="text-sm opacity-50 font-mono">One fresh head, every day.</p>
          </div>

          {todayInfo === null ? (
            <div className="rounded-2xl bg-white border-2 border-[#0f2942] shadow-[6px_6px_0_#0f2942] p-6 h-40 animate-pulse max-w-sm" />
          ) : (
            <Link
              href="/play/daily"
              className="group block bg-[#0f2942] text-[#fef3e7] border-2 border-[#0f2942] rounded-2xl p-6 shadow-[6px_6px_0_#ea580c] hover:shadow-[2px_2px_0_#ea580c] hover:translate-x-1 hover:translate-y-1 transition-all max-w-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-xs opacity-50 tracking-widest">
                  {todayInfo.dateString}
                </span>
                {todayInfo.alreadyPlayed && (
                  <span className="font-mono text-xs text-[#ea580c]">✓ Played</span>
                )}
              </div>
              <h3 className="font-display text-2xl font-bold leading-tight mb-1">
                {todayInfo.holiday
                  ? `${todayInfo.holiday.emoji} ${todayInfo.holiday.name}`
                  : "Today's Customer"}
              </h3>
              <p className="text-sm opacity-60 mb-4">
                {todayInfo.alreadyPlayed ? "View your result" : "One shot. Make it count."}
              </p>
              <div className="flex justify-between items-center text-xs font-mono opacity-60">
                <span>PAR {todayInfo.par}</span>
                <span>{todayInfo.alreadyPlayed ? "View Result →" : "Play →"}</span>
              </div>
            </Link>
          )}
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
