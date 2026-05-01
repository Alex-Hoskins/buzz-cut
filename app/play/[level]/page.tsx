"use client";

import { useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import Game from "@/components/Game";
import ResultModal from "@/components/ResultModal";
import { getLevel } from "@/lib/levels";

type Result = { passes: number; timeMs: number; stars: 1 | 2 | 3 };

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

  if (!level) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-2 barber-stripes" />

      {/* Top nav */}
      <nav className="px-6 py-4 flex items-center justify-between mt-2">
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
          <h1 className="font-display text-xl font-bold leading-tight">
            {level.name}
          </h1>
        </div>
        <button
          onClick={() => setGameKey((k) => k + 1)}
          className="font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
        >
          Restart ↻
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <Game
          key={gameKey}
          level={level}
          onFinish={(r) => setResult(r)}
        />
      </div>

      {result && (
        <ResultModal
          level={level}
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
