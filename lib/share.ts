export type PassQuality = "clean" | "partial" | "wasted";

export const CLEAN_THRESHOLD = 0.07;   // >= 7% new coverage = clean
export const PARTIAL_THRESHOLD = 0.02; // 2–7% = partial, < 2% = wasted

const QUALITY_EMOJI: Record<PassQuality, string> = {
  clean:   "🟧",
  partial: "🟨",
  wasted:  "⬜",
};

export interface ShareData {
  title: string;
  dateString?: string; // daily only
  passes: number;
  par: number;
  stars: 1 | 2 | 3;
  passQualities: PassQuality[];
}

export function buildShareText(data: ShareData): string {
  const grid = data.passQualities.map((q) => QUALITY_EMOJI[q] ?? "⬜").join("");
  const stars = "⭐".repeat(data.stars);
  const lines: string[] = [
    `Buzz.Cut ✂ ${data.title}`,
    ...(data.dateString ? [data.dateString] : []),
    grid,
    stars,
    `${data.passes} passes (par ${data.par}) · playbuzzcut.com`,
  ];
  return lines.join("\n");
}
