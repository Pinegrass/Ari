/**
 * Tests for the bill storage + local-notification scheduling layer. Stateful
 * in-memory mocks for AsyncStorage and expo-notifications let us assert the real
 * behaviours that matter: round-trip persistence, upsert (no dupes), idempotent
 * (re)scheduling, orphan sweeping on reconcile, and the Dashboard selector.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
// In-memory AsyncStorage (jest.mock factory vars must be `mock`-prefixed).
import {
  getBills,
  saveBill,
  deleteBill,
  selectUpcomingBills,
  scheduleBillReminders,
  reconcileBillReminders,
  ensureNotificationPermission,
  setBillAccount,
  observeInitialBillSession,
  resolveBillNotification,
  resolveStartupBillNotification,
  eraseDeletedAccountBills,
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

beforeEach(async () => {
  await setBillAccount(null);
  mockStore.clear();
  mockScheduled.length = 0;
  await setBillAccount('account-a');
});

it('uses a Hindi preview without bill names or amounts', async () => {
  mockStore.set('ari_language', 'hi');
  await scheduleBillReminders(makeBill({name:'Private merchant',amount:12345}), NOW);
  expect(mockScheduled.length).toBeGreaterThan(0);
  const content = mockScheduled[0].content as {title:string;body:string};
  expect(content.title).toContain('एरी');
  expect(content.title + content.body).not.toMatch(/Private merchant|12345/);
});

describe('persistence', () => {
  it.each(['[null]', '[12]', '[{"id":"bad","name":"Rent","amount":"broken"}]'])('preserves malformed bill records during mutations: %s', async raw => {
    const key = 'ari_bills:account:account-a';
    mockStore.set(key, raw);
    await expect(saveBill(makeBill())).rejects.toThrow('Invalid bill storage');
    await expect(deleteBill('bad')).rejects.toThrow('Invalid bill storage');
    expect(mockStore.get(key)).toBe(raw);
  });
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
    expect(ids).toContain('bill:account-a:b1:2026-07-15:day_before');
    expect(ids).toContain('bill:account-a:b1:2026-07-15:day_of');
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
    expect(data).toEqual({ type: 'bill_reminder', billId: 'b1', ownerId: 'account-a' });
  });
});

describe('reconcileBillReminders', () => {
  it('reschedules every stored bill', async () => {
    mockStore.set('ari_bills:account:account-a', JSON.stringify([makeBill(), makeBill({ id: 'b2', name: 'EMI', dueDay: 20 })]));
    await reconcileBillReminders(NOW);
    expect(mockScheduled.filter((n) => n.identifier.startsWith('bill:account-a:b1:'))).toHaveLength(2);
    expect(mockScheduled.filter((n) => n.identifier.startsWith('bill:account-a:b2:'))).toHaveLength(2);
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

it('quarantines unowned legacy data and never adopts it for the next account', async () => {
  const legacy = JSON.stringify([makeBill({ name: 'Legacy private bill' })]);
  mockStore.set('ari_bills', legacy);
  mockScheduled.push({ identifier: 'bill:b1:old', content: {}, trigger: {} });
  await setBillAccount('account-b');
  expect(await getBills()).toEqual([]);
  expect(mockStore.get('ari_bills')).toBe(legacy);
  expect(mockScheduled).toEqual([]);
});

it('preserves account-owned bills across logout without exposing them or trusting stale tap amounts', async () => {
  await saveBill(makeBill());
  expect(await resolveBillNotification({ type: 'bill_reminder', billId: 'b1', ownerId: 'account-a', amount: 1 })).toMatchObject({ amount: 15000 });
  await setBillAccount(null);
  expect(await getBills()).toEqual([]);
  await setBillAccount('account-b');
  expect(await getBills()).toEqual([]);
  expect(await resolveBillNotification({ type: 'bill_reminder', billId: 'b1', ownerId: 'account-a' })).toBeNull();
  expect(await resolveBillNotification({ type: 'bill_reminder', billId: 'b1', amount: 15000 })).toBeNull();
  await setBillAccount('account-a');
  expect(await getBills()).toHaveLength(1);
});

it('rejects a save that was awaiting storage when the account changed', async () => {
  let release!: (value: string | null) => void;
  let reading!: () => void;
  const started = new Promise<void>(resolve => { reading = resolve; });
  jest.mocked(AsyncStorage.getItem).mockImplementationOnce(() => { reading(); return new Promise(resolve => { release = resolve; }); });
  const save = saveBill(makeBill());
  const rejected = expect(save).rejects.toThrow('Bill account changed');
  await started;
  const transition = setBillAccount('account-b');
  release(null);
  await rejected;
  await transition;
  expect(await getBills()).toEqual([]);
  expect(mockStore.has('ari_bills:account:account-b')).toBe(false);
  expect(mockScheduled).toEqual([]);
});

it('cancels a stale schedule finishing after account switch and retains unrelated reminders', async () => {
  let release!: () => void;
  let scheduling!: () => void;
  const started = new Promise<void>(resolve => { scheduling = resolve; });
  jest.mocked(Notifications.scheduleNotificationAsync).mockImplementationOnce(req => {
    scheduling();
    return new Promise(resolve => { release = () => { mockScheduled.push(req as never); resolve(req.identifier!); }; });
  });
  mockScheduled.push({ identifier: 'unrelated', content: {}, trigger: {} });
  const schedule = scheduleBillReminders(makeBill(), NOW);
  await started;
  const transition = setBillAccount('account-b');
  release();
  await schedule;
  await transition;
  expect(mockScheduled.map(row => row.identifier)).toEqual(['unrelated']);
});

it('drops a notification lookup that finishes after switching account', async () => {
  let release!: (value: string | null) => void;
  jest.mocked(AsyncStorage.getItem).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const lookup = resolveBillNotification({ type: 'bill_reminder', billId: 'b1', ownerId: 'account-a' });
  const transition = setBillAccount('account-b');
  release(JSON.stringify([makeBill()]));
  expect(await lookup).toBeNull();
  await transition;
});

it('does not schedule when permission is revoked', async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({ status: 'denied' } as never);
  await scheduleBillReminders(makeBill(), NOW);
  expect(mockScheduled).toEqual([]);
});

it('erases only confirmed deleted owner data while preserving another account and legacy quarantine', async () => {
  await saveBill(makeBill());
  mockStore.set('ari_bills', 'unattributed legacy');
  await setBillAccount('account-b');
  await saveBill(makeBill({ name: 'B bill' }));
  await eraseDeletedAccountBills('account-a');
  expect(mockStore.has('ari_bills:account:account-a')).toBe(false);
  expect(await getBills()).toEqual([expect.objectContaining({ name: 'B bill', ownerId: 'account-b' })]);
  expect(mockStore.get('ari_bills')).toBe('unattributed legacy');
});


test.each(['{broken', '{"unexpected":true}'])('mutations preserve corrupt owned storage: %s', async raw => {
  const key = 'ari_bills:account:account-a';
  mockStore.set(key, raw);
  await expect(saveBill(makeBill())).rejects.toThrow();
  await expect(deleteBill('rent')).rejects.toThrow();
  await expect(getBills(true)).rejects.toThrow();
  expect(mockStore.get(key)).toBe(raw);
});

test('mutation storage read errors cannot replace saved bills', async () => {
  const key = 'ari_bills:account:account-a', raw = JSON.stringify([makeBill()]);
  mockStore.set(key, raw);
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('unavailable'));
  await expect(saveBill(makeBill({id: 'new'}))).rejects.toThrow('unavailable');
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('unavailable'));
  await expect(deleteBill('rent')).rejects.toThrow('unavailable');
  expect(mockStore.get(key)).toBe(raw);
});


test('cold-start tap waits for verified matching account binding', async () => {
  await saveBill(makeBill());
  await setBillAccount(null);
  const lookup = resolveStartupBillNotification({type: 'bill_reminder', ownerId: 'account-a', billId: 'b1'}, () => true);
  await setBillAccount('account-a');
  expect(await lookup).toMatchObject({id: 'b1', ownerId: 'account-a'});
});

test.each(['logout', 'switch', 'disposed'] as const)('cold-start pending tap is dropped on %s', async mode => {
  await saveBill(makeBill());
  await setBillAccount(null);
  let active = true;
  const lookup = resolveStartupBillNotification({type: 'bill_reminder', ownerId: 'account-a', billId: 'b1'}, () => active);
  if (mode === 'disposed') active = false;
  await setBillAccount(mode === 'logout' ? null : mode === 'switch' ? 'account-b' : 'account-a');
  expect(await lookup).toBeNull();
  await setBillAccount('account-a');
});

test('cold-start pending tap expires without persisting a later replay', async () => {
  await setBillAccount(null);
  jest.useFakeTimers();
  try {
    const lookup = resolveStartupBillNotification({type: 'bill_reminder', ownerId: 'account-a', billId: 'b1'}, () => true);
    jest.advanceTimersByTime(30_000);
    expect(await lookup).toBeNull();
  } finally { jest.useRealTimers(); }
});


test('matching INITIAL_SESSION preserves tap until backend verification', async () => {
  await saveBill(makeBill()); await setBillAccount(null);
  let settled = false;
  const lookup = resolveStartupBillNotification({type:'bill_reminder',ownerId:'account-a',billId:'b1'},()=>true).then(value=>{settled=true;return value;});
  await observeInitialBillSession('account-a');
  expect(settled).toBe(false);
  expect(await getBills()).toEqual([]);
  await setBillAccount('account-a');
  expect(await lookup).toMatchObject({id:'b1'});
});

test('different INITIAL_SESSION discards tap even if previous owner later logs in', async () => {
  await saveBill(makeBill()); await setBillAccount(null);
  const lookup = resolveStartupBillNotification({type:'bill_reminder',ownerId:'account-a',billId:'b1'},()=>true);
  await observeInitialBillSession('account-b');
  expect(await lookup).toBeNull();
  await setBillAccount('account-a');
});
