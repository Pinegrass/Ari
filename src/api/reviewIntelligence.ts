import { apiRequest } from './client';

export interface ReviewEntry {
  id: string; date: string; amount: string; type: 'expense' | 'income'; category: string;
  description: string; note: string; updatedAt: string | null; isRecurring?: boolean;
  recurrenceRule?: 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'yearly';
}
export interface ReviewProvenance {
  revision: string;
  groups: Record<string, { start: string; end: string; entries: ReviewEntry[] }>;
}
export interface PlanningOutlook {
  status: string; payday: string | null;
  obligations: { amount: string; dueOn: string }[] | null;
  asOf?: string | null; expiresAt?: string | null;
  horizon?: { start: string; end: string; source: 'user_confirmed_inputs'; includesPredictions: false; bankBalanceProjectionAvailable: false } | null;
}
export interface RecurringCandidate {
  id: string; label: string; amount: string; currency: string; expectedOn: string;
  candidateType: 'payday' | 'recurring_expense'; sourceEntries: ReviewEntry[];
  confirmation: { body: { updatedAt: string | null; isRecurring: true; recurrenceRule: 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'yearly' } };
}
export const getRecurringCandidates = () => apiRequest<{ candidates: RecurringCandidate[]; status?: 'ready' | 'history_limit' }>('/reports/recurring-candidates?cadences=all');
export const confirmRecurringCandidate = (candidate: RecurringCandidate) => {
  const id = candidate.sourceEntries.at(-1)?.id;
  if (!id || !candidate.confirmation.body.updatedAt) return Promise.reject(new Error('Refresh required'));
  return apiRequest(`/transactions/${encodeURIComponent(id)}`, {
    method: 'PUT', body: JSON.stringify(candidate.confirmation.body),
  });
};

export interface HistoryBaseline {
  status: string; start: string; end: string; medianMonthlyRecordedSpending: string | null;
  categories: { category: string; recordedMonths: number; medianMonthlyRecorded: string | null }[];
  income: { status: string; recordedMonths: number; medianMonthlyRecorded: string | null };
}
