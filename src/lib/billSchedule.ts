/**
 * billSchedule — pure date math for bill / EMI due-date reminders (Sprint 3, D1).
 *
 * All calendar reasoning is anchored to IST (India Standard Time, UTC+5:30).
 * India observes no DST, so the offset is a fixed +5:30 year-round — which is
 * what makes this module deterministic and cheap to test regardless of the
 * machine's local timezone (CI, a US laptop, an Indian phone all agree).
 *
 * The module is intentionally free of React, storage, and expo-notifications so
 * every branch (month-end clamping, Feb, leap years, month-boundary "day
 * before", roll-forward) is unit-testable in plain Node. The scheduling/storage
 * side effects live in src/lib/bills.ts, which consumes these functions.
 */

/** IST is UTC+5:30, fixed all year (no daylight saving in India). */
export const IST_OFFSET_MIN = 330;
const IST_OFFSET_MS = IST_OFFSET_MIN * 60 * 1000;

/** Default reminder wall-clock time (IST): 9:00 AM on the due day / day before. */
export const DEFAULT_REMINDER_HOUR = 9;
export const DEFAULT_REMINDER_MINUTE = 0;

/** A calendar date with a 1-based month (1 = January), in the IST calendar. */
export interface CalDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export type ReminderKind = 'day_before' | 'day_of';

export interface BillReminder {
  kind: ReminderKind;
  /** Absolute instant the notification should fire. */
  fireAt: Date;
  /** The due day this reminder belongs to, as an IST 'YYYY-MM-DD' string. */
  occurrenceDate: string;
}

/** Days in a given month. `month` is 1-based. Handles Feb + leap years. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month === last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Clamp a desired day-of-month to a month that may be shorter (e.g. 31 → 28
 *  in a non-leap February, 31 → 30 in April). */
export function clampDayToMonth(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/** Format a CalDate as an IST 'YYYY-MM-DD' string. */
export function toISODate(d: CalDate): string {
  const mm = String(d.month).padStart(2, '0');
  const dd = String(d.day).padStart(2, '0');
  return `${d.year}-${mm}-${dd}`;
}

/** The IST calendar date (year/month/day) for a given absolute instant. */
export function istToday(now: Date): CalDate {
  // Shift the instant into IST wall-clock, then read the UTC fields — those now
  // spell out the IST calendar date/time.
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** The absolute instant for a given IST wall-clock date + time. */
export function istInstant(
  d: CalDate,
  hour: number = DEFAULT_REMINDER_HOUR,
  minute: number = DEFAULT_REMINDER_MINUTE
): Date {
  // Interpret (d, hour, minute) as IST wall time; convert back to a UTC instant
  // by subtracting the IST offset. Date.UTC lets us build the wall time cleanly.
  return new Date(Date.UTC(d.year, d.month - 1, d.day, hour, minute) - IST_OFFSET_MS);
}

/** The calendar date `n` days before `d` (n days after if negative), IST. */
export function addDays(d: CalDate, n: number): CalDate {
  const shifted = new Date(Date.UTC(d.year, d.month - 1, d.day) + n * 86_400_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** Is `a` strictly before `b` on the IST calendar? */
function isBefore(a: CalDate, b: CalDate): boolean {
  if (a.year !== b.year) return a.year < b.year;
  if (a.month !== b.month) return a.month < b.month;
  return a.day < b.day;
}

/**
 * The monthly occurrence of `dueDay` on or after `fromMonthsAhead` months from
 * today (IST), clamped to that month's length. `fromMonthsAhead = 0` yields the
 * occurrence in today's month; the caller advances when it has already passed.
 */
function occurrenceInMonth(dueDay: number, base: CalDate, monthsAhead: number): CalDate {
  const totalMonth = base.month - 1 + monthsAhead; // 0-based
  const year = base.year + Math.floor(totalMonth / 12);
  const month = (totalMonth % 12) + 1;
  return { year, month, day: clampDayToMonth(year, month, dueDay) };
}

/**
 * Next monthly occurrence of `dueDay` on or after today (IST). If this month's
 * (clamped) occurrence has already passed, rolls to next month.
 */
export function nextMonthlyOccurrence(dueDay: number, now: Date): CalDate {
  const today = istToday(now);
  const thisMonth = occurrenceInMonth(dueDay, today, 0);
  if (isBefore(thisMonth, today)) {
    return occurrenceInMonth(dueDay, today, 1);
  }
  return thisMonth;
}

/**
 * The two reminders (day before + day of) for a single occurrence, filtered to
 * those still in the future relative to `now`. Returns 0, 1, or 2 reminders.
 */
export function remindersForOccurrence(
  occurrence: CalDate,
  now: Date,
  hour: number = DEFAULT_REMINDER_HOUR,
  minute: number = DEFAULT_REMINDER_MINUTE
): BillReminder[] {
  const occIso = toISODate(occurrence);
  const dayBefore = addDays(occurrence, -1);
  const candidates: BillReminder[] = [
    { kind: 'day_before', fireAt: istInstant(dayBefore, hour, minute), occurrenceDate: occIso },
    { kind: 'day_of', fireAt: istInstant(occurrence, hour, minute), occurrenceDate: occIso },
  ];
  return candidates.filter((r) => r.fireAt.getTime() > now.getTime());
}

export interface BillLike {
  /** 1-31; clamped to the target month's length. */
  dueDay: number;
  /** true = recurs every month; false = one-time (a single upcoming occurrence). */
  repeatMonthly: boolean;
  /** For one-time bills only: the resolved 'YYYY-MM-DD' occurrence. Ignored when
   *  repeatMonthly is true. */
  oneTimeDate?: string;
}

/**
 * The reminders to schedule for a bill right now. This is the function the
 * scheduler calls.
 *
 * - Monthly: picks the next occurrence; if all of its reminders are already in
 *   the past (e.g. the app is opened the afternoon of the due day), rolls to the
 *   following month so the bill is never left with zero future reminders.
 * - One-time: schedules the single `oneTimeDate` occurrence; returns [] once it
 *   has passed (the bill is spent).
 */
export function upcomingReminders(
  bill: BillLike,
  now: Date,
  hour: number = DEFAULT_REMINDER_HOUR,
  minute: number = DEFAULT_REMINDER_MINUTE
): BillReminder[] {
  if (!bill.repeatMonthly) {
    if (!bill.oneTimeDate) return [];
    const [y, m, d] = bill.oneTimeDate.split('-').map(Number);
    return remindersForOccurrence({ year: y, month: m, day: d }, now, hour, minute);
  }

  const occurrence = nextMonthlyOccurrence(bill.dueDay, now);
  let reminders = remindersForOccurrence(occurrence, now, hour, minute);
  if (reminders.length === 0) {
    // The chosen occurrence is fully in the past (e.g. app opened the evening of
    // the due day) — schedule the following month's occurrence instead. Base the
    // roll-forward on day 1 so a month-end occurrence doesn't skip a month.
    const next = occurrenceInMonth(
      bill.dueDay,
      { year: occurrence.year, month: occurrence.month, day: 1 },
      1
    );
    reminders = remindersForOccurrence(next, now, hour, minute);
  }
  return reminders;
}
