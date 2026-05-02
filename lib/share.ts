export type PassQuality = "clean" | "partial" | "wasted";

export const CLEAN_HAIR_RATIO = 0.5; // >= 50% of stripe path over hair = clean

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
