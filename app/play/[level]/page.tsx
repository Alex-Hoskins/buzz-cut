"use client";

import { useState, use, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import Game from "@/components/Game";
import ResultModal from "@/components/ResultModal";
import { getLevel, type Level } from "@/lib/levels";
import { randomHeadConfig, type HeadConfig } from "@/lib/head-system";
import type { PassQuality } from "@/lib/share";

type Result = { passes: number; timeMs: number; stars: 1 | 2 | 3; par: number; passQualities: PassQuality[] };

export default function PlayPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: levelStr } = use(params);
  const router = useRouter();
  const levelId = parseInt(levelStr, 10);
  const level = getLevel(levelId);
  const [result, setResult] = useState<Result | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [overrideConfig, setOverrideConfig] = useState<HeadConfig | null>(null);
  const activeLevel: Level = overrideConfig ? { ...level!, headConfig: overrideConfig } : level!;
  // Stable reference — prevents Game's useEffect([level, onFinish]) from re-running on result state change.
  const handleFinish = useCallback((r: Result) => setResult(r), []);

  const handleRandom = useCallback(() => {
    setOverrideConfig(randomHeadConfig());
    setResult(null);
    setGameKey((k) => k + 1);
  }, []);

  if (!level) {
    notFound();
  }

  return (
    <main className="h-dvh overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-2 barber-stripes" />

      {/* Top nav */}
      <nav className="px-4 py-3 flex items-center justify-between mt-2 shrink-0">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
        >
          ← Shop
        </Link>
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] opacity-50">
            LEVEL {String(level.id).padStart(2, "0")}
          </p>
          <h1 className="font-display text-xl font-bold leading-tight max-w-[160px] truncate">
            {level.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {levelId === 6 && (
            <button
              onClick={handleRandom}
              className="font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
            >
              🎲 Random
            </button>
          )}
          <button
            onClick={() => { setResult(null); setGameKey((k) => k + 1); }}
            className="font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
          >
            Restart ↻
          </button>
        </div>
      </nav>

      <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4">
        <Game
          key={gameKey}
          level={activeLevel}
          onFinish={handleFinish}
        />
      </div>

      {result && (
        <ResultModal
          level={activeLevel}
          result={result}
          onRetry={() => {
            setResult(null);
            setGameKey((k) => k + 1);
          }}
        />
      )}
    </main>
  );
}
