/**
 * recurringCost — monthly-equivalent normalization for recurring templates.
 *
 * Drives the Recurring Payments screen header: "what do my active recurring
 * payments cost per month?" Converts each rule to a monthly multiplier:
 *   weekly → ×4.33 (52 weeks / 12 months)
 *   biweekly → ×2.17 (26 / 12)
 *   monthly → ×1
 *   quarterly → ÷3
 *   yearly → ÷12
 * Pure and storage-free so every branch is unit-testable in plain Node
 * (same pattern as billSchedule.ts).
 */
import type { Transaction } from '../types';

/** Multiplier converting one occurrence of `rule` into a per-month cost. */
export const MONTHLY_EQUIVALENT: Record<
  NonNullable<Transaction['recurrenceRule']>,
  number
> = {
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

/** Monthly-equivalent cost of a single recurring template. */
export function monthlyEquivalent(
  amount: number,
  rule: NonNullable<Transaction['recurrenceRule']>,
): number {
  return amount * MONTHLY_EQUIVALENT[rule];
}

/**
 * Total monthly-equivalent cost of the ACTIVE recurring expense templates in
 * `transactions` (paused templates, child instances and recurring income are
 * excluded — the header answers "what do my recurring payments cost me?").
 */
export function totalMonthlyRecurringCost(transactions: Transaction[]): number {
  let total = 0;
  for (const t of transactions) {
    if (
      t.isRecurring !== true ||
      t.type !== 'expense' ||
      t.parentRecurringId != null ||
      t.recurrenceRule == null ||
      t.isPaused === true
    ) {
      continue;
    }
    total += monthlyEquivalent(t.amount, t.recurrenceRule);
  }
  return total;
}
