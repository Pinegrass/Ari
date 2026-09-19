import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { track } from '../lib/analytics';
import { useLanguage } from '../i18n/LanguageContext';
import { phrase } from '../i18n/phrases';
import { getNotificationCapabilities } from '../api/notificationPreferences';
import { requestSessionRevision, requestAccountId } from '../lib/requestSession';

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
// Legacy device-wide preferences remain untouched; they have no reliable owner.
const accountKey = (key: string) => `${key}:${requestAccountId() ?? 'unbound'}`;
let scheduling = Promise.resolve();
function serializeSchedule(action: () => Promise<void>): Promise<void> {
  const run = scheduling.catch(() => {}).then(action);
  scheduling = run.catch(() => {});
  return run;
}

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
  const key = accountKey(REMINDER_INDEX_KEY);
  const raw = await AsyncStorage.getItem(key);
  const idx = raw ? parseInt(raw, 10) : 0;
  const safeIdx = Number.isFinite(idx) && idx >= 0 ? idx : 0;
  const msg = REMINDER_MESSAGES[safeIdx % REMINDER_MESSAGES.length];
  await AsyncStorage.setItem(
    key,
    String((safeIdx + 1) % REMINDER_MESSAGES.length)
  );
  const language = await AsyncStorage.getItem('ari_language');
  return { title: phrase(language ?? 'en', msg.title), body: phrase(language ?? 'en', msg.body) };
}

/**
 * Cancel any prior reminder and (re)schedule the daily trigger at the given
 * time with the next message in rotation. Module-level so both the hook
 * (toggle / time change) and the app-foreground rotation path share it.
 * Cancels by id only — bill/EMI reminders are never collateral.
 */
async function cancelCheckIns(): Promise<void> {
  const results = await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(LEGACY_DAILY_REMINDER_ID),
    ...CHECKIN_IDS.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  ]);
  if (results.some(result => result.status === 'rejected')) throw new Error('Notification cancellation incomplete');
}

export function cancelTomoCheckins(): Promise<void> {
  return serializeSchedule(cancelCheckIns).catch(() => {});
}

async function scheduleReminderAt(hour: number, minute: number, revision = requestSessionRevision()): Promise<void> {
  return serializeSchedule(async () => {
  if (!requestAccountId() || revision !== requestSessionRevision()) return;
  await cancelCheckIns();
  try {
  // Fresh, authenticated ownership avoids scheduling a second generic channel.
  // On unknown service state retain the user's choice but do not schedule blindly.
  const capability = await getNotificationCapabilities();
  if (revision !== requestSessionRevision()) return;
  if (capability.genericCheckinOwner === 'server' && capability.dailyServiceEnabled === true) return;
  if (capability.genericCheckinOwner !== 'device' || capability.dailyServiceEnabled !== false) throw new Error('Unavailable notification ownership');
  if ((await Notifications.getPermissionsAsync()).status !== 'granted') throw new Error('Notification permission unavailable');

  for (let index = 0; index < CHECKIN_IDS.length; index += 1) {
    if (revision !== requestSessionRevision()) return;
    const msg = await nextReminderMessage();
    if (revision !== requestSessionRevision()) { await cancelCheckIns(); return; }
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
  if (revision !== requestSessionRevision()) await cancelCheckIns();
  } catch (error) {
    await cancelCheckIns().catch(() => {});
    throw error;
  }
  });
}

/**
 * Rotate the twice-weekly check-in copy. On every app foreground we cancel +
 * reschedule the two weekly reminders with the next messages. No-op when
 * reminders are off or permission was revoked. Best-effort by design — a
 * failure cancels known generic schedules where the native platform permits.
 */
export async function refreshTomoCheckins(): Promise<void> {
  const revision = requestSessionRevision();
  const enabledKey = accountKey(NOTIFICATIONS_ENABLED_KEY), timeKey = accountKey(REMINDER_TIME_KEY);
  const cancelIfCurrent = () => serializeSchedule(async () => {
    if (revision === requestSessionRevision()) await cancelCheckIns();
  }).catch(() => {});
  try {
    const enabled = await AsyncStorage.getItem(enabledKey);
    if (revision !== requestSessionRevision()) return;
    if (enabled !== 'true') { await cancelIfCurrent(); return; }
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') { await cancelIfCurrent(); return; }
    const { hour, minute } = parseReminderTime(await AsyncStorage.getItem(timeKey));
    await scheduleReminderAt(hour, minute, revision);
  } catch {
    await cancelIfCurrent();
  }
}

export function useNotifications() {
  const { language } = useLanguage();
  const mounted = useRef(false);
  const busy = useRef(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [reminderHour, setReminderHour] = useState(DEFAULT_HOUR);
  const [reminderMinute, setReminderMinute] = useState(DEFAULT_MINUTE);
  const current = useCallback((revision: number) => mounted.current && revision === requestSessionRevision() && !!requestAccountId(), []);
  const failure = useCallback((revision: number) => {
    if (current(revision)) Alert.alert(phrase(language, 'Notifications'), language === 'hi'
      ? 'सूचनाएँ अपडेट नहीं हो सकीं। डिवाइस की अनुमति जाँचें और फिर कोशिश करें।'
      : 'Notifications could not be updated. Check device permissions and try again.');
  }, [current, language]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    const revision = requestSessionRevision();
    const enabledKey = accountKey(NOTIFICATIONS_ENABLED_KEY), timeKey = accountKey(REMINDER_TIME_KEY);
    void (async () => {
      try {
        const [stored, rawTime, permission] = await Promise.all([
          AsyncStorage.getItem(enabledKey), AsyncStorage.getItem(timeKey), Notifications.getPermissionsAsync(),
        ]);
        if (!active || !current(revision)) return;
        const { hour, minute } = parseReminderTime(rawTime);
        setIsEnabled(stored === 'true'); setReminderHour(hour); setReminderMinute(minute);
        setPermissionGranted(permission.status === 'granted');
      } catch { if (active) failure(revision); }
    })();
    return () => { active = false; mounted.current = false; };
  }, [current, failure]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const revision = requestSessionRevision();
    if (!current(revision)) return false;
    try {
      if (!Device.isDevice) {
        Alert.alert(phrase(language, 'Notifications'), phrase(language, 'Push notifications only work on physical devices.'));
        return false;
      }
      let { status } = await Notifications.getPermissionsAsync();
      if (!current(revision)) return false;
      if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
      if (!current(revision)) return false;
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) Alert.alert(phrase(language, 'Permission Required'), phrase(language,
        'Please enable notifications in your device settings to receive reminders from Tomo.'));
      return granted;
    } catch { failure(revision); return false; }
  }, [current, failure, language]);

  const toggleNotifications = useCallback(async () => {
    const revision = requestSessionRevision(), key = accountKey(NOTIFICATIONS_ENABLED_KEY);
    if (!current(revision) || busy.current) return;
    busy.current = true;
    try {
      if (!isEnabled && !await requestPermission()) return;
      if (!current(revision)) return;
      await serializeSchedule(async () => {
        if (revision !== requestSessionRevision()) return;
        if (isEnabled) await cancelCheckIns();
      });
      if (!isEnabled) await scheduleReminderAt(reminderHour, reminderMinute, revision);
      if (!current(revision)) return;
      try { await AsyncStorage.setItem(key, isEnabled ? 'false' : 'true'); }
      catch (error) {
        await serializeSchedule(async () => { if (revision === requestSessionRevision()) await cancelCheckIns(); }).catch(() => {});
        throw error;
      }
      if (!current(revision)) return;
      setIsEnabled(!isEnabled);
      track(isEnabled ? 'nudge_checkins_disabled' : 'nudge_checkins_enabled', { cadence: 'twice_weekly' });
    } catch { failure(revision); }
    finally { busy.current = false; }
  }, [current, failure, isEnabled, reminderHour, reminderMinute, requestPermission]);

  const setReminderTime = useCallback(async (hour: number, minute: number) => {
    const revision = requestSessionRevision(), key = accountKey(REMINDER_TIME_KEY);
    if (!current(revision) || busy.current) return;
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) { failure(revision); return; }
    const safeHour = Math.min(23, Math.max(0, Math.floor(hour)));
    const safeMinute = Math.min(59, Math.max(0, Math.floor(minute)));
    busy.current = true;
    try {
      await AsyncStorage.setItem(key, formatReminderTime(safeHour, safeMinute));
      if (!current(revision)) return;
      setReminderHour(safeHour); setReminderMinute(safeMinute);
      if (isEnabled) await scheduleReminderAt(safeHour, safeMinute, revision);
    } catch { failure(revision); }
    finally { busy.current = false; }
  }, [current, failure, isEnabled]);

  const sendTestNotification = useCallback(async () => {
    const revision = requestSessionRevision();
    try {
      if (!await requestPermission() || !current(revision)) return;
      await serializeSchedule(async () => {
        if (!current(revision)) return;
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: phrase(language, 'Tomo says hi! 🤖'),
            body: phrase(language, 'Review your month, add an entry, or skip today—your choice.'),
            sound: 'default',
            data: { type: 'tomo_checkin', nudgeId: 'local_checkin:test', nudgeTrigger: 'test_checkin', experimentVariant: 'contextual_v1' },
          },
          trigger: null,
        });
        // Immediate OS delivery cannot be recalled; remove any still-pending request.
        if (!current(revision)) await Notifications.cancelScheduledNotificationAsync(identifier);
      });
    } catch { failure(revision); }
  }, [current, failure, language, requestPermission]);

  return { isEnabled, permissionGranted, reminderHour, reminderMinute,
    toggleNotifications, setReminderTime, sendTestNotification, requestPermission };
}
