import type { PnlReport, Transaction } from '../../types';
import { buildPnlCsv, buildTransactionsCsv } from '../exportFiles';

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  userId: 'u1',
  amount: 500,
  type: 'expense',
  category: 'food',
  description: 'Lunch',
  note: '',
  date: '2026-08-21',
  month: '2026-08',
  createdAt: '2026-08-21T10:00:00Z',
  ...overrides,
});

describe('buildTransactionsCsv', () => {
  it('uses accounting signs and escapes commas and quotes', () => {
    const csv = buildTransactionsCsv([
      transaction({ description: 'Cafe "Leela", Bengaluru', note: 'split, with "team"' }),
      transaction({ id: 't2', type: 'income', amount: 900, category: 'salary' }),
    ]);
    expect(csv).toContain(',-500,');
    expect(csv).toContain(',900,');
    expect(csv).toContain('"Cafe ""Leela"", Bengaluru"');
    expect(csv).toContain('"split, with ""team"""');
  });

  it('neutralizes spreadsheet formulas in user-controlled cells', () => {
    const csv = buildTransactionsCsv([
      transaction({
        category: '@custom' as Transaction['category'],
        description: '=HYPERLINK("bad")',
        note: '+1+1',
      }),
    ]);
    expect(csv).toContain('"\'@custom"');
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"\'+1+1"');
  });
});

const report: PnlReport = {
  months: [
    { month: '2026-07', income: 80000, expenses: 45000, net: 35000, savingsRate: 43.75 },
    { month: '2026-08', income: 82000, expenses: 50000, net: 32000, savingsRate: 39.02 },
  ],
  categories: { food: 20000, transport: 5000, housing: 25000 },
  incomeBreakdown: { salary: 150000, freelance: 12000 },
  totals: { income: 162000, expenses: 95000, net: 67000, avgSavingsRate: 41.36 },
  trends: { expenseChange: 11.1, incomeChange: 2.5 },
};

describe('buildPnlCsv', () => {
  it('renders monthly totals and sorted breakdowns', () => {
    const csv = buildPnlCsv(report);
    expect(csv).toContain('2026-07,80000,-45000,35000,43.75');
    expect(csv).toContain('Total,162000,-95000,67000,41.36');
    expect(csv.indexOf('"housing",-25000')).toBeLessThan(csv.indexOf('"food",-20000'));
    expect(csv).toContain('Income Source,Amount');
  });
});
