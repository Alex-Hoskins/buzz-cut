import type { HeadGeometry } from "./head-system";

const CLIPPER_STRIPE_WIDTH = 44; // matches CLIPPER_RADIUS * 2 in Game.tsx

export function computePar(geometry: HeadGeometry, totalHairPixels: number): number {
  // Constraint 1: geometric minimum — stripes needed to span the hair width
  const geometricMin = Math.ceil(geometry.bounds.w / CLIPPER_STRIPE_WIDTH);

  // Constraint 2: density-based — actual hair area vs expected coverage per pass
  const stripeArea = CLIPPER_STRIPE_WIDTH * geometry.bounds.h;
  const PER_PASS_EFFICIENCY = 0.85;
  const densityBased = Math.ceil(totalHairPixels / (stripeArea * PER_PASS_EFFICIENCY));

  const SLACK = 1;
  const par = Math.max(geometricMin, densityBased) + SLACK;

  return Math.max(3, Math.min(12, par));
}
