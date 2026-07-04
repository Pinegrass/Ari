import {
  computeWidgetSnapshot,
  saveWidgetSnapshot,
  loadWidgetSnapshot,
} from '../widgetData';
import type { Transaction } from '../../types';

// Stateful AsyncStorage (the global mock always returns null) so the save/load
// roundtrip actually exercises persistence.
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: jest.fn(async (k: string) => {
        delete store[k];
      }),
    },
  };
});

const NOW = new Date('2026-07-05T12:00:00');

function txn(over: Partial<Transaction>): Transaction {
  return {
    id: over.id ?? 't',
    userId: 'u1',
    amount: over.amount ?? 100,
    type: over.type ?? 'expense',
    category: over.category ?? 'food',
    description: '',
    date: over.date ?? '2026-07-05',
    month: (over.date ?? '2026-07-05').slice(0, 7),
    createdAt: '2026-07-05T00:00:00Z',
    updatedAt: '2026-07-05T00:00:00Z',
    syncStatus: 'synced',
    ...over,
  } as Transaction;
}

describe('computeWidgetSnapshot', () => {
  it('sums today and month expenses, ignoring income and other days', () => {
    const snap = computeWidgetSnapshot(
      [
        txn({ amount: 200, date: '2026-07-05' }), // today
        txn({ amount: 300, date: '2026-07-05' }), // today
        txn({ amount: 500, date: '2026-07-01' }), // month, not today
        txn({ amount: 9999, date: '2026-06-30' }), // last month
        txn({ amount: 8000, type: 'income', date: '2026-07-05' }), // income ignored
      ],
      [],
      NOW,
    );
    expect(snap.spentToday).toBe(500);
    expect(snap.spentThisMonth).toBe(1000);
  });

  it('computes the budget fraction from the month budget', () => {
    const snap = computeWidgetSnapshot(
      [txn({ amount: 2500, date: '2026-07-02' })],
      [{ limit: 4000 }, { limit: 1000 }], // month budget 5000
      NOW,
    );
    expect(snap.monthBudget).toBe(5000);
    expect(snap.budgetFraction).toBeCloseTo(0.5);
    expect(snap.overBudget).toBe(false);
  });

  it('clamps the fraction to 1 and flags overBudget when spend exceeds budget', () => {
    const snap = computeWidgetSnapshot(
      [txn({ amount: 7000, date: '2026-07-02' })],
      [{ limit: 5000 }],
      NOW,
    );
    expect(snap.budgetFraction).toBe(1);
    expect(snap.overBudget).toBe(true);
  });

  it('yields a zero fraction (never divides by zero) when no budget is set', () => {
    const snap = computeWidgetSnapshot([txn({ amount: 500 })], [], NOW);
    expect(snap.monthBudget).toBe(0);
    expect(snap.budgetFraction).toBe(0);
    expect(snap.overBudget).toBe(false);
  });

  it('handles an empty ledger', () => {
    const snap = computeWidgetSnapshot([], [], NOW);
    expect(snap.spentToday).toBe(0);
    expect(snap.spentThisMonth).toBe(0);
  });
});

describe('save/load snapshot roundtrip', () => {
  it('persists and reads back a snapshot', async () => {
    const snap = computeWidgetSnapshot([txn({ amount: 42 })], [{ limit: 100 }], NOW);
    await saveWidgetSnapshot(snap);
    const back = await loadWidgetSnapshot();
    expect(back).toEqual(snap);
  });
});
