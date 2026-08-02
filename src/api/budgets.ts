import { apiRequest } from './client';
import type { Budget, OverallBudget } from '../types';

export const getBudgets = (month?: string) =>
  apiRequest<Budget[]>(`/budgets${month ? `?month=${month}` : ''}`);

export const saveBudget = (data: {
  category: string;
  limit: number;
  month: string;
}) =>
  apiRequest<Budget>('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteBudget = (id: string) =>
  apiRequest<{ message: string }>(`/budgets/${id}`, { method: 'DELETE' });

export const getOverallBudget = (month?: string) =>
  apiRequest<OverallBudget>(`/budgets/overall${month ? `?month=${month}` : ''}`);

/** Set (or, with limit: null, clear) the overall monthly budget. */
export const saveOverallBudget = (data: { month: string; limit: number | null }) =>
  apiRequest<OverallBudget>('/budgets/overall', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
