/**
 * Push payload → route mapping (Phase 3 retention plumbing).
 *
 * Backend pushes carry a `data.type` discriminator (see backend/jobs/*.py):
 *   budget_alert      → BudgetPlanner (budgets surface; there is no Budget tab)
 *   weekly_brief      → Dashboard tab (CoachingBriefCard renders the brief)
 *   monthly_review    → Dashboard tab (same card)
 *   subscription_leak → SmartLedger (recurring view)
 *   bill_reminder     → NOT handled here — App.tsx opens fast entry prefilled
 *                       (see billDataFromResponse), which is more useful.
 *
 * Pure and navigation-free so it's unit-testable; App.tsx translates the
 * returned target into navigationRef calls.
 */

export type NotificationRouteTarget =
  | { kind: 'stack'; screen: 'BudgetPlanner' | 'SmartLedger' | 'PeriodicReports' }
  | { kind: 'tab'; tab: 'Dashboard' | 'Tomo' };

/** Extract the discriminator from an arbitrary push data payload. */
export function notificationTypeOf(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const type = (data as { type?: unknown }).type;
  return typeof type === 'string' ? type : null;
}

export type NudgeNotificationContext = {
  nudgeId: string;
  trigger: string;
  experimentVariant: string;
};

/** Read only the non-financial attribution fields from a push payload. */
export function nudgeContextOf(data: unknown): NudgeNotificationContext | null {
  if (!data || typeof data !== 'object') return null;
  const value = data as Record<string, unknown>;
  if (typeof value.nudgeId !== 'string') return null;
  return {
    nudgeId: value.nudgeId,
    trigger: typeof value.nudgeTrigger === 'string' ? value.nudgeTrigger : 'unknown',
    experimentVariant:
      typeof value.experimentVariant === 'string' ? value.experimentVariant : 'unknown',
  };
}

/**
 * Map a push data payload to its destination, or null when the payload
 * isn't ours / is handled elsewhere (bill_reminder) / is unknown — null
 * means "tap does nothing special" (OS just opens the app).
 */
export function routeForNotificationData(data: unknown): NotificationRouteTarget | null {
  switch (notificationTypeOf(data)) {
    case 'budget_alert':
      return { kind: 'stack', screen: 'BudgetPlanner' };
    case 'weekly_brief':
    case 'monthly_review':
      return { kind: 'tab', tab: 'Dashboard' };
    case 'subscription_leak':
      return { kind: 'stack', screen: 'SmartLedger' };
    case 'tomo_checkin':
      return { kind: 'tab', tab: 'Tomo' };
    case 'reactivation':
      return { kind: 'stack', screen: 'PeriodicReports' };
    default:
      return null;
  }
}
