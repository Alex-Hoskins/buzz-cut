import type { HeadGeometry } from "./head-system";

const CLIPPER_STRIPE_WIDTH = 44; // matches CLIPPER_RADIUS * 2 in Game.tsx
const COVERAGE_GRID = 60;        // must match coverage.ts

export function computePar(geometry: HeadGeometry, totalHairPixels: number): number {
  // countHairPixels() returns sampled grid points, not actual pixels.
  // Multiply by step size to recover the approximate actual pixel area.
  const stepX = Math.max(1, Math.floor(geometry.bounds.w / COVERAGE_GRID));
  const stepY = Math.max(1, Math.floor(geometry.bounds.h / COVERAGE_GRID));
  const actualHairPixels = totalHairPixels * stepX * stepY;

  // One ideal pass covers a 44px-wide strip across the full bounding height.
  const stripeArea = CLIPPER_STRIPE_WIDTH * geometry.bounds.h;

  // Passes needed = total hair area ÷ area removed per skilled pass.
  // This naturally captures both hair width (sparse → few passes) and
  // density (multi-region → more passes) without needing a separate
  // bounding-box-width term, which overcounts for narrow/concentrated hair
  // (man-bun, mohawk, spiky) whose bounds.w equals the full skull width.
  const PER_PASS_EFFICIENCY = 0.85;
  const rawPasses = Math.ceil(actualHairPixels / (stripeArea * PER_PASS_EFFICIENCY));

  const SLACK = 1;
  return Math.max(3, Math.min(12, rawPasses + SLACK));
}
