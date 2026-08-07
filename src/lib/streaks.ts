/**
 * Logging streaks — Phase 4 retention mechanic.
 *
 * A "logging day" is any local calendar day with at least one transaction
 * (expense OR income). The current streak is the run of consecutive logged
 * days ending today; if today has no entry yet, the run ending yesterday
 * stays alive but is "at risk" (loggedToday === false) until the user logs
 * something. The longest streak is the max run over all history.
 *
 * All date math is done on local "YYYY-MM-DD" strings via the local Date
 * constructor (never Date.parse / UTC), matching src/utils/dateHelpers.ts.
 *
 * The module also owns a tiny AsyncStorage cache (`ari_streak_cache`) so the
 * daily-reminder copy in useNotifications can prefer a streak-save variant
 * when a streak is active and today is not yet logged.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toLocalISODate } from '../utils/dateHelpers';

export interface LoggedDay {
  date: string; // "YYYY-MM-DD" (local)
  count: number; // transactions logged that day
}

export interface StreakInfo {
  current: number;
  longest: number;
  loggedToday: boolean;
}

/** AsyncStorage key for the streak snapshot consumed by reminder copy. */
export const STREAK_CACHE_KEY = 'ari_streak_cache';

/** Minimum streak length that triggers streak-save reminder copy. */
export const STREAK_REMINDER_MIN = 3;

export interface StreakCache extends StreakInfo {
  date: string; // local date the numbers describe
  computedAt: number; // epoch ms
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Shift a "YYYY-MM-DD" local date by `delta` days. Uses the local Date
 * constructor + setDate, so month/year boundaries and DST never produce
 * off-by-one or UTC-rollover bugs.
 */
export function shiftISODate(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toLocalISODate(dt);
}

/**
 * Pure streak computation. `days` is the full logged-day history (any order,
 * duplicates tolerated); `today` is the local "YYYY-MM-DD" to anchor against.
 */
export function computeStreaks(days: LoggedDay[], today: string): StreakInfo {
  const logged = new Set<string>();
  for (const d of days) {
    if (d && DATE_RE.test(d.date) && d.count > 0) logged.add(d.date);
  }

  const loggedToday = logged.has(today);

  // Current run: walk backwards from today, or from yesterday when today
  // isn't logged yet (streak alive but at risk).
  let current = 0;
  let cursor = loggedToday ? today : shiftISODate(today, -1);
  while (logged.has(cursor)) {
    current += 1;
    cursor = shiftISODate(cursor, -1);
  }

  // Longest run ever: sorted unique dates, count consecutive-day runs.
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of [...logged].sort()) {
    run = prev !== null && shiftISODate(prev, 1) === date ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = date;
  }

  return { current, longest, loggedToday };
}

/**
 * Persist the latest streak snapshot for the daily-reminder copy path.
 * Best-effort — a failed write just means the reminder falls back to the
 * normal rotation.
 */
export async function writeStreakCache(info: StreakInfo): Promise<void> {
  try {
    const payload: StreakCache = {
      ...info,
      date: toLocalISODate(new Date()),
      computedAt: Date.now(),
    };
    await AsyncStorage.setItem(STREAK_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // cache write failed silently
  }
}

/**
 * Read the streak snapshot. Returns null when missing, malformed, or computed
 * on a different local day — "loggedToday" is only meaningful same-day, so
 * stale snapshots must fall back to the normal reminder rotation.
 */
export async function readStreakCache(): Promise<StreakCache | null> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StreakCache>;
    if (typeof parsed.current !== 'number' || typeof parsed.date !== 'string') {
      return null;
    }
    if (parsed.date !== toLocalISODate(new Date())) return null;
    return parsed as StreakCache;
  } catch {
    return null;
  }
}
