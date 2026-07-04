/**
 * recurringEngine — Sprint 3 recurring transaction generator.
 *
 * Templates: transactions where `isRecurring === true` and
 * `parentRecurringId == null`. Child instances have `isRecurring: false` and
 * carry the template's id in `parentRecurringId`.
 *
 * Idempotent: safe to call multiple times per day. A child with the same
 * `parentRecurringId + date` is never created twice.
 *
 * Catch-up: if a template was created months ago, every missed instance up to
 * and including today is generated. Capped at MAX_INSTANCES per call to
 * prevent runaway on very old data.
 */
import { localStore } from './localStore';
import type { Transaction } from '../types';

const MAX_INSTANCES = 24;

/** Add months without overflowing end-of-month boundaries. */
function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  const targetDay = d.getDate();
  d.setMonth(d.getMonth() + n);
  // If the day overflowed (e.g. Jan 31 + 1 month = Mar 3) pin to last day of
  // the target month.
  if (d.getDate() !== targetDay) d.setDate(0);
  return d;
}

function nextDueDate(
  from: Date,
  rule: NonNullable<Transaction['recurrenceRule']>
): Date {
  switch (rule) {
    case 'monthly':
      return addMonths(from, 1);
    case 'weekly':
      return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'biweekly':
      return new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
    case 'quarterly':
      return addMonths(from, 3);
    case 'yearly':
      return addMonths(from, 12);
  }
}

function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string as local midnight (avoids UTC offset shifting the day). */
function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/**
 * Check all recurring templates in `transactions` and generate any instances
 * that are due up to and including today but don't already exist.
 *
 * @param transactions  The full list of transactions from localStore.getAll().
 * @returns             Newly created Transaction instances (empty if nothing was due).
 */
export async function checkAndGenerateDue(
  transactions: Transaction[]
): Promise<Transaction[]> {
  const todayStr = toDateOnly(new Date());
  const todayDate = parseLocalDate(todayStr);

  // Build a Set of `${parentRecurringId}:${date}` keys for O(1) duplicate checks.
  const existingKeys = new Set<string>();
  for (const t of transactions) {
    if (t.parentRecurringId) {
      existingKeys.add(`${t.parentRecurringId}:${t.date}`);
    }
  }

  // Templates: isRecurring=true, no parentRecurringId, must have a recurrenceRule.
  const templates = transactions.filter(
    (t): t is Transaction & { recurrenceRule: NonNullable<Transaction['recurrenceRule']> } =>
      t.isRecurring === true &&
      t.parentRecurringId == null &&
      t.recurrenceRule != null
  );

  const created: Transaction[] = [];

  for (const template of templates) {
    const rule = template.recurrenceRule;
    const templateDateStr =
      typeof template.date === 'string'
        ? template.date
        : toDateOnly(template.date as unknown as Date);

    let cursor = parseLocalDate(templateDateStr);
    let count = 0;

    // Walk forward from the template date, generating every missed due date up
    // to and including today.
    while (count < MAX_INSTANCES) {
      const nextDate = nextDueDate(cursor, rule);
      const nextDateStr = toDateOnly(nextDate);

      if (nextDate > todayDate) break; // not due yet — stop

      const key = `${template.id}:${nextDateStr}`;
      if (!existingKeys.has(key)) {
        const record = await localStore.create({
          type: template.type,
          amount: template.amount,
          category: template.category,
          description: template.description,
          note: template.note,
          date: nextDateStr,
          parseSource: 'local',
          confidence: null,
          // Mark as a non-recurring child instance of this template.
          isRecurring: false,
          parentRecurringId: template.id,
        });

        const instance: Transaction = {
          id: record.id,
          userId: record.userId,
          amount: record.amount,
          type: record.type,
          category: (record.category ?? 'other') as Transaction['category'],
          description: record.description,
          note: record.note,
          date: record.date,
          month: record.date.slice(0, 7),
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          syncStatus: 'pending',
          isRecurring: false,
          parentRecurringId: template.id,
        };

        created.push(instance);
        // Prevent duplicates within the same call in case we generate multiple
        // instances for the same template in one run.
        existingKeys.add(key);
      }

      cursor = nextDate;
      count++;
    }
  }

  return created;
}

// ─── Forward projection (D2 "Upcoming charges") ──────────────────────────────

export interface RecurringProjection {
  /** The recurring template's id. */
  templateId: string;
  name: string;
  amount: number;
  category: string;
  type: Transaction['type'];
  /** Next future occurrence as 'YYYY-MM-DD' (local). */
  nextDueDate: string;
  /** Whole days from today until that occurrence. 0 = today. */
  daysUntil: number;
}

const PROJECT_GUARD = 600; // cap the walk (weekly over years) against bad data

/**
 * Project the NEXT future occurrence of each recurring template within
 * `withinDays` days. Unlike checkAndGenerateDue this creates nothing — it's a
 * read-only look-ahead that drives the "Upcoming charges" surfaces. The next
 * occurrence is the first one strictly after today (past-due instances are
 * materialised by checkAndGenerateDue, not projected here). Sorted soonest-first.
 */
export function projectUpcomingRecurring(
  transactions: Transaction[],
  now: Date,
  withinDays = 30,
): RecurringProjection[] {
  const todayStr = toDateOnly(now);
  const today = parseLocalDate(todayStr);
  const todayMs = today.getTime();

  const templates = transactions.filter(
    (t): t is Transaction & { recurrenceRule: NonNullable<Transaction['recurrenceRule']> } =>
      t.isRecurring === true && t.parentRecurringId == null && t.recurrenceRule != null,
  );

  const out: RecurringProjection[] = [];
  for (const template of templates) {
    const rule = template.recurrenceRule;
    const templateDateStr =
      typeof template.date === 'string'
        ? template.date
        : toDateOnly(template.date as unknown as Date);

    // Walk forward until strictly after today. A future-dated template stays put
    // (its start date is the first occurrence).
    let cursor = parseLocalDate(templateDateStr);
    let guard = 0;
    while (cursor.getTime() <= todayMs && guard < PROJECT_GUARD) {
      cursor = nextDueDate(cursor, rule);
      guard++;
    }

    const daysUntil = Math.round((cursor.getTime() - todayMs) / 86_400_000);
    if (daysUntil >= 0 && daysUntil <= withinDays) {
      out.push({
        templateId: template.id,
        name: template.description || template.category,
        amount: template.amount,
        category: template.category,
        type: template.type,
        nextDueDate: toDateOnly(cursor),
        daysUntil,
      });
    }
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}
