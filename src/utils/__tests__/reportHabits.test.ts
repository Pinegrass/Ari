import type { PeriodicReport } from '../../api/reports';
import { reportHabits } from '../reportHabits';

const report = {
  totals: { transactionCount: 5, income: 0, expenses: 100 },
  comparison: { transactionCount: 5, previousExpenses: 80, expensesChange: 25 },
  categories: [{ name: 'food', amount: 60, share: 60 }],
  timeline: [
    { date: '2026-11-18', income: 0, expenses: 40 },
    { date: '2026-11-19', income: 0, expenses: 60 },
    { date: '2026-11-20', income: 0, expenses: 0 },
  ],
} as PeriodicReport;

it('uses days with recorded activity without treating blank days as no-spend days', () => {
  expect(reportHabits(report)).toEqual({ recordedDays: 2, habits: ['income', 'category', 'changes'] });
});

it('gives an empty ledger a first-entry action without inventing trends', () => {
  const empty = { ...report, totals: { ...report.totals, transactionCount: 0 }, timeline: [] };
  expect(reportHabits(empty)).toEqual({ recordedDays: 0, habits: ['start'] });
});

it.each([undefined, 0, 1, 2])('avoids a trend suggestion with %s previous entries', transactionCount => {
  const sparse = { ...report, comparison: { ...report.comparison, transactionCount } };
  expect(reportHabits(sparse).habits).not.toContain('changes');
});

it('keeps income-only reports useful without inventing a spending category', () => {
  const incomeOnly = { ...report, totals: { ...report.totals, income: 500, expenses: 0, transactionCount: 1 },
    categories: [], timeline: [{ date: '2026-11-20', label: 'Fri', income: 500, expenses: 0 }] };
  expect(reportHabits(incomeOnly)).toEqual({ recordedDays: 1, habits: ['review'] });
});
