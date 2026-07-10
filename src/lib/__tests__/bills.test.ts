/**
 * Tests for the bill storage + local-notification scheduling layer. Stateful
 * in-memory mocks for AsyncStorage and expo-notifications let us assert the real
 * behaviours that matter: round-trip persistence, upsert (no dupes), idempotent
 * (re)scheduling, orphan sweeping on reconcile, and the Dashboard selector.
 */

// In-memory AsyncStorage (jest.mock factory vars must be `mock`-prefixed).
import {
  getBills,
  saveBill,
  deleteBill,
  selectUpcomingBills,
  scheduleBillReminders,
  reconcileBillReminders,
  ensureNotificationPermission,
  type Bill,
} from '../bills';

const mockStore = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((k: string) => Promise.resolve(mockStore.has(k) ? mockStore.get(k) : null)),
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

// In-memory scheduled-notification list (mutated in place so refs stay valid).
const mockScheduled: { identifier: string; content: unknown; trigger: unknown }[] = [];
jest.mock('expo-notifications', () => ({
  __esModule: true,
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([...mockScheduled])),
  scheduleNotificationAsync: jest.fn((req: any) => {
    mockScheduled.push({ identifier: req.identifier, content: req.content, trigger: req.trigger });
    return Promise.resolve(req.identifier);
  }),
  cancelScheduledNotificationAsync: jest.fn((id: string) => {
    const i = mockScheduled.findIndex((n) => n.identifier === id);
    if (i >= 0) mockScheduled.splice(i, 1);
    return Promise.resolve();
  }),
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
}));

jest.mock('expo-device', () => ({ isDevice: true }));

const NOW = new Date('2026-07-10T06:00:00Z'); // 11:30 IST, 10 Jul 2026

function makeBill(over: Partial<Bill> = {}): Bill {
  return {
    id: 'b1',
    name: 'Rent',
    amount: 15000,
    category: 'housing',
    dueDay: 15,
    repeatMonthly: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...over,
  };
}

beforeEach(() => {
  mockStore.clear();
  mockScheduled.length = 0;
});

describe('persistence', () => {
  it('getBills returns [] when nothing is stored', async () => {
    expect(await getBills()).toEqual([]);
  });

  it('saveBill persists and getBills round-trips it', async () => {
    await saveBill(makeBill());
    const bills = await getBills();
    expect(bills).toHaveLength(1);
    expect(bills[0].name).toBe('Rent');
  });

  it('saveBill upserts by id (no duplicate)', async () => {
    await saveBill(makeBill({ amount: 15000 }));
    await saveBill(makeBill({ amount: 18000 })); // same id
    const bills = await getBills();
    expect(bills).toHaveLength(1);
    expect(bills[0].amount).toBe(18000);
  });

  it('deleteBill removes the bill and cancels its reminders', async () => {
    await scheduleBillReminders(makeBill(), NOW); // schedule first
    await saveBill(makeBill()); // persist (also schedules)
    expect(mockScheduled.length).toBeGreaterThan(0);
    await deleteBill('b1');
    expect(await getBills()).toEqual([]);
    expect(mockScheduled.filter((n) => n.identifier.startsWith('bill:b1:'))).toEqual([]);
  });
});

describe('scheduleBillReminders', () => {
  it('schedules day-before + day-of for a monthly bill', async () => {
    await scheduleBillReminders(makeBill(), NOW);
    const ids = mockScheduled.map((n) => n.identifier);
    expect(ids).toContain('bill:b1:2026-07-15:day_before');
    expect(ids).toContain('bill:b1:2026-07-15:day_of');
    expect(mockScheduled).toHaveLength(2);
  });

  it('is idempotent — rescheduling cancels the old set first (no dupes)', async () => {
    await scheduleBillReminders(makeBill(), NOW);
    await scheduleBillReminders(makeBill(), NOW);
    expect(mockScheduled).toHaveLength(2);
  });

  it('attaches the bill payload for the tap deep-link', async () => {
    await scheduleBillReminders(makeBill(), NOW);
    const data = (mockScheduled[0].content as any).data;
    expect(data).toMatchObject({ type: 'bill_reminder', billId: 'b1', amount: 15000, category: 'housing' });
  });
});

describe('reconcileBillReminders', () => {
  it('reschedules every stored bill', async () => {
    mockStore.set('ari_bills', JSON.stringify([makeBill(), makeBill({ id: 'b2', name: 'EMI', dueDay: 20 })]));
    await reconcileBillReminders(NOW);
    expect(mockScheduled.filter((n) => n.identifier.startsWith('bill:b1:'))).toHaveLength(2);
    expect(mockScheduled.filter((n) => n.identifier.startsWith('bill:b2:'))).toHaveLength(2);
  });

  it('sweeps orphaned notifications for bills that no longer exist', async () => {
    // A stale notification for a deleted bill, with no matching stored bill.
    mockScheduled.push({ identifier: 'bill:ghost:2026-07-15:day_of', content: {}, trigger: {} });
    await reconcileBillReminders(NOW);
    expect(mockScheduled.find((n) => n.identifier.startsWith('bill:ghost:'))).toBeUndefined();
  });
});

describe('selectUpcomingBills', () => {
  it('includes a monthly bill due within the window, with daysUntil', () => {
    const up = selectUpcomingBills([makeBill({ dueDay: 15 })], NOW, 7); // 10 Jul → 15 Jul = 5 days
    expect(up).toHaveLength(1);
    expect(up[0].nextDueDate).toBe('2026-07-15');
    expect(up[0].daysUntil).toBe(5);
  });

  it('excludes a bill whose next occurrence is beyond the window', () => {
    const up = selectUpcomingBills([makeBill({ dueDay: 28 })], NOW, 7); // 18 days away
    expect(up).toHaveLength(0);
  });

  it('sorts soonest-first', () => {
    const bills = [
      makeBill({ id: 'far', dueDay: 16 }),
      makeBill({ id: 'near', dueDay: 12 }),
    ];
    const up = selectUpcomingBills(bills, NOW, 7);
    expect(up.map((b) => b.id)).toEqual(['near', 'far']);
  });

  it('handles a one-time bill by its explicit date', () => {
    const oneTime = makeBill({ id: 'ot', repeatMonthly: false, oneTimeDate: '2026-07-13' });
    const up = selectUpcomingBills([oneTime], NOW, 7);
    expect(up).toHaveLength(1);
    expect(up[0].daysUntil).toBe(3);
  });

  it('skips a one-time bill with no date', () => {
    const oneTime = makeBill({ id: 'ot', repeatMonthly: false });
    expect(selectUpcomingBills([oneTime], NOW, 7)).toEqual([]);
  });
});

describe('ensureNotificationPermission', () => {
  it('returns true when permission is granted', async () => {
    expect(await ensureNotificationPermission()).toBe(true);
  });
});
