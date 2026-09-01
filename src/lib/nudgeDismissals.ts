import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGACY_NUDGE_DISMISSAL_KEY = 'ari_nudge_dismissal_v1';
const NUDGE_DISMISSAL_PREFIX = 'ari_nudge_dismissals_v2:';
export const NUDGE_DISMISSAL_MS = 24 * 60 * 60 * 1000;
const MAX_STORED_DISMISSALS = 50;

type StoredNudgeDismissals = Record<string, number>;

export function nudgeDismissalStorageKey(userId: string): string {
  return `${NUDGE_DISMISSAL_PREFIX}${userId}`;
}

function activeDismissals(value: unknown, now: number): StoredNudgeDismissals {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, number] => (
        typeof entry[1] === 'number' &&
        Number.isFinite(entry[1]) &&
        now - entry[1] >= 0 &&
        now - entry[1] < NUDGE_DISMISSAL_MS
      ))
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_STORED_DISMISSALS),
  );
}

async function readDismissals(userId: string, now: number): Promise<StoredNudgeDismissals> {
  try {
    const raw = await AsyncStorage.getItem(nudgeDismissalStorageKey(userId));
    return activeDismissals(raw ? JSON.parse(raw) : null, now);
  } catch {
    return {};
  }
}

export async function isNudgeRecentlyDismissed(
  userId: string,
  nudgeId: string,
  now: number = Date.now(),
): Promise<boolean> {
  const dismissals = await readDismissals(userId, now);
  return typeof dismissals[nudgeId] === 'number';
}

export async function dismissNudgeForUser(
  userId: string,
  nudgeId: string,
  now: number = Date.now(),
): Promise<void> {
  const dismissals = await readDismissals(userId, now);
  dismissals[nudgeId] = now;
  const bounded = activeDismissals(dismissals, now);
  await AsyncStorage.setItem(
    nudgeDismissalStorageKey(userId),
    JSON.stringify(bounded),
  );
  // The v1 key was global and could suppress another account's nudge. Remove
  // it only after the account-scoped write succeeds.
  await AsyncStorage.removeItem(LEGACY_NUDGE_DISMISSAL_KEY).catch(() => {});
}
