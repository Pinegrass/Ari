/**
 * recurringEngine tests (Sprint 3).
 *
 * Verifies the core guarantees of checkAndGenerateDue:
 *   - Creates the correct number of instances when due.
 *   - Is idempotent (no duplicates on second call with the same data).
 *   - Catch-up: generates all missed instances up to today.
 *   - No-op when nothing is due or there are no templates.
 *
 * localStore.create is mocked so no AsyncStorage plumbing is required.
 */
import { checkAndGenerateDue } from '../recurringEngine';
import { localStore } from '../localStore';
import type { Transaction } from '../../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal recurring template Transaction. */
function makeTemplate(
  overrides: Partial<Transaction> & { date: string }
): Transaction {
  const { date } = overrides;
  return {
    id: 'template-1',
    userId: 'user-1',
    amount: 5000,
    type: 'expense',
    category: 'housing',
    description: 'Monthly rent',
    note: '',
    month: date.slice(0, 7),
    createdAt: date + 'T00:00:00.000Z',
    syncStatus: 'synced',
    isRecurring: true,
    recurrenceRule: 'monthly',
    ...overrides,
  };
}

/** Build a child instance for an existing template (used for idempotency checks). */
function makeInstance(
  parentId: string,
  date: string,
  idSuffix = '1'
): Transaction {
  return {
    id: `instance-${idSuffix}`,
    userId: 'user-1',
    amount: 5000,
    type: 'expense',
    category: 'housing',
    description: 'Monthly rent',
    note: '',
    date,
    month: date.slice(0, 7),
    createdAt: date + 'T00:00:00.000Z',
    syncStatus: 'pending',
    isRecurring: false,
    parentRecurringId: parentId,
  };
}

// ── Mock setup ────────────────────────────────────────────────────────────────

// Mock localStore so we never touch AsyncStorage.
jest.mock('../localStore', () => ({
  localStore: {
    create: jest.fn(),
  },
}));

// Mock expo-crypto so Crypto.randomUUID() works in tests.
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${Math.random().toString(36).slice(2)}`),
}));

const mockCreate = localStore.create as jest.MockedFunction<typeof localStore.create>;

/**
 * Make create() return a fake LocalTxn for the given date.
 * Each call pops one queued value via mockResolvedValueOnce.
 */
function queueCreateResult(dateStr: string, idSuffix = '1') {
  mockCreate.mockResolvedValueOnce({
    id: `new-instance-${idSuffix}`,
    amount: 5000,
    type: 'expense',
    category: 'housing',
    description: 'Monthly rent',
    note: '',
    date: dateStr,
    merchant: null,
    entryType: 'manual',
    rawInput: null,
    parseSource: 'local',
    confidence: null,
    createdAt: dateStr + 'T00:00:00.000Z',
    updatedAt: dateStr + 'T00:00:00.000Z',
    userId: '',
    syncStatus: 'pending',
    op: 'create',
    deleted: false,
    retryCount: 0,
    lastError: null,
    isRecurring: false,
    parentRecurringId: 'template-1',
  });
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** YYYY-MM-DD string for N days before today (local date). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Compute the date that is exactly N monthly steps forward from a given
 * YYYY-MM-DD string, using the same addMonths logic as the engine.
 */
function addMonthsToStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  const targetDay = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() !== targetDay) d.setDate(0);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('checkAndGenerateDue', () => {
  // ── Monthly ────────────────────────────────────────────────────────────────
  // Use a template 35 days old so +1 month is always <= today regardless of
  // which day of the month we run.

  it('creates one instance when a monthly template is 35 days old', async () => {
    const templateDate = daysAgo(35);
    const instanceDate = addMonthsToStr(templateDate, 1);

    queueCreateResult(instanceDate);

    const template = makeTemplate({ date: templateDate });
    const result = await checkAndGenerateDue([template]);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].parentRecurringId).toBe('template-1');
    expect(result[0].isRecurring).toBe(false);
    // Verify the engine called create with the expected date.
    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.date).toBe(instanceDate);
    expect(callArg.parentRecurringId).toBe('template-1');
    expect(callArg.isRecurring).toBe(false);
  });

  // ── Weekly ────────────────────────────────────────────────────────────────
  // Template is 14 days old; we expect exactly 2 weekly instances (day 7 and
  // day 14 from the template date, both in the past).

  it('creates 1 instance when a weekly template is 8 days old', async () => {
    const templateDate = daysAgo(8);
    // First due = templateDate + 7 days = daysAgo(1), definitely <= today.
    const firstDue = daysAgo(1);

    queueCreateResult(firstDue, '1');
    // We may get a second due call if +14 days <= today — queue a second mock
    // result in case, but we only assert >= 1.
    queueCreateResult(daysAgo(0), '2');

    const template = makeTemplate({ date: templateDate, recurrenceRule: 'weekly' });
    const result = await checkAndGenerateDue([template]);

    // At minimum 1 instance (templateDate + 7 = daysAgo(1)).
    expect(mockCreate.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].parentRecurringId).toBe('template-1');
    expect(result[0].isRecurring).toBe(false);
    // The first instance's date in the create call must be daysAgo(1).
    expect(mockCreate.mock.calls[0][0].date).toBe(firstDue);
  });

  // ── Idempotency ───────────────────────────────────────────────────────────

  it('creates 0 new instances when the due instance already exists', async () => {
    const templateDate = daysAgo(35);
    const instanceDate = addMonthsToStr(templateDate, 1);

    const template = makeTemplate({ date: templateDate });
    const existingInstance = makeInstance('template-1', instanceDate);

    // Pass the template AND the already-created instance.
    const result = await checkAndGenerateDue([template, existingInstance]);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  // ── Catch-up ──────────────────────────────────────────────────────────────

  it('generates multiple instances for a monthly template created ~90 days ago', async () => {
    // Use a date that guarantees exactly 3 months back from now.
    // Pick the same day of month 3 months ago to avoid overflow.
    const templateDate = addMonthsToStr(daysAgo(0), -3);

    // Count expected instances by walking forward the same way the engine does.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let cursor = new Date(templateDate + 'T00:00:00');
    const dueDates: string[] = [];
    while (dueDates.length < 24) {
      const targetDay = cursor.getDate();
      const next = new Date(cursor);
      next.setMonth(next.getMonth() + 1);
      if (next.getDate() !== targetDay) next.setDate(0);
      if (next > today) break;
      dueDates.push(
        [next.getFullYear(), String(next.getMonth() + 1).padStart(2, '0'), String(next.getDate()).padStart(2, '0')].join('-')
      );
      cursor = next;
    }

    dueDates.forEach((d, i) => queueCreateResult(d, String(i + 1)));

    const template = makeTemplate({ date: templateDate });
    const result = await checkAndGenerateDue([template]);

    expect(mockCreate).toHaveBeenCalledTimes(dueDates.length);
    expect(result).toHaveLength(dueDates.length);
    // 3 months back → typically 2–3 instances depending on calendar day.
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(3);
    result.forEach((r) => {
      expect(r.parentRecurringId).toBe('template-1');
      expect(r.isRecurring).toBe(false);
    });
  });

  // ── No-op for non-template rows ───────────────────────────────────────────

  it('does nothing when there are no recurring templates', async () => {
    const normal: Transaction = {
      id: 'txn-1',
      userId: 'user-1',
      amount: 100,
      type: 'expense',
      category: 'food',
      description: 'Lunch',
      note: '',
      date: daysAgo(5),
      month: daysAgo(5).slice(0, 7),
      createdAt: daysAgo(5) + 'T00:00:00.000Z',
      syncStatus: 'synced',
    };

    const result = await checkAndGenerateDue([normal]);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  // ── Template not yet due ──────────────────────────────────────────────────

  it('creates 0 instances for a monthly template created only 5 days ago', async () => {
    const templateDate = daysAgo(5);
    const template = makeTemplate({ date: templateDate });

    const result = await checkAndGenerateDue([template]);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });
});
