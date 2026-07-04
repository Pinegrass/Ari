/**
 * upcomingCharges — merges the two "money going out soon" data sources into one
 * list for the Dashboard card and the Trends section (Sprint 4, D2):
 *   1. Bills/EMIs  (device-local, ./bills)   — user-scheduled, have reminders
 *   2. Recurring txn projections (./recurringEngine) — derived from templates
 *
 * Pure and unit-tested. The card/Trends own the data fetching; this only merges,
 * de-dupes, and sorts.
 */
import { selectUpcomingBills, type Bill } from './bills';
import { projectUpcomingRecurring } from './recurringEngine';
import type { Transaction } from '../types';

export type ChargeSource = 'bill' | 'recurring';

export interface UpcomingCharge {
  /** Stable React key, namespaced by source. */
  key: string;
  name: string;
  amount: number;
  category: string;
  /** Next due date as 'YYYY-MM-DD'. */
  nextDueDate: string;
  /** Whole days until due. 0 = today. */
  daysUntil: number;
  source: ChargeSource;
}

function signature(name: string, amount: number, dueDate: string): string {
  return `${name.trim().toLowerCase()}|${amount}|${dueDate}`;
}

/**
 * Bills + recurring-expense projections due within `withinDays`, soonest-first.
 * A recurring projection that looks like an existing bill (same name + amount +
 * due date) is dropped in favour of the bill, which owns the reminder — so a
 * user who set up both for the same rent doesn't see it twice. Recurring income
 * is excluded (this is a "charges" list).
 */
export function selectUpcomingCharges(
  bills: Bill[],
  transactions: Transaction[],
  now: Date,
  withinDays = 30,
): UpcomingCharge[] {
  const billCharges: UpcomingCharge[] = selectUpcomingBills(bills, now, withinDays).map(
    (b) => ({
      key: `bill:${b.id}`,
      name: b.name,
      amount: b.amount,
      category: b.category,
      nextDueDate: b.nextDueDate,
      daysUntil: b.daysUntil,
      source: 'bill',
    }),
  );

  const billSigs = new Set(
    billCharges.map((c) => signature(c.name, c.amount, c.nextDueDate)),
  );

  const recurringCharges: UpcomingCharge[] = projectUpcomingRecurring(
    transactions,
    now,
    withinDays,
  )
    .filter((r) => r.type === 'expense')
    .filter((r) => !billSigs.has(signature(r.name, r.amount, r.nextDueDate)))
    .map((r) => ({
      key: `recurring:${r.templateId}`,
      name: r.name,
      amount: r.amount,
      category: r.category,
      nextDueDate: r.nextDueDate,
      daysUntil: r.daysUntil,
      source: 'recurring',
    }));

  return [...billCharges, ...recurringCharges].sort(
    (a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name),
  );
}
