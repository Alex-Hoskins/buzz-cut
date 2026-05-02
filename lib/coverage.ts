// Shared hair-pixel counting — used by both Game.tsx (initial total) and
// daily.ts (par computation). Both call the same function so their counts
// are guaranteed to agree.

import type { HeadGeometry } from "./head-system";

const CANVAS_W = 700;
const CANVAS_H = 520;
const COVERAGE_GRID = 60;
const ALPHA_THRESHOLD = 100;

function countOpaquePixels(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; w: number; h: number }
): number {
  const bx = Math.max(0, Math.floor(bounds.x));
  const by = Math.max(0, Math.floor(bounds.y));
  const bw = Math.min(CANVAS_W - bx, Math.ceil(bounds.x + bounds.w) - bx);
  const bh = Math.min(CANVAS_H - by, Math.ceil(bounds.y + bounds.h) - by);
  if (bw <= 0 || bh <= 0) return 0;

  const { data } = ctx.getImageData(bx, by, bw, bh);
  const stepX = Math.max(1, Math.floor(bounds.w / COVERAGE_GRID));
  const stepY = Math.max(1, Math.floor(bounds.h / COVERAGE_GRID));
  let count = 0;
  for (let py = by; py < by + bh; py += stepY) {
    for (let px = bx; px < bx + bw; px += stepX) {
      if (data[((py - by) * bw + (px - bx)) * 4 + 3] > ALPHA_THRESHOLD) count++;
    }
  }
  return count;
}

export function countHairPixels(geometry: HeadGeometry): number {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.save();
  ctx.clip(geometry.headPath);
  ctx.fillStyle = "#000000";
  ctx.fill(geometry.hairPath);
  ctx.restore();
  return countOpaquePixels(ctx, geometry.bounds);
}
