/**
 * recurringCost tests (Phase 1 recurring management).
 *
 * Verifies the monthly-equivalent normalization (weekly ×4.33, biweekly ×2.17,
 * quarterly ÷3, yearly ÷12) and that the total only counts ACTIVE recurring
 * expense templates — paused templates, child instances, recurring income and
 * plain transactions are excluded.
 */
import { monthlyEquivalent, totalMonthlyRecurringCost } from '../recurringCost';
import type { Transaction } from '../../types';

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't-1',
    userId: 'user-1',
    amount: 1000,
    type: 'expense',
    category: 'housing',
    description: 'Rent',
    note: '',
    date: '2026-07-01',
    month: '2026-07',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('monthlyEquivalent', () => {
  it('normalizes every rule to a per-month cost', () => {
    expect(monthlyEquivalent(1000, 'monthly')).toBe(1000);
    expect(monthlyEquivalent(100, 'weekly')).toBeCloseTo(433, 2);
    expect(monthlyEquivalent(100, 'biweekly')).toBeCloseTo(217, 2);
    expect(monthlyEquivalent(900, 'quarterly')).toBeCloseTo(300, 2);
    expect(monthlyEquivalent(12000, 'yearly')).toBeCloseTo(1000, 2);
  });
});

describe('totalMonthlyRecurringCost', () => {
  it('sums active expense templates across rules', () => {
    const txns = [
      makeTxn({ id: 'a', isRecurring: true, recurrenceRule: 'monthly', amount: 1000 }),
      makeTxn({ id: 'b', isRecurring: true, recurrenceRule: 'weekly', amount: 100 }),
      makeTxn({ id: 'c', isRecurring: true, recurrenceRule: 'yearly', amount: 12000 }),
    ];
    // 1000 + 433 + 1000
    expect(totalMonthlyRecurringCost(txns)).toBeCloseTo(2433, 2);
  });

  it('excludes paused templates', () => {
    const txns = [
      makeTxn({ id: 'a', isRecurring: true, recurrenceRule: 'monthly', amount: 1000 }),
      makeTxn({
        id: 'b',
        isRecurring: true,
        recurrenceRule: 'monthly',
        amount: 500,
        isPaused: true,
      }),
    ];
    expect(totalMonthlyRecurringCost(txns)).toBe(1000);
  });

  it('excludes child instances and recurring income', () => {
    const txns = [
      makeTxn({ id: 'a', isRecurring: true, recurrenceRule: 'monthly', amount: 1000 }),
      // child instance of a — not a template
      makeTxn({ id: 'a-child', amount: 1000, parentRecurringId: 'a' }),
      // recurring salary is not a "payment"
      makeTxn({
        id: 's',
        type: 'income',
        category: 'salary',
        isRecurring: true,
        recurrenceRule: 'monthly',
        amount: 50000,
      }),
    ];
    expect(totalMonthlyRecurringCost(txns)).toBe(1000);
  });

  it('returns 0 when there are no templates', () => {
    expect(totalMonthlyRecurringCost([makeTxn({})])).toBe(0);
    expect(totalMonthlyRecurringCost([])).toBe(0);
  });
});
