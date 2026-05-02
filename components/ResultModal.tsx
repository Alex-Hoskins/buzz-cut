"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Level } from "@/lib/levels";
import { LEVELS } from "@/lib/levels";
import { getPlayerId, getHandle, setHandle, hasHandle } from "@/lib/player";
import HandlePicker from "./HandlePicker";

interface Props {
  level: Level;
  result: { passes: number; timeMs: number; stars: 1 | 2 | 3 };
  onRetry: () => void;
}

interface LeaderboardEntry {
  handle: string;
  passes: number;
  timeMs: number;
  rank: number;
}

export default function ResultModal({ level, result, onRetry }: Props) {
  const next = LEVELS.find((l) => l.id === level.id + 1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHandlePicker, setShowHandlePicker] = useState(false);
  const [handleError, setHandleError] = useState("");
  const [playerId] = useState(() => getPlayerId());
  const [myHandle, setMyHandle] = useState("");

  const submitAndFetch = useCallback(
    async (handle: string, signal: AbortSignal) => {
      setSubmitting(true);
      setMyHandle(handle);
      try {
        const postResp = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            levelId: level.id,
            playerId,
            handle,
            passes: result.passes,
            timeMs: result.timeMs,
          }),
        });

        if (signal.aborted) return;

        if (postResp.status === 409) {
          // Handle taken — re-open the picker with an error message.
          setHandleError("Handle already taken — try another");
          setShowHandlePicker(true);
          setSubmitting(false);
          return;
        }

        if (postResp.ok) {
          // Server accepted: persist the handle locally now.
          setHandle(handle);
        }

        const res = await fetch(`/api/scores?level=${level.id}`, { signal });
        if (signal.aborted) return;
        if (!res.ok) throw new Error("fetch failed");
        setLeaderboard(await res.json());
      } catch (err) {
        if (signal.aborted) return;
        console.error("Leaderboard error:", err);
        setLeaderboardError(true);
      } finally {
        if (!signal.aborted) setSubmitting(false);
      }
    },
    [level.id, result.passes, result.timeMs, playerId]
  );

  useEffect(() => {
    // AbortController lets us cancel in-flight fetches on cleanup, which also
    // prevents React Strict Mode's double-invocation from leaving the component
    // in a stale state (first mount's async work is cancelled before remount).
    const ac = new AbortController();

    if (hasHandle()) {
      submitAndFetch(getHandle(), ac.signal);
    } else {
      setShowHandlePicker(true);
    }

    return () => ac.abort();
  }, [submitAndFetch]);

  const handlePickerSubmit = (handle: string) => {
    setHandleError("");
    setShowHandlePicker(false);
    const ac = new AbortController();
    submitAndFetch(handle, ac.signal);
    // No cleanup needed here — the picker is a one-shot user action.
  };

  return (
    <>
      {showHandlePicker && (
        <HandlePicker onSubmit={handlePickerSubmit} initialError={handleError} />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2942]/70 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-[#fef3e7] rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border-4 border-[#0f2942] text-[#0f2942] overflow-y-auto max-h-[90vh]">
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
              <p className="text-2xl font-bold">
                {(result.timeMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mb-6 border-t-2 border-[#0f2942]/10 pt-4">
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 font-mono text-center mb-3">
              Top Cuts
            </p>
            {submitting && (
              <p className="text-xs font-mono text-center opacity-50 py-2">
                Submitting...
              </p>
            )}
            {!submitting && leaderboardError && (
              <p className="text-xs font-mono text-center opacity-50 py-2">
                Couldn&apos;t reach leaderboard
              </p>
            )}
            {!submitting && !leaderboardError && leaderboard && leaderboard.length === 0 && (
              <p className="text-xs font-mono text-center opacity-50 py-2">
                No scores yet
              </p>
            )}
            {!submitting && leaderboard && leaderboard.length > 0 && (
              <div className="space-y-1">
                {leaderboard.map((entry) => {
                  const isMe = entry.handle === myHandle;
                  return (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-2 text-xs font-mono px-2 py-1.5 rounded-lg ${
                        isMe ? "bg-[#ea580c]/10 font-bold" : "bg-[#0f2942]/5"
                      }`}
                    >
                      <span className="opacity-50 w-4 shrink-0 text-right">{entry.rank}.</span>
                      <span className="flex-1 truncate">{entry.handle}</span>
                      <span className="shrink-0">{entry.passes}p</span>
                      <span className="opacity-50 shrink-0">
                        {(entry.timeMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
    </>
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
