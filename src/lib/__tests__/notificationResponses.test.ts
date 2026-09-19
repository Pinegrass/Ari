import * as Notifications from 'expo-notifications';
import { subscribeNotificationResponses } from '../notificationResponses';
jest.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));
const response = {} as Notifications.NotificationResponse;
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValue(null);
  jest.mocked(Notifications.addNotificationResponseReceivedListener).mockReturnValue({remove: jest.fn()});
});
test('native startup rejection is contained and the warm listener remains available', async () => {
  jest.mocked(Notifications.getLastNotificationResponseAsync).mockRejectedValue(new Error('native unavailable'));
  const handle = jest.fn(), stop = subscribeNotificationResponses(handle);
  await flush();
  const listener = jest.mocked(Notifications.addNotificationResponseReceivedListener).mock.calls[0][0];
  listener(response);
  expect(handle).toHaveBeenCalledTimes(1);
  stop();
});
test('late initial response and queued warm callbacks are ignored after disposal', async () => {
  let resolve!: (value: Notifications.NotificationResponse) => void;
  jest.mocked(Notifications.getLastNotificationResponseAsync).mockReturnValue(new Promise(done => {resolve = done;}));
  const handle = jest.fn(), stop = subscribeNotificationResponses(handle);
  const listener = jest.mocked(Notifications.addNotificationResponseReceivedListener).mock.calls[0][0];
  stop(); resolve(response); listener(response); await flush();
  expect(handle).not.toHaveBeenCalled();
});
test('work awaiting a bill lookup can check disposal before navigating', () => {
  const handle = jest.fn(), stop = subscribeNotificationResponses(handle);
  jest.mocked(Notifications.addNotificationResponseReceivedListener).mock.calls[0][0](response);
  const active = handle.mock.calls[0][1] as () => boolean;
  expect(active()).toBe(true); stop(); expect(active()).toBe(false);
});
test('synchronous native startup or teardown failures do not escape', () => {
  jest.mocked(Notifications.getLastNotificationResponseAsync).mockImplementationOnce(() => { throw new Error('unsupported'); });
  expect(subscribeNotificationResponses(jest.fn())).not.toThrow();
  jest.mocked(Notifications.addNotificationResponseReceivedListener).mockReturnValueOnce({remove: () => {throw new Error('teardown');}});
  expect(subscribeNotificationResponses(jest.fn())).not.toThrow();
});
