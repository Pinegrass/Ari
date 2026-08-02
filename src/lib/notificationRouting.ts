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
  | { kind: 'stack'; screen: 'BudgetPlanner' | 'SmartLedger' }
  | { kind: 'tab'; tab: 'Dashboard' };

/** Extract the discriminator from an arbitrary push data payload. */
export function notificationTypeOf(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const type = (data as { type?: unknown }).type;
  return typeof type === 'string' ? type : null;
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
    default:
      return null;
  }
}
