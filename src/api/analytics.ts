import { apiRequest } from './client';

export interface DailyHeatmap {
  month: string;                    // "YYYY-MM"
  days: Record<string, number>;     // "YYYY-MM-DD" -> rupees spent
  max: number;
  total: number;
}

/** Daily spend for the requested month (default: current). Spec §6 "daily spend calendar data for heat map". */
export const getDailyHeatmap = (month?: string) =>
  apiRequest<DailyHeatmap>(`/analytics/daily${month ? `?month=${month}` : ''}`);

export interface StreakDays {
  days: { date: string; count: number }[]; // ascending "YYYY-MM-DD" logged days
}

/**
 * Full logged-day history (expense OR income days) for the streak engine in
 * src/lib/streaks.ts. Not month-scoped — /analytics/daily can't serve streaks
 * (expense-only, one month at a time).
 */
export const getStreakDays = () => apiRequest<StreakDays>('/analytics/streak-days');
