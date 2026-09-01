import { apiRequest } from './client';
import type { PnlReport } from '../types';

export const getPnlReport = (months = 6) =>
  apiRequest<PnlReport>(`/reports/pnl?months=${months}`);

export const getCategoryTrend = (category: string, months = 6) =>
  apiRequest<{
    category: string;
    data: { month: string; amount: number }[];
    total: number;
    average: number;
  }>(`/reports/category-trends?category=${category}&months=${months}`);

export interface DailyAnalytics {
  month: string;
  days: Record<string, number>;
  max: number;
  total: number;
}

export const getDailyAnalytics = (month: string) =>
  apiRequest<DailyAnalytics>(`/analytics/daily?month=${month}`);

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface PeriodicReport {
  period: ReportPeriod;
  label: string;
  start: string;
  end: string;
  totals: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
    transactionCount: number;
  };
  comparison: {
    expensesChange: number | null;
    incomeChange: number | null;
    previousExpenses: number;
    previousIncome: number;
  };
  categories: { name: string; amount: number; share: number }[];
  timeline: { date: string; label: string; income: number; expenses: number }[];
  highlight: string;
  goals: { id: string; name: string; current: number; target: number; progress: number }[];
}

export const getPeriodicReport = (period: ReportPeriod) =>
  apiRequest<PeriodicReport>(`/reports/periodic?period=${period}`);
