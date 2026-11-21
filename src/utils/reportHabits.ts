import type { PeriodicReport } from '../api/reports';

export type ReportHabit = 'start' | 'income' | 'category' | 'changes' | 'review';

/** Suggestions describe the recorded ledger and never infer unrecorded spending. */
export function reportHabits(report: PeriodicReport): { recordedDays: number; habits: ReportHabit[] } {
  const recordedDays = new Set(report.timeline
    .filter(day => day.income !== 0 || day.expenses !== 0)
    .map(day => day.date)).size;
  if (report.totals.transactionCount === 0) return { recordedDays, habits: ['start'] };

  const habits: ReportHabit[] = [];
  if (report.totals.income === 0 && report.totals.expenses > 0) habits.push('income');
  if (report.totals.transactionCount >= 3 && report.categories[0]?.share >= 30) habits.push('category');
  if (report.totals.transactionCount >= 3 && (report.comparison.transactionCount ?? 0) >= 3
      && report.comparison.previousExpenses > 0 && (report.comparison.expensesChange ?? 0) >= 10) {
    habits.push('changes');
  }
  habits.push('review');
  return { recordedDays, habits: habits.slice(0, 3) };
}
