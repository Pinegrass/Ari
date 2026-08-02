/**
 * Pure display math for budget rollover (Phase 2).
 *
 * The backend returns, per budget: `limit` (raw monthly limit), `rollover`
 * (amount carried from last month — positive for underspend, negative for
 * overspend) and `available` (limit + rollover). Progress bars and over/under
 * states should be computed against `available`, not the raw limit.
 */

export interface EffectiveProgress {
  /** Percentage of the effective budget used (0-100+, rounded). */
  percentage: number;
  /** Effective amount left; negative when over budget. */
  remaining: number;
  isOver: boolean;
}

export function effectiveProgress(spent: number, available: number): EffectiveProgress {
  const remaining = available - spent;
  let percentage: number;
  if (available > 0) {
    percentage = Math.round((spent / available) * 100);
  } else {
    // Rollover debt ate the whole limit — any spend is over.
    percentage = spent > 0 ? 100 : 0;
  }
  return { percentage, remaining, isOver: remaining < 0 };
}

/** True when a non-zero rollover applies to this budget. */
export function hasRollover(rollover: number | null | undefined): rollover is number {
  return typeof rollover === 'number' && rollover !== 0;
}
