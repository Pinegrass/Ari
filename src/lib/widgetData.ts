/**
 * widgetData — the pure data layer behind the Android home-screen widgets
 * (Sprint 4, D6). Computes the "Spent today" + budget-ring snapshot and mirrors
 * it to a small shared store that the widget task handler reads.
 *
 * Deliberately free of any native (`react-native-android-widget`) import so it
 * is unit-testable and safe to call on iOS / Expo Go. The native rendering +
 * `requestWidgetUpdate` live in `src/widgets/` and consume `loadWidgetSnapshot`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transaction } from '../types';

const WIDGET_KEY = 'ari_widget_snapshot';

export interface WidgetSnapshot {
  /** Total expense amount dated today (local). */
  spentToday: number;
  /** Total expense amount in the current month. */
  spentThisMonth: number;
  /** Sum of this month's category budget limits (0 if none set). */
  monthBudget: number;
  /** spentThisMonth / monthBudget, clamped to [0, 1]. 0 when no budget. */
  budgetFraction: number;
  /** True once the month's spend exceeds the budget. */
  overBudget: boolean;
  /** ISO timestamp the snapshot was computed. */
  updatedAt: string;
}

function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compute the widget snapshot from the local transactions + budgets. Pure.
 * Only expenses count; income is ignored. Dates are compared as YYYY-MM-DD
 * strings (local), matching how the rest of the app stores `date`.
 */
export function computeWidgetSnapshot(
  transactions: Transaction[],
  budgets: { limit: number }[],
  now: Date,
): WidgetSnapshot {
  const todayStr = toLocalDate(now);
  const monthStr = todayStr.slice(0, 7);

  let spentToday = 0;
  let spentThisMonth = 0;
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const date = typeof t.date === 'string' ? t.date : toLocalDate(t.date as unknown as Date);
    if (date.slice(0, 7) === monthStr) spentThisMonth += t.amount;
    if (date === todayStr) spentToday += t.amount;
  }

  const monthBudget = budgets.reduce((sum, b) => sum + (b.limit > 0 ? b.limit : 0), 0);
  const budgetFraction =
    monthBudget > 0 ? Math.min(spentThisMonth / monthBudget, 1) : 0;

  return {
    spentToday,
    spentThisMonth,
    monthBudget,
    budgetFraction,
    overBudget: monthBudget > 0 && spentThisMonth > monthBudget,
    updatedAt: now.toISOString(),
  };
}

/** Mirror the snapshot to the shared store the widget reads. Best-effort. */
export async function saveWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_KEY, JSON.stringify(snapshot));
  } catch {
    /* a failed widget mirror must never break a transaction write */
  }
}

/** Read the last snapshot, or null if none / unreadable. */
export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as WidgetSnapshot) : null;
  } catch {
    return null;
  }
}
