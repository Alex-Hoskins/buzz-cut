// Persistent best-score storage (stars per level) + daily challenge results.

const KEY = "buzzcut.scores.v1";

import type { PassQuality } from "./share";

export interface ScoreRecord {
  stars: 1 | 2 | 3;
  passes: number;
  timeMs: number;
  passQualities?: PassQuality[];
}

export type Scores = Record<number, ScoreRecord>;

export function loadScores(): Scores {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Scores) : {};
  } catch {
    return {};
  }
}

export function saveScore(levelId: number, record: ScoreRecord): Scores {
  const scores = loadScores();
  const existing = scores[levelId];
  // Only overwrite if better: more stars, or same stars with fewer passes, or same with faster time.
  const isBetter =
    !existing ||
    record.stars > existing.stars ||
    (record.stars === existing.stars && record.passes < existing.passes) ||
    (record.stars === existing.stars &&
      record.passes === existing.passes &&
      record.timeMs < existing.timeMs);
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
// One result per calendar day, keyed by "buzzcut.daily.YYYY-MM-DD".
// First write wins — the game enforces one-shot before writing.

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
    // ignore — player can still play; result just won't persist
  }
}
