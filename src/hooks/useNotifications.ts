import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { readStreakCache, STREAK_REMINDER_MIN } from '../lib/streaks';

const NOTIFICATIONS_ENABLED_KEY = 'ari_notifications_enabled';
const REMINDER_TIME_KEY = 'ari_reminder_time'; // stored as "HH:MM" e.g. "20:00"
const REMINDER_INDEX_KEY = 'ari_daily_reminder_msg_index'; // rotation cursor
const DEFAULT_HOUR = 20; // 8 PM — same default as before to preserve UX for existing users
const DEFAULT_MINUTE = 0;
// Stable identifier for the daily "log your expenses" reminder. We cancel by
// this id rather than cancelAllScheduledNotificationsAsync() so bill/EMI
// reminders (src/lib/bills.ts, namespaced "bill:...") are never collateral.
const DAILY_REMINDER_ID = 'ari_daily_reminder';

// Daily reminder copy bank. A DAILY trigger repeats its content verbatim
// forever, so instead of picking once at schedule time we rotate: each
// (re)schedule consumes the next message and persists the cursor.
const REMINDER_MESSAGES = [
  { title: "Hey! Did you log today's expenses? 📊", body: "Tomo is waiting to help you track your spending." },
  { title: "Don't forget to log your spending! 💰", body: "Quick entry takes just 5 seconds." },
  { title: "How's your budget looking? 🎯", body: "Check in with Tomo to stay on track." },
  { title: "Your money diary needs an update! 📝", body: "Log today's expenses to keep your streak." },
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
  // Streak-save variant (Phase 4): when a streak of >= STREAK_REMINDER_MIN
  // days is active and today isn't logged yet, nudge to save the streak
  // instead of rotating. The cursor is left untouched so the normal rotation
  // resumes exactly where it was once the streak is safe. Missing or stale
  // cache (readStreakCache returns null) falls back to the normal rotation.
  const streak = await readStreakCache();
  if (streak && !streak.loggedToday && streak.current >= STREAK_REMINDER_MIN) {
    return {
      title: `Your ${streak.current}-day streak is on the line! 🔥`,
      body: "Log today's expenses to keep it alive — takes 5 seconds.",
    };
  }

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
async function scheduleReminderAt(hour: number, minute: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});

  const msg = await nextReminderMessage();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: msg.title,
      body: msg.body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Rotate the daily reminder copy. expo-notifications' DAILY trigger repeats
 * the same title/body forever, so on every app foreground we cancel +
 * reschedule the reminder with the next message in the rotation. No-op when
 * reminders are off or permission was revoked. Best-effort by design — a
 * failure just means the previous message repeats once more.
 */
export async function rotateDailyReminderMessage(): Promise<void> {
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
  const scheduleDailyReminder = useCallback(
    async (hour: number = reminderHour, minute: number = reminderMinute) => {
      await scheduleReminderAt(hour, minute);
    },
    [reminderHour, reminderMinute]
  );

  const toggleNotifications = useCallback(async () => {
    if (!isEnabled) {
      const granted = await requestPermission();
      if (granted) {
        await scheduleDailyReminder();
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
        setIsEnabled(true);
      }
    } else {
      // Turn off only the daily reminder — bill reminders stay scheduled.
      await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      setIsEnabled(false);
    }
  }, [isEnabled, requestPermission, scheduleDailyReminder]);

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
        await scheduleDailyReminder(safeHour, safeMinute);
      }
    },
    [isEnabled, permissionGranted, scheduleDailyReminder]
  );

  const sendTestNotification = useCallback(async () => {
    if (!permissionGranted) {
      await requestPermission();
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tomo says hi! 🤖',
        body: "Great job staying on top of your finances! Keep it up.",
        sound: 'default',
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
