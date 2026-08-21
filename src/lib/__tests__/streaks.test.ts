/**
 * Tests for the streak engine (src/lib/streaks.ts).
 *
 * Covers: empty history, single day, consecutive runs, gap breaking a streak,
 * the today-not-logged "at risk" case, longest vs current, month/year
 * boundaries, malformed input, and the AsyncStorage cache round-trip +
 * same-day staleness rule. All dates are local "YYYY-MM-DD" strings — the
 * module under test never touches UTC, so these tests are timezone-safe.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { toLocalISODate } from '../../utils/dateHelpers';
import {
  computeStreaks,
  shiftISODate,
  writeStreakCache,
  readStreakCache,
  STREAK_CACHE_KEY,
  type LoggedDay,
} from '../streaks';

// In-memory AsyncStorage (jest.mock factory vars must be `mock`-prefixed).
const mockStore = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((k: string) => Promise.resolve(mockStore.has(k) ? mockStore.get(k)! : null)),
    setItem: jest.fn((k: string, v: string) => {
      mockStore.set(k, v);
      return Promise.resolve();
    }),
    removeItem: jest.fn((k: string) => {
      mockStore.delete(k);
      return Promise.resolve();
    }),
  },
}));
const TODAY = toLocalISODate(new Date());

/** Build a LoggedDay list from date strings (count 1 each). */
const days = (...dates: string[]): LoggedDay[] => dates.map((date) => ({ date, count: 1 }));

beforeEach(() => mockStore.clear());

// --- shiftISODate ---------------------------------------------------------

describe('shiftISODate', () => {
  it('shifts within a month', () => {
    expect(shiftISODate('2026-07-10', -1)).toBe('2026-07-09');
    expect(shiftISODate('2026-07-10', 3)).toBe('2026-07-13');
  });

  it('crosses month boundaries both ways', () => {
    expect(shiftISODate('2026-08-01', -1)).toBe('2026-07-31');
    expect(shiftISODate('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('crosses year boundaries', () => {
    expect(shiftISODate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftISODate('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('handles leap day', () => {
    expect(shiftISODate('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftISODate('2024-03-01', -1)).toBe('2024-02-29');
  });
});

// --- computeStreaks --------------------------------------------------------

describe('computeStreaks', () => {
  it('empty history -> all zeros, not logged today', () => {
    expect(computeStreaks([], TODAY)).toEqual({ current: 0, longest: 0, loggedToday: false });
  });

  it('single day logged today -> current 1, longest 1', () => {
    expect(computeStreaks(days(TODAY), TODAY)).toEqual({
      current: 1,
      longest: 1,
      loggedToday: true,
    });
  });

  it('single day logged yesterday -> streak alive but at risk', () => {
    const yesterday = shiftISODate(TODAY, -1);
    expect(computeStreaks(days(yesterday), TODAY)).toEqual({
      current: 1,
      longest: 1,
      loggedToday: false,
    });
  });

  it('single day logged two days ago -> streak dead', () => {
    const twoDaysAgo = shiftISODate(TODAY, -2);
    expect(computeStreaks(days(twoDaysAgo), TODAY)).toEqual({
      current: 0,
      longest: 1,
      loggedToday: false,
    });
  });

  it('consecutive run ending today', () => {
    const run = days(
      shiftISODate(TODAY, -3),
      shiftISODate(TODAY, -2),
      shiftISODate(TODAY, -1),
      TODAY
    );
    expect(computeStreaks(run, TODAY)).toEqual({ current: 4, longest: 4, loggedToday: true });
  });

  it('gap breaks the current streak but longest remembers the old run', () => {
    // Old 5-day run, then a gap, then logged yesterday only.
    const history = days(
      shiftISODate(TODAY, -10),
      shiftISODate(TODAY, -9),
      shiftISODate(TODAY, -8),
      shiftISODate(TODAY, -7),
      shiftISODate(TODAY, -6),
      // gap on -5..-2
      shiftISODate(TODAY, -1)
    );
    expect(computeStreaks(history, TODAY)).toEqual({
      current: 1,
      longest: 5,
      loggedToday: false,
    });
  });

  it('current streak spanning a month boundary', () => {
    // Anchor on the 2nd of a month: yesterday is the 1st, day before is last
    // day of the previous month.
    const today = '2026-03-02';
    const result = computeStreaks(days('2026-02-28', '2026-03-01', '2026-03-02'), today);
    expect(result).toEqual({ current: 3, longest: 3, loggedToday: true });
  });

  it('current streak spanning a year boundary', () => {
    const today = '2026-01-02';
    const result = computeStreaks(days('2025-12-31', '2026-01-01', '2026-01-02'), today);
    expect(result).toEqual({ current: 3, longest: 3, loggedToday: true });
  });

  it('duplicate and unordered days are tolerated', () => {
    const messy = days(TODAY, TODAY, shiftISODate(TODAY, -1));
    messy.push({ date: TODAY, count: 5 });
    expect(computeStreaks(messy, TODAY)).toEqual({ current: 2, longest: 2, loggedToday: true });
  });

  it('zero-count and malformed dates are ignored', () => {
    const bad: LoggedDay[] = [
      { date: TODAY, count: 0 },
      { date: 'not-a-date', count: 3 },
      { date: '2026-7-2', count: 1 }, // unpadded
      { date: '', count: 1 },
    ];
    expect(computeStreaks(bad, TODAY)).toEqual({ current: 0, longest: 0, loggedToday: false });
  });

  it('longest run ignores a gap even inside one month', () => {
    const result = computeStreaks(
      days('2026-07-01', '2026-07-02', '2026-07-05', '2026-07-06', '2026-07-07'),
      '2026-07-31'
    );
    expect(result).toEqual({ current: 0, longest: 3, loggedToday: false });
  });
});

// --- cache -----------------------------------------------------------------

describe('streak cache', () => {
  it('round-trips a snapshot written today', async () => {
    await writeStreakCache({ current: 5, longest: 9, loggedToday: false });
    const cached = await readStreakCache();
    expect(cached).not.toBeNull();
    expect(cached).toMatchObject({ current: 5, longest: 9, loggedToday: false, date: TODAY });
    expect(typeof cached!.computedAt).toBe('number');
  });

  it('returns null when nothing is stored', async () => {
    expect(await readStreakCache()).toBeNull();
  });

  it('returns null for malformed JSON', async () => {
    mockStore.set(STREAK_CACHE_KEY, '{oops');
    expect(await readStreakCache()).toBeNull();
  });

  it('returns null for a snapshot computed on a different day (stale)', async () => {
    mockStore.set(
      STREAK_CACHE_KEY,
      JSON.stringify({
        current: 7,
        longest: 7,
        loggedToday: false,
        date: shiftISODate(TODAY, -1),
        computedAt: Date.now() - 12 * 60 * 60 * 1000,
      })
    );
    expect(await readStreakCache()).toBeNull();
  });

  it('write failure is swallowed (best-effort)', async () => {
    // Sabotage the store: setItem throws.
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    await expect(
      writeStreakCache({ current: 1, longest: 1, loggedToday: true })
    ).resolves.toBeUndefined();
  });
});
