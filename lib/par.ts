import type { HeadGeometry } from "./head-system";

const CLIPPER_STRIPE_WIDTH = 44; // matches CLIPPER_RADIUS * 2 in Game.tsx
const COVERAGE_GRID = 60;        // must match coverage.ts

export function computePar(geometry: HeadGeometry, totalHairPixels: number): number {
  // countHairPixels() returns sampled grid points, not actual pixels.
  // Multiply by step size to recover the approximate actual pixel area.
  const stepX = Math.max(1, Math.floor(geometry.bounds.w / COVERAGE_GRID));
  const stepY = Math.max(1, Math.floor(geometry.bounds.h / COVERAGE_GRID));
  const actualHairPixels = totalHairPixels * stepX * stepY;

  // Some hair paths (fluffy, spiky, man-bun) extend above the skull in their
  // bounding box. Using bounds.h overestimates the per-pass coverage because
  // those above-skull pixels are empty — the canvas clip removes them.
  // Clamp to the actual skull extent so stripeArea reflects real hair height.
  const hairHeight = Math.max(
    1,
    Math.min(geometry.bounds.y + geometry.bounds.h, geometry.skullBottom) -
      Math.max(geometry.bounds.y, geometry.skullTop),
  );

  // One ideal pass covers a 44px-wide strip across the skull-bounded hair height.
  const stripeArea = CLIPPER_STRIPE_WIDTH * hairHeight;

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
