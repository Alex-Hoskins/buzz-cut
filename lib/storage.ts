// Persistent best-score storage + daily challenge results.
// ScoreRecord intentionally omits stars — stars are computed live from
// passes + current par so they stay accurate if par changes.

const KEY = "buzzcut.scores.v1";

import type { PassQuality } from "./share";

export interface ScoreRecord {
  passes: number;
  timeMs: number;
  passQualities?: PassQuality[];
}

export type Scores = Record<number, ScoreRecord>;

export function loadScores(): Scores {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<number, ScoreRecord & { stars?: unknown }>;
    // Migration: strip the old `stars` field if present so storage stays canonical.
    let migrated = false;
    for (const key of Object.keys(parsed)) {
      if ("stars" in parsed[Number(key)]) {
        const { stars: _stars, ...rest } = parsed[Number(key)] as ScoreRecord & { stars: unknown };
        parsed[Number(key)] = rest;
        migrated = true;
      }
    }
    if (migrated) {
      try { window.localStorage.setItem(KEY, JSON.stringify(parsed)); } catch { /* ignore */ }
    }
    return parsed as Scores;
  } catch {
    return {};
  }
}

export function saveScore(levelId: number, record: ScoreRecord): Scores {
  const scores = loadScores();
  const existing = scores[levelId];
  // Fewer passes is better; tie-break on time.
  const isBetter =
    !existing ||
    record.passes < existing.passes ||
    (record.passes === existing.passes && record.timeMs < existing.timeMs);
  if (isBetter) {
    scores[levelId] = record;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(scores));
    } catch {
      // ignore
    }
  }
  return scores;
}

// ─── Daily challenge storage ──────────────────────────────────────────────────

const DAILY_PREFIX = "buzzcut.daily.";

export function loadDailyResult(dateString: string): ScoreRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DAILY_PREFIX + dateString);
    return raw ? (JSON.parse(raw) as ScoreRecord) : null;
  } catch {
    return null;
  }
}

export function saveDailyResult(dateString: string, record: ScoreRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DAILY_PREFIX + dateString, JSON.stringify(record));
  } catch {
    // ignore
  }
}
