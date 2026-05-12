// Par = minimum passes to cover all hair + 1 slack.
// The minimum is computed by computeMinPasses() in coverage.ts via canvas scanning.

const SLACK = 2;

export function computePar(minPasses: number): number {
  return Math.max(3, Math.min(12, minPasses + SLACK));
}
