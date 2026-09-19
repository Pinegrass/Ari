import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getNotificationCapabilities } from '../../api/notificationPreferences';
import { observeRequestAccount, resetRequestSession } from '../../lib/requestSession';
import { refreshTomoCheckins, cancelTomoCheckins, useNotifications } from '../useNotifications';

const mockStorage = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => { mockStorage.set(key, value); }),
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'scheduled'),
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('../../lib/analytics', () => ({ track: jest.fn() }));
jest.mock('../../api/notificationPreferences', () => ({ getNotificationCapabilities: jest.fn() }));

jest.mock('../../i18n/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));


beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {}); mockStorage.clear(); resetRequestSession(); observeRequestAccount('account-a');
  mockStorage.set('ari_notifications_enabled:account-a', 'true');
  jest.mocked(getNotificationCapabilities).mockResolvedValue({ dailyServiceEnabled: false, genericCheckinOwner: 'device' });
});

test('device owner schedules only own generic reminders and preserves bill identifiers', async () => {
  await refreshTomoCheckins();
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  const ids = jest.mocked(Notifications.cancelScheduledNotificationAsync).mock.calls.map(([id]) => id);
  expect(ids.every(id => id.startsWith('ari_tomo_checkin') || id === 'ari_daily_reminder')).toBe(true);
});

test.each(['server', 'unavailable'] as const)('does not schedule generic duplicates for %s capability', async mode => {
  if (mode === 'server') jest.mocked(getNotificationCapabilities).mockResolvedValue({ dailyServiceEnabled: true, genericCheckinOwner: 'server' });
  else jest.mocked(getNotificationCapabilities).mockRejectedValue(new Error('offline'));
  await refreshTomoCheckins();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(mockStorage.get('ari_notifications_enabled:account-a')).toBe('true');
});

test('unattributed legacy choice and another account do not enable reminders', async () => {
  mockStorage.set('ari_notifications_enabled', 'true');
  observeRequestAccount('account-b');
  await refreshTomoCheckins();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(mockStorage.get('ari_notifications_enabled')).toBe('true');
});

test('account change during capability request cannot schedule on the new account', async () => {
  let resolve!: (value: {dailyServiceEnabled: boolean; genericCheckinOwner: 'device'}) => void;
  const pending = new Promise<{dailyServiceEnabled: boolean; genericCheckinOwner: 'device'}>(done => { resolve = done; });
  jest.mocked(getNotificationCapabilities).mockReturnValue(pending);
  const work = refreshTomoCheckins();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  expect(getNotificationCapabilities).toHaveBeenCalled();
  resetRequestSession();
  const cancellation = cancelTomoCheckins();
  resolve({ dailyServiceEnabled: false, genericCheckinOwner: 'device' });
  await work; await cancellation;
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});


test('initial storage failure is handled and does not claim enabled', async () => {
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('storage'));
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  expect(result.current.isEnabled).toBe(false);
});

test('nonfinite time cannot reach storage or scheduler', async () => {
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  await act(async () => { await result.current.setReminderTime(NaN, Infinity); });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(result.current.reminderHour).toBe(20);
});

test('partial scheduling failure cancels both known ids and leaves preference off', async () => {
  mockStorage.clear();
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  jest.mocked(Notifications.scheduleNotificationAsync).mockResolvedValueOnce('first').mockRejectedValueOnce(new Error('native'));
  await act(async () => { await result.current.toggleNotifications(); });
  expect(result.current.isEnabled).toBe(false);
  expect(mockStorage.get('ari_notifications_enabled:account-a')).toBeUndefined();
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('ari_tomo_checkin_tue');
  expect(jest.mocked(Notifications.cancelScheduledNotificationAsync).mock.calls.length).toBeGreaterThanOrEqual(6);
  expect(Alert.alert).toHaveBeenCalled();
});

test('preference write failure rolls scheduled reminders back', async () => {
  mockStorage.clear();
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  jest.mocked(AsyncStorage.setItem).mockImplementationOnce(async () => {}).mockImplementationOnce(async () => {}).mockRejectedValueOnce(new Error('full'));
  await act(async () => { await result.current.toggleNotifications(); });
  expect(result.current.isEnabled).toBe(false);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  expect(jest.mocked(Notifications.cancelScheduledNotificationAsync).mock.calls.length).toBeGreaterThanOrEqual(6);
});

test('failed cancellation cannot claim disabled', async () => {
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.isEnabled).toBe(true));
  jest.mocked(Notifications.cancelScheduledNotificationAsync).mockRejectedValueOnce(new Error('native'));
  await act(async () => { await result.current.toggleNotifications(); });
  expect(result.current.isEnabled).toBe(true);
  expect(mockStorage.get('ari_notifications_enabled:account-a')).toBe('true');
  expect(Alert.alert).toHaveBeenCalled();
});

test('unknown capability cannot claim newly enabled', async () => {
  mockStorage.clear();
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  jest.mocked(getNotificationCapabilities).mockRejectedValueOnce(new Error('offline'));
  await act(async () => { await result.current.toggleNotifications(); });
  expect(result.current.isEnabled).toBe(false);
  expect(Alert.alert).toHaveBeenCalled();
});

test('test notification permission failure is handled', async () => {
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  jest.mocked(Notifications.getPermissionsAsync).mockRejectedValueOnce(new Error('native'));
  await act(async () => { await result.current.sendTestNotification(); });
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalled();
});

test('test notification drops after account changes during permission check', async () => {
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  jest.mocked(Notifications.getPermissionsAsync).mockImplementationOnce(async () => {
    observeRequestAccount('account-b'); return { status: 'granted' } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;
  });
  await act(async () => { await result.current.sendTestNotification(); });
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('late native test schedule is canceled after account changes', async () => {
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  jest.mocked(Notifications.scheduleNotificationAsync).mockImplementationOnce(async () => {
    observeRequestAccount('account-b'); return 'late-test';
  });
  await act(async () => { await result.current.sendTestNotification(); });
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('late-test');
});

test('initialization after unmount does not alert or update state', async () => {
  let reject!: (error: Error) => void;
  jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }));
  const { unmount } = renderHook(useNotifications);
  unmount();
  await act(async () => { reject(new Error('late')); });
  expect(Alert.alert).not.toHaveBeenCalled();
});


test('initialization for the previous account cannot populate the new account', async () => {
  let resolve!: (value: string) => void;
  jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const { result } = renderHook(useNotifications);
  observeRequestAccount('account-b');
  await act(async () => { resolve('true'); });
  expect(result.current.isEnabled).toBe(false);
  expect(result.current.permissionGranted).toBe(false);
});

test('time storage failure keeps the displayed persisted time', async () => {
  const { result } = renderHook(useNotifications);
  await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('storage'));
  await act(async () => { await result.current.setReminderTime(9, 30); });
  expect(result.current.reminderHour).toBe(20);
  expect(result.current.reminderMinute).toBe(0);
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalled();
});

test('stale housekeeping storage failure cannot cancel the replacement account schedules', async () => {
  let reject!: (error: Error) => void;
  jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }));
  const refresh = refreshTomoCheckins();
  observeRequestAccount('account-b');
  reject(new Error('late storage failure'));
  await refresh;
  expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
});
