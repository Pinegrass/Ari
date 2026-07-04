import { projectUpcomingRecurring } from '../recurringEngine';
import { selectUpcomingCharges } from '../upcomingCharges';
import type { Transaction } from '../../types';
import type { Bill } from '../bills';

const NOW = new Date('2026-07-04T12:00:00+05:30');

function txn(over: Partial<Transaction>): Transaction {
  return {
    id: over.id ?? 't1',
    userId: 'u1',
    amount: over.amount ?? 1000,
    type: over.type ?? 'expense',
    category: over.category ?? 'housing',
    description: over.description ?? '',
    date: over.date ?? '2026-06-01',
    month: (over.date ?? '2026-06-01').slice(0, 7),
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    syncStatus: 'synced',
    isRecurring: over.isRecurring ?? true,
    parentRecurringId: over.parentRecurringId ?? null,
    recurrenceRule: over.recurrenceRule ?? 'monthly',
    ...over,
  } as Transaction;
}

function bill(over: Partial<Bill>): Bill {
  return {
    id: over.id ?? 'b1',
    name: over.name ?? 'Rent',
    amount: over.amount ?? 15000,
    category: over.category ?? 'housing',
    dueDay: over.dueDay ?? 5,
    repeatMonthly: over.repeatMonthly ?? true,
    oneTimeDate: over.oneTimeDate,
    createdAt: '2026-06-01T00:00:00Z',
  };
}

describe('projectUpcomingRecurring', () => {
  it('projects the next future occurrence of a monthly template', () => {
    // Template started 2026-06-15 monthly → next after 07-04 is 07-15.
    const out = projectUpcomingRecurring(
      [txn({ id: 'r1', description: 'Netflix', amount: 499, date: '2026-06-15', recurrenceRule: 'monthly' })],
      NOW,
      30,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      templateId: 'r1',
      name: 'Netflix',
      amount: 499,
      nextDueDate: '2026-07-15',
      daysUntil: 11,
    });
  });

  it('excludes occurrences beyond the window', () => {
    // Next occurrence 07-15 is 11 days out — a 7-day window excludes it.
    const out = projectUpcomingRecurring(
      [txn({ id: 'r1', date: '2026-06-15', recurrenceRule: 'monthly' })],
      NOW,
      7,
    );
    expect(out).toHaveLength(0);
  });

  it('ignores non-templates (generated child instances)', () => {
    const out = projectUpcomingRecurring(
      [txn({ id: 'c1', isRecurring: false, parentRecurringId: 'r1', date: '2026-07-10' })],
      NOW,
      30,
    );
    expect(out).toHaveLength(0);
  });

  it('handles a future-dated template (its start date is the first occurrence)', () => {
    const out = projectUpcomingRecurring(
      [txn({ id: 'r1', date: '2026-07-20', recurrenceRule: 'monthly' })],
      NOW,
      30,
    );
    expect(out[0].nextDueDate).toBe('2026-07-20');
    expect(out[0].daysUntil).toBe(16);
  });

  it('projects weekly templates to the next single occurrence', () => {
    const out = projectUpcomingRecurring(
      [txn({ id: 'r1', date: '2026-07-01', recurrenceRule: 'weekly' })],
      NOW,
      30,
    );
    // 07-01 + weeks → first after 07-04 is 07-08.
    expect(out[0].nextDueDate).toBe('2026-07-08');
  });
});

describe('selectUpcomingCharges', () => {
  it('merges bills and recurring projections, soonest first', () => {
    const bills = [bill({ id: 'b1', name: 'Rent', amount: 15000, dueDay: 5 })]; // due 07-05, 1 day
    const txns = [txn({ id: 'r1', description: 'Netflix', amount: 499, date: '2026-06-15' })]; // 07-15
    const out = selectUpcomingCharges(bills, txns, NOW, 30);
    expect(out.map((c) => c.source)).toEqual(['bill', 'recurring']);
    expect(out[0].name).toBe('Rent');
    expect(out[1].name).toBe('Netflix');
  });

  it('excludes recurring INCOME (this is a charges list)', () => {
    const txns = [
      txn({ id: 'r1', description: 'Salary', amount: 80000, type: 'income', date: '2026-06-01' }),
    ];
    const out = selectUpcomingCharges([], txns, NOW, 30);
    expect(out).toHaveLength(0);
  });

  it('de-dupes a recurring template that matches a bill (same name+amount+date)', () => {
    const bills = [bill({ id: 'b1', name: 'Rent', amount: 15000, dueDay: 15 })]; // due 07-15
    const txns = [
      txn({ id: 'r1', description: 'Rent', amount: 15000, date: '2026-06-15' }), // also 07-15
    ];
    const out = selectUpcomingCharges(bills, txns, NOW, 30);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('bill');
  });
});
