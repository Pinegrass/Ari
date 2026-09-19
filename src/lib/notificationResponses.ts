import * as Notifications from 'expo-notifications';

/** One active subscription; native startup failures never escape into app boot. */
export function subscribeNotificationResponses(
  handle: (response: Notifications.NotificationResponse, active: () => boolean) => void,
): () => void {
  let disposed = false;
  let subscription: { remove: () => void } | undefined;
  const active = () => !disposed;
  const receive = (response: Notifications.NotificationResponse | null) => {
    if (!disposed && response) handle(response, active);
  };
  try {
    void Notifications.getLastNotificationResponseAsync().then(receive).catch(() => {});
    subscription = Notifications.addNotificationResponseReceivedListener(receive);
  } catch { /* Unsupported native notification API: ordinary startup still works. */ }
  return () => {
    disposed = true;
    try { subscription?.remove(); } catch { /* Native teardown is best effort. */ }
  };
}
