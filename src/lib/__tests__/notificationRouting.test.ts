import {
  routeForNotificationData,
  notificationTypeOf,
} from '../notificationRouting';

describe('routeForNotificationData', () => {
  it('routes budget_alert to BudgetPlanner', () => {
    expect(
      routeForNotificationData({
        type: 'budget_alert',
        category: 'food',
        threshold: 80,
        spent: 4200,
        limit: 5000,
      })
    ).toEqual({ kind: 'stack', screen: 'BudgetPlanner' });
  });

  it('routes weekly_brief to the Dashboard tab (brief card lives there)', () => {
    expect(routeForNotificationData({ type: 'weekly_brief', briefId: 'abc' })).toEqual({
      kind: 'tab',
      tab: 'Dashboard',
    });
  });

  it('routes monthly_review to the Dashboard tab', () => {
    expect(routeForNotificationData({ type: 'monthly_review', briefId: 'abc' })).toEqual({
      kind: 'tab',
      tab: 'Dashboard',
    });
  });

  it('routes subscription_leak to SmartLedger', () => {
    expect(
      routeForNotificationData({ type: 'subscription_leak', merchantId: 'netflix', monthlyAmount: 649 })
    ).toEqual({ kind: 'stack', screen: 'SmartLedger' });
  });

  it('returns null for bill_reminder (handled by the prefill path in App.tsx)', () => {
    expect(
      routeForNotificationData({ type: 'bill_reminder', amount: 999, name: 'Rent', category: 'housing' })
    ).toBeNull();
  });

  it('returns null for unknown types and malformed payloads', () => {
    expect(routeForNotificationData({ type: 'something_else' })).toBeNull();
    expect(routeForNotificationData({})).toBeNull();
    expect(routeForNotificationData(null)).toBeNull();
    expect(routeForNotificationData(undefined)).toBeNull();
    expect(routeForNotificationData('budget_alert')).toBeNull();
    expect(routeForNotificationData({ type: 42 })).toBeNull();
  });
});

describe('notificationTypeOf', () => {
  it('extracts the type discriminator', () => {
    expect(notificationTypeOf({ type: 'weekly_brief' })).toBe('weekly_brief');
    expect(notificationTypeOf({})).toBeNull();
    expect(notificationTypeOf(null)).toBeNull();
  });
});
