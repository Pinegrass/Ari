/**
 * bills — local storage + local-notification scheduling for bill/EMI reminders
 * (Sprint 3, D1). No backend, no cron: bills live in AsyncStorage on the device
 * and reminders are OS-scheduled local notifications (expo-notifications).
 *
 * Date math lives in ./billSchedule (pure, unit-tested). This module owns the
 * side effects: persistence, permission, scheduling, and the idempotent
 * launch-time reconcile that survives app restarts.
 *
 * Notification identifiers are namespaced `bill:<owner>:<id>:<occurrenceDate>:<kind>`
 * so we can cancel exactly one bill's reminders (by prefix) without disturbing
 * the daily "log your expenses" reminder or another bill's schedule.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import {
  upcomingReminders,
  nextMonthlyOccurrence,
  toISODate,
  calendarToday,
} from './billSchedule';

const BILLS_KEY = 'ari_bills';
const ID_PREFIX = 'bill:';
let accountId: string | null = null;
let accountBound = false;
let generation = 0;
const bindingListeners = new Set<(owner: string | null, verified?: boolean) => void>();
let mutations: Promise<unknown> = Promise.resolve();
const serialized = <T,>(operation: () => Promise<T>): Promise<T> => {
  const next = mutations.then(operation, operation);
  mutations = next.catch(() => {});
  return next;
};
const snapshot = () => ({ owner: accountId, generation });
const current = (context: ReturnType<typeof snapshot>) => context.owner !== null && context.owner === accountId && context.generation === generation;
const storageKey = (owner: string) => `${BILLS_KEY}:account:${encodeURIComponent(owner)}`;
const prefix = (owner: string, billId: string) => `${ID_PREFIX}${encodeURIComponent(owner)}:${encodeURIComponent(billId)}:`;
export const billTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export const isBillAccount = (owner: string) => accountId !== null && accountId === owner;
export const currentBillAccount = () => accountId;

/** Called only after backend account deletion has succeeded. */
export function eraseDeletedAccountBills(owner: string): Promise<void> {
  if (accountId === owner) { accountId = null; generation += 1; }
  return serialized(async () => {
    await cancelByPrefix(`${ID_PREFIX}${encodeURIComponent(owner)}:`);
    await AsyncStorage.removeItem(storageKey(owner));
  });
}

/** Initial provider restoration is not backend verification. Keep a matching
 * boot tap waiting, but discard taps for any other restored identity. */
export function observeInitialBillSession(owner: string): Promise<void> {
  if (accountId !== null && accountId !== owner) return setBillAccount(null);
  if (accountId === null) for (const listener of [...bindingListeners]) listener(owner, false);
  return Promise.resolve();
}

/** Synchronous session invalidation; preserve previous owners' stored bills.
 * Legacy ari_bills has no reliable owner and remains quarantined, untouched. */
export function setBillAccount(owner: string | null): Promise<void> {
  // Null also invalidates pending cold-start taps during logout before binding.
  if (owner === null) for (const listener of [...bindingListeners]) listener(null);
  if (accountBound && accountId === owner) return Promise.resolve();
  accountBound = true;
  accountId = owner;
  generation += 1;
  if (owner !== null) for (const listener of [...bindingListeners]) listener(owner);
  const context = snapshot();
  return serialized(async () => {
    await cancelByPrefix(ID_PREFIX);
    if (current(context)) await reconcileFor(context, new Date());
  });
}

export interface Bill {
  ownerId?: string;
  id: string;
  name: string;
  amount: number;
  category: string; // maps to an expense category for prefill
  dueDay: number; // 1-31
  repeatMonthly: boolean;
  oneTimeDate?: string; // 'YYYY-MM-DD' — one-time bills only
  createdAt: string;
}

/** Data payload attached to a bill notification, read by the tap handler. */
export interface BillNotificationData {
  type: 'bill_reminder';
  billId: string;
  ownerId: string;
}

// ─── Persistence ────────────────────────────────────────────────────────────

async function readBills(context: ReturnType<typeof snapshot>, strict = false): Promise<Bill[]> {
  if (!current(context)) return [];
  try {
    const raw = await AsyncStorage.getItem(storageKey(context.owner!));
    if (!current(context)) return [];
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some(bill => !bill || typeof bill !== 'object'
        || typeof bill.id !== 'string' || !bill.id || typeof bill.name !== 'string'
        || typeof bill.amount !== 'number' || !Number.isFinite(bill.amount))) {
      throw new Error('Invalid bill storage');
    }
    return (parsed as Bill[]).map(bill => ({ ...bill, ownerId: context.owner! }));
  } catch (error) {
    if (strict) throw error;
    return [];
  }
}

export const getBills = (strict = false) => readBills(snapshot(), strict);

/** Strict export: storage failure/corruption is not represented as empty data. */
export async function exportOwnedBills(): Promise<{ ownerId: string; bills: Bill[] }> {
  const context = snapshot();
  return serialized(async () => {
    if (!current(context)) throw new Error('Bill account unavailable');
    const raw = await AsyncStorage.getItem(storageKey(context.owner!));
    const bills: unknown = raw ? JSON.parse(raw) : [];
    if (!current(context) || !Array.isArray(bills)) throw new Error('Bill export unavailable');
    return { ownerId: context.owner!, bills: bills as Bill[] };
  });
}

/** Resolve only currently owned persisted data, never trust a notification's
 * amount/name or allow an old account's pending tap to prefill a new account. */
export async function resolveBillNotification(data: unknown): Promise<Bill | null> {
  const context = snapshot();
  if (!current(context) || !data || typeof data !== 'object') return null;
  const value = data as Partial<BillNotificationData>;
  if (value.type !== 'bill_reminder' || value.ownerId !== context.owner || typeof value.billId !== 'string') return null;
  const bills = await readBills(context);
  return current(context) ? bills.find(bill => bill.id === value.billId) ?? null : null;
}

/** Cold-start navigation may become ready before server identity validation.
 * Keep one caller-owned wait in memory, bounded to 30 seconds. Null binding
 * (logout), another verified owner, disposal or expiry drops it without replay. */
export async function resolveStartupBillNotification(data: BillNotificationData, active: () => boolean): Promise<Bill | null> {
  if (!active()) return null;
  if (accountId !== null) return resolveBillNotification(data);
  if (!data || typeof data.ownerId !== 'string' || typeof data.billId !== 'string') return null;
  const matched = await new Promise<boolean>(resolve => {
    const finish = (matches: boolean) => {
      clearTimeout(timer); bindingListeners.delete(listener); resolve(matches);
    };
    const listener = (owner: string | null, verified = true) => {
      if (active() && owner === data.ownerId && !verified) return;
      finish(active() && owner === data.ownerId);
    };
    const timer = setTimeout(() => finish(false), 30_000);
    bindingListeners.add(listener);
  });
  return matched && active() ? resolveBillNotification(data) : null;
}

async function writeBills(bills: Bill[], context: ReturnType<typeof snapshot>): Promise<void> {
  if (!current(context)) throw new Error('Bill account changed');
  await AsyncStorage.setItem(storageKey(context.owner!), JSON.stringify(bills));
  if (!current(context)) throw new Error('Bill account changed');
}

/** Create or update a bill (matched by id), then (re)schedule its reminders. */
export async function saveBill(bill: Bill): Promise<Bill> {
  const context = snapshot();
  return serialized(async () => {
  if (bill.ownerId && bill.ownerId !== context.owner) throw new Error('Bill account changed');
  const bills = await readBills(context, true);
  const idx = bills.findIndex((b) => b.id === bill.id);
  if (idx >= 0) bills[idx] = bill;
  else bills.push(bill);
  await writeBills(bills.map(row => ({ ...row, ownerId: context.owner! })), context);
  await scheduleFor(bill, new Date(), context);
  return bill;
  });
}

/** Delete a bill and cancel its scheduled reminders. */
export async function deleteBill(id: string): Promise<void> {
  const context = snapshot();
  return serialized(async () => {
    const bills = await readBills(context, true);
    await writeBills(bills.filter((b) => b.id !== id), context);
    await cancelByPrefix(prefix(context.owner!, id));
  });
}

// ─── Selectors (for the Dashboard card) ──────────────────────────────────────

export interface UpcomingBill extends Bill {
  /** Next due date as 'YYYY-MM-DD' in the device timezone. */
  nextDueDate: string;
  /** Whole local-calendar days until the next due date. 0 = due today. */
  daysUntil: number;
}

/**
 * Bills with a next occurrence within `withinDays` local calendar days,
 * sorted soonest-first. Drives the Dashboard "upcoming bills" card.
 */
export function selectUpcomingBills(
  bills: Bill[],
  now: Date,
  withinDays = 7
): UpcomingBill[] {
  const zone = billTimeZone();
  const today = calendarToday(now, zone);
  const todayMs = Date.UTC(today.year, today.month - 1, today.day);

  const out: UpcomingBill[] = [];
  for (const bill of bills) {
    let occ;
    if (bill.repeatMonthly) {
      occ = nextMonthlyOccurrence(bill.dueDay, now, zone);
    } else {
      if (!bill.oneTimeDate) continue;
      const [y, m, d] = bill.oneTimeDate.split('-').map(Number);
      occ = { year: y, month: m, day: d };
    }
    const occMs = Date.UTC(occ.year, occ.month - 1, occ.day);
    const daysUntil = Math.round((occMs - todayMs) / 86_400_000);
    if (daysUntil >= 0 && daysUntil <= withinDays) {
      out.push({ ...bill, nextDueDate: toISODate(occ), daysUntil });
    }
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}

// ─── Notification scheduling ─────────────────────────────────────────────────

/** Ask for notification permission if we don't have it. Returns granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

async function cancelByPrefix(prefix: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => typeof n.identifier === 'string' && n.identifier.startsWith(prefix))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    /* best-effort — a failed cancel just means a possible stale reminder */
  }
}

/** Cancel every scheduled reminder for one bill. */
export async function cancelBillReminders(billId: string): Promise<void> {
  const context = snapshot();
  if (context.owner) await serialized(() => cancelByPrefix(prefix(context.owner!, billId)));
}

/**
 * (Re)schedule a single bill's reminders idempotently: cancel its existing ones,
 * then schedule the upcoming day-before + day-of notifications. Silently no-ops
 * without permission (the reconcile/create flow requests it first).
 */
export async function scheduleBillReminders(bill: Bill, now: Date = new Date()): Promise<void> {
  const context = snapshot();
  return serialized(() => scheduleFor(bill, now, context));
}

async function scheduleFor(bill: Bill, now: Date, context: ReturnType<typeof snapshot>): Promise<void> {
  if (!current(context)) return;
  await cancelByPrefix(prefix(context.owner!, bill.id));
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted' || !current(context)) return;
  const hindi = await AsyncStorage.getItem('ari_language').catch(() => null) === 'hi';

  const reminders = upcomingReminders(
    { dueDay: bill.dueDay, repeatMonthly: bill.repeatMonthly, oneTimeDate: bill.oneTimeDate },
    now, undefined, undefined, billTimeZone()
  );
  if (reminders.length === 0) return;

  const data: BillNotificationData = {
    type: 'bill_reminder',
    billId: bill.id,
    ownerId: context.owner!,
  };

  for (const r of reminders) {
    if (!current(context)) return;
    const identifier = `${prefix(context.owner!, bill.id)}${r.occurrenceDate}:${r.kind}`;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: hindi ? 'एरी से बिल रिमाइंडर' : 'A bill reminder from Ari',
          body: hindi ? 'बिल देखने और भुगतान होने पर दर्ज करने के लिए एरी खोलें।' : 'Open Ari to review the bill and record a payment when made.',
          data: data as unknown as Record<string, unknown>,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: r.fireAt,
        },
      });
      if (!current(context)) await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      /* one failed schedule shouldn't abort the rest */
    }
  }
}

/**
 * Idempotent launch/foreground reconcile. Reschedules every bill's next
 * reminders and sweeps notifications belonging to bills that no longer exist.
 * Safe to call on every app start — this is what makes reminders survive
 * restarts (local notifications are re-derived from persisted bills).
 */
export async function reconcileBillReminders(now: Date = new Date()): Promise<void> {
  const context = snapshot();
  return serialized(() => reconcileFor(context, now));
}

async function reconcileFor(context: ReturnType<typeof snapshot>, now: Date): Promise<void> {
  if (!Device.isDevice) return;
  try {
    if (!current(context)) return;
    const bills = await readBills(context);
    if (!current(context)) return;
    const liveIds = new Set(bills.map((b) => b.id));

    // Sweep orphaned bill notifications (deleted bills, stale occurrences).
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => typeof n.identifier === 'string' && n.identifier.startsWith(ID_PREFIX))
        .filter((n) => {
          const data = n.content.data as Partial<BillNotificationData> | undefined;
          return data?.ownerId !== context.owner || !liveIds.has(data?.billId ?? '');
        })
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    // Reschedule each live bill (cancel-then-schedule keeps it idempotent).
    for (const bill of bills) {
      if (!current(context)) return;
      await scheduleFor(bill, now, context);
    }
  } catch {
    /* reconcile is best-effort; never block app boot */
  }
}
