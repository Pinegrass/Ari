/**
 * bills — local storage + local-notification scheduling for bill/EMI reminders
 * (Sprint 3, D1). No backend, no cron: bills live in AsyncStorage on the device
 * and reminders are OS-scheduled local notifications (expo-notifications).
 *
 * Date math lives in ./billSchedule (pure, unit-tested). This module owns the
 * side effects: persistence, permission, scheduling, and the idempotent
 * launch-time reconcile that survives app restarts.
 *
 * Notification identifiers are namespaced `bill:<id>:<occurrenceDate>:<kind>`
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
  istToday,
  type BillReminder,
} from './billSchedule';

const BILLS_KEY = 'ari_bills';
const ID_PREFIX = 'bill:';

export interface Bill {
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
  name: string;
  amount: number;
  category: string;
}

// ─── Persistence ────────────────────────────────────────────────────────────

export async function getBills(): Promise<Bill[]> {
  try {
    const raw = await AsyncStorage.getItem(BILLS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Bill[]) : [];
  } catch {
    return [];
  }
}

async function writeBills(bills: Bill[]): Promise<void> {
  await AsyncStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

/** Create or update a bill (matched by id), then (re)schedule its reminders. */
export async function saveBill(bill: Bill): Promise<Bill> {
  const bills = await getBills();
  const idx = bills.findIndex((b) => b.id === bill.id);
  if (idx >= 0) bills[idx] = bill;
  else bills.push(bill);
  await writeBills(bills);
  await scheduleBillReminders(bill);
  return bill;
}

/** Delete a bill and cancel its scheduled reminders. */
export async function deleteBill(id: string): Promise<void> {
  const bills = await getBills();
  await writeBills(bills.filter((b) => b.id !== id));
  await cancelBillReminders(id);
}

// ─── Selectors (for the Dashboard card) ──────────────────────────────────────

export interface UpcomingBill extends Bill {
  /** Next due date as 'YYYY-MM-DD' (IST). */
  nextDueDate: string;
  /** Whole days from today (IST) until the next due date. 0 = due today. */
  daysUntil: number;
}

/**
 * Bills with a next occurrence within `withinDays` days from today (IST),
 * sorted soonest-first. Drives the Dashboard "upcoming bills" card.
 */
export function selectUpcomingBills(
  bills: Bill[],
  now: Date,
  withinDays = 7
): UpcomingBill[] {
  const today = istToday(now);
  const todayMs = Date.UTC(today.year, today.month - 1, today.day);

  const out: UpcomingBill[] = [];
  for (const bill of bills) {
    let occ;
    if (bill.repeatMonthly) {
      occ = nextMonthlyOccurrence(bill.dueDay, now);
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

function reminderTitle(bill: Bill, r: BillReminder): string {
  return r.kind === 'day_of'
    ? `${bill.name} is due today`
    : `${bill.name} is due tomorrow`;
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
  await cancelByPrefix(`${ID_PREFIX}${billId}:`);
}

/**
 * (Re)schedule a single bill's reminders idempotently: cancel its existing ones,
 * then schedule the upcoming day-before + day-of notifications. Silently no-ops
 * without permission (the reconcile/create flow requests it first).
 */
export async function scheduleBillReminders(bill: Bill, now: Date = new Date()): Promise<void> {
  await cancelBillReminders(bill.id);

  const reminders = upcomingReminders(
    { dueDay: bill.dueDay, repeatMonthly: bill.repeatMonthly, oneTimeDate: bill.oneTimeDate },
    now
  );
  if (reminders.length === 0) return;

  const data: BillNotificationData = {
    type: 'bill_reminder',
    billId: bill.id,
    name: bill.name,
    amount: bill.amount,
    category: bill.category,
  };

  for (const r of reminders) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${bill.id}:${r.occurrenceDate}:${r.kind}`,
        content: {
          title: reminderTitle(bill, r),
          body: `₹${bill.amount.toLocaleString('en-IN')} — tap to log it`,
          data: data as unknown as Record<string, unknown>,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: r.fireAt,
        },
      });
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
  if (!Device.isDevice) return;
  try {
    const bills = await getBills();
    const liveIds = new Set(bills.map((b) => b.id));

    // Sweep orphaned bill notifications (deleted bills, stale occurrences).
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => typeof n.identifier === 'string' && n.identifier.startsWith(ID_PREFIX))
        .filter((n) => {
          const billId = n.identifier.slice(ID_PREFIX.length).split(':')[0];
          return !liveIds.has(billId);
        })
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    // Reschedule each live bill (cancel-then-schedule keeps it idempotent).
    for (const bill of bills) {
      await scheduleBillReminders(bill, now);
    }
  } catch {
    /* reconcile is best-effort; never block app boot */
  }
}
