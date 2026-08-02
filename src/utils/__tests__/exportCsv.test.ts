import { buildPnlCsv, buildTransactionsCsv } from '../exportCsv';
import type { PnlReport, Transaction } from '../../types';

const txn = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  userId: 'u1',
  amount: 500,
  type: 'expense',
  category: 'food',
  description: 'Lunch',
  note: '',
  date: '2026-07-10',
  month: '2026-07',
  createdAt: '2026-07-10T10:00:00Z',
  ...overrides,
});

describe('buildTransactionsCsv', () => {
  it('renders a header plus one row per transaction', () => {
    const csv = buildTransactionsCsv([txn(), txn({ id: 't2', type: 'income', amount: 900, category: 'salary' })]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('Date,Type,Category,Description,Amount,Note');
  });

  it('signs amounts accounting-style: income positive, expense negative', () => {
    const csv = buildTransactionsCsv([
      txn({ amount: 250 }),
      txn({ id: 't2', type: 'income', amount: 1000 }),
    ]);
    const [, expenseRow, incomeRow] = csv.split('\n');
    expect(expenseRow).toContain(',-250,');
    expect(incomeRow).toContain(',1000,');
  });

  it('escapes quotes and preserves commas inside description and note', () => {
    const csv = buildTransactionsCsv([
      txn({ description: 'Cafe "Leela", Indiranagar', note: 'split, with "team"' }),
    ]);
    const row = csv.split('\n')[1];
    expect(row).toContain('"Cafe ""Leela"", Indiranagar"');
    expect(row).toContain('"split, with ""team"""');
  });

  it('handles an empty list with just the header', () => {
    expect(buildTransactionsCsv([])).toBe('Date,Type,Category,Description,Amount,Note');
  });
});

const report: PnlReport = {
  months: [
    { month: '2026-06', income: 80000, expenses: 45000, net: 35000, savingsRate: 43.75 },
    { month: '2026-07', income: 82000, expenses: 50000, net: 32000, savingsRate: 39.02 },
  ],
  categories: { food: 20000, transport: 5000, housing: 25000 },
  incomeBreakdown: { salary: 150000, freelance: 12000 },
  totals: { income: 162000, expenses: 95000, net: 67000, avgSavingsRate: 41.36 },
  trends: { expenseChange: 11.1, incomeChange: 2.5 },
};

describe('buildPnlCsv', () => {
  it('renders monthly rows, a totals row, and section headers', () => {
    const csv = buildPnlCsv(report);
    expect(csv).toContain('Month,Income,Expenses,Net,Savings Rate %');
    expect(csv).toContain('2026-06,80000,-45000,35000,43.75');
    expect(csv).toContain('Total,162000,-95000,67000,41.36');
    expect(csv).toContain('Expense Category,Amount');
    expect(csv).toContain('Income Source,Amount');
  });

  it('sorts category and income breakdowns by amount descending', () => {
    const lines = buildPnlCsv(report).split('\n');
    const categoryStart = lines.indexOf('Expense Category,Amount');
    expect(lines[categoryStart + 1]).toBe('"housing",-25000');
    expect(lines[categoryStart + 2]).toBe('"food",-20000');
    expect(lines[categoryStart + 3]).toBe('"transport",-5000');
    const incomeStart = lines.indexOf('Income Source,Amount');
    expect(lines[incomeStart + 1]).toBe('"salary",150000');
  });

  it('omits the income section when the breakdown is empty', () => {
    const csv = buildPnlCsv({ ...report, incomeBreakdown: {} });
    expect(csv).not.toContain('Income Source,Amount');
  });
});
