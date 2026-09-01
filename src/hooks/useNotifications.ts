import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { track } from '../lib/analytics';

const NOTIFICATIONS_ENABLED_KEY = 'ari_notifications_enabled';
const REMINDER_TIME_KEY = 'ari_reminder_time'; // stored as "HH:MM" e.g. "20:00"
const REMINDER_INDEX_KEY = 'ari_checkin_msg_index'; // rotation cursor
const DEFAULT_HOUR = 20; // 8 PM — same default as before to preserve UX for existing users
const DEFAULT_MINUTE = 0;
// Cancel the legacy daily identifier during migration. We still cancel only
// known Ari check-in ids so bill/EMI reminders are never collateral.
const LEGACY_DAILY_REMINDER_ID = 'ari_daily_reminder';
const CHECKIN_IDS = ['ari_tomo_checkin_tue', 'ari_tomo_checkin_fri'] as const;
const CHECKIN_WEEKDAYS = [3, 6] as const; // Expo: Sunday=1, Tuesday=3, Friday=6

// Check-in copy bank. Each foreground reschedule rotates the two messages.
const REMINDER_MESSAGES = [
  { title: 'A quick money check-in? 🌿', body: 'Add anything that changed, or skip today if there is nothing to log.' },
  { title: 'Want a two-minute review? 🧭', body: 'Tomo can show what changed and offer one optional next step.' },
  { title: 'Your plan is ready when you are', body: 'Review your month, add an entry, or choose Not now.' },
  { title: 'A calm check-in from Tomo', body: 'See what is on track and what—if anything—needs attention.' },
] as const;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Parse "HH:MM" -> { hour, minute }. Returns defaults if input is invalid;
 * we never want a malformed AsyncStorage value to brick the reminder flow.
 */
function parseReminderTime(raw: string | null): { hour: number; minute: number } {
  if (!raw) return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  const m = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  const hour = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const minute = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { hour, minute };
}

function formatReminderTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Next message in the rotation; advances the persisted cursor. */
async function nextReminderMessage(): Promise<{ title: string; body: string }> {
  const raw = await AsyncStorage.getItem(REMINDER_INDEX_KEY);
  const idx = raw ? parseInt(raw, 10) : 0;
  const safeIdx = Number.isFinite(idx) && idx >= 0 ? idx : 0;
  const msg = REMINDER_MESSAGES[safeIdx % REMINDER_MESSAGES.length];
  await AsyncStorage.setItem(
    REMINDER_INDEX_KEY,
    String((safeIdx + 1) % REMINDER_MESSAGES.length)
  );
  return msg;
}

/**
 * Cancel any prior reminder and (re)schedule the daily trigger at the given
 * time with the next message in rotation. Module-level so both the hook
 * (toggle / time change) and the app-foreground rotation path share it.
 * Cancels by id only — bill/EMI reminders are never collateral.
 */
async function cancelCheckIns(): Promise<void> {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(LEGACY_DAILY_REMINDER_ID).catch(() => {}),
    ...CHECKIN_IDS.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  ]);
}

async function scheduleReminderAt(hour: number, minute: number): Promise<void> {
  await cancelCheckIns();

  for (let index = 0; index < CHECKIN_IDS.length; index += 1) {
    const msg = await nextReminderMessage();
    const weekday = CHECKIN_WEEKDAYS[index];
    await Notifications.scheduleNotificationAsync({
      identifier: CHECKIN_IDS[index],
      content: {
        title: msg.title,
        body: msg.body,
        sound: 'default',
        data: {
          type: 'tomo_checkin',
          nudgeId: `local_checkin:${weekday}`,
          nudgeTrigger: 'scheduled_checkin',
          experimentVariant: 'contextual_v1',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
      },
    });
  }
}

/**
 * Rotate the twice-weekly check-in copy. On every app foreground we cancel +
 * reschedule the two weekly reminders with the next messages. No-op when
 * reminders are off or permission was revoked. Best-effort by design — a
 * failure just means the previous message repeats once more.
 */
export async function refreshTomoCheckins(): Promise<void> {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (enabled !== 'true') return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    const { hour, minute } = parseReminderTime(await AsyncStorage.getItem(REMINDER_TIME_KEY));
    await scheduleReminderAt(hour, minute);
  } catch {
    // never let reminder housekeeping break app startup
  }
}

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [reminderHour, setReminderHour] = useState(DEFAULT_HOUR);
  const [reminderMinute, setReminderMinute] = useState(DEFAULT_MINUTE);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      setIsEnabled(stored === 'true');

      const rawTime = await AsyncStorage.getItem(REMINDER_TIME_KEY);
      const { hour, minute } = parseReminderTime(rawTime);
      setReminderHour(hour);
      setReminderMinute(minute);

      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert('Notifications', 'Push notifications only work on physical devices.');
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      setPermissionGranted(true);
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);

    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive reminders from Tomo.'
      );
    }

    return granted;
  }, []);

  /**
   * Cancel any prior reminder and (re)schedule for the given hour/minute.
   * Each (re)schedule consumes the next message in the rotation, so toggling,
   * changing the time, and foreground rotation all advance the copy.
   */
  const scheduleCheckIns = useCallback(
    async (hour: number = reminderHour, minute: number = reminderMinute) => {
      await scheduleReminderAt(hour, minute);
    },
    [reminderHour, reminderMinute]
  );

  const toggleNotifications = useCallback(async () => {
    if (!isEnabled) {
      const granted = await requestPermission();
      if (granted) {
        await scheduleCheckIns();
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
        setIsEnabled(true);
        track('nudge_checkins_enabled', { cadence: 'twice_weekly' });
      }
    } else {
      // Turn off only Tomo check-ins — bill reminders stay scheduled.
      await cancelCheckIns();
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      setIsEnabled(false);
      track('nudge_checkins_disabled', { cadence: 'twice_weekly' });
    }
  }, [isEnabled, requestPermission, scheduleCheckIns]);

  /**
   * Persist a new reminder time and re-schedule if reminders are on.
   * If reminders are currently off we still persist the choice so toggling
   * them on later uses the user's preferred time.
   */
  const setReminderTime = useCallback(
    async (hour: number, minute: number) => {
      const safeHour = Math.min(23, Math.max(0, Math.floor(hour)));
      const safeMinute = Math.min(59, Math.max(0, Math.floor(minute)));
      setReminderHour(safeHour);
      setReminderMinute(safeMinute);
      await AsyncStorage.setItem(REMINDER_TIME_KEY, formatReminderTime(safeHour, safeMinute));
      if (isEnabled && permissionGranted) {
        await scheduleCheckIns(safeHour, safeMinute);
      }
    },
    [isEnabled, permissionGranted, scheduleCheckIns]
  );

  const sendTestNotification = useCallback(async () => {
    const granted = permissionGranted || await requestPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tomo says hi! 🤖',
        body: 'Review your month, add an entry, or skip today—your choice.',
        sound: 'default',
        data: {
          type: 'tomo_checkin',
          nudgeId: 'local_checkin:test',
          nudgeTrigger: 'test_checkin',
          experimentVariant: 'contextual_v1',
        },
      },
      trigger: null, // Send immediately
    });
  }, [permissionGranted, requestPermission]);

  return {
    isEnabled,
    permissionGranted,
    reminderHour,
    reminderMinute,
    toggleNotifications,
    setReminderTime,
    sendTestNotification,
    requestPermission,
  };
}
