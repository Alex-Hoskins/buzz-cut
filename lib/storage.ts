// Persistent best-score storage (stars per level).

const KEY = "buzzcut.scores.v1";

export interface ScoreRecord {
  stars: 1 | 2 | 3;
  passes: number;
  timeMs: number;
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
