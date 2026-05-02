export type PassQuality = "clean" | "wasted";

export const CLEAN_THRESHOLD = 0.05; // must gain ≥5% coverage to count as clean

export interface ShareData {
  title: string;
  dateString?: string; // daily only
  passes: number;
  par: number;
  stars: 1 | 2 | 3;
  passQualities: PassQuality[];
}

export function buildShareText(data: ShareData): string {
  const grid = data.passQualities.map((q) => (q === "clean" ? "🟧" : "⬜")).join("");
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
