// Shared hair-pixel utilities — used by Game.tsx (coverage %) and par computation.

import type { HeadGeometry } from "./head-system";

const CANVAS_W = 700;
const CANVAS_H = 520;
const COVERAGE_GRID = 60;
const ALPHA_THRESHOLD = 100;
const CLIPPER_STRIPE_WIDTH = 44;

function renderHair(geometry: HeadGeometry): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.save();
  ctx.clip(geometry.headPath);
  ctx.fillStyle = "#000000";
  ctx.fill(geometry.hairPath);
  ctx.restore();
  return ctx;
}

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

// Returns the sampled opaque pixel count used for in-game coverage tracking.
export function countHairPixels(geometry: HeadGeometry): number {
  return countOpaquePixels(renderHair(geometry), geometry.bounds);
}

// Returns the minimum number of clipper passes needed to cover all hair.
// Scans the rendered canvas column by column, finds contiguous horizontal runs
// of hair, and sums ceil(run_width / CLIPPER_STRIPE_WIDTH) for each run.
// This is correct because one pass clears a full vertical strip regardless of
// how much hair is in it — only horizontal coverage width matters.
export function computeMinPasses(geometry: HeadGeometry): number {
  const ctx = renderHair(geometry);

  const bx = Math.max(0, Math.floor(geometry.bounds.x));
  const bw = Math.min(CANVAS_W - bx, Math.ceil(geometry.bounds.x + geometry.bounds.w) - bx);
  const by = Math.max(0, Math.floor(geometry.bounds.y));
  const bh = Math.min(CANVAS_H - by, Math.ceil(geometry.bounds.y + geometry.bounds.h) - by);
  if (bw <= 0 || bh <= 0) return 0;

  const { data } = ctx.getImageData(bx, by, bw, bh);

  let passes = 0;
  let inRun = false;
  let runWidth = 0;

  for (let col = 0; col < bw; col++) {
    let hasHair = false;
    for (let row = 0; row < bh; row++) {
      if (data[(row * bw + col) * 4 + 3] > ALPHA_THRESHOLD) {
        hasHair = true;
        break;
      }
    }
    if (hasHair) {
      if (!inRun) { inRun = true; runWidth = 1; }
      else { runWidth++; }
    } else if (inRun) {
      passes += Math.ceil(runWidth / CLIPPER_STRIPE_WIDTH);
      inRun = false;
      runWidth = 0;
    }
  }
  if (inRun) passes += Math.ceil(runWidth / CLIPPER_STRIPE_WIDTH);

  return passes;
}
