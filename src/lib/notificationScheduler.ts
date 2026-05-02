/**
 * notificationScheduler.ts
 *
 * Pure scheduling helpers.
 * - `Capacitor` is imported statically — safe, handles SSR by returning false.
 * - `LocalNotifications` is imported dynamically to avoid module-level browser
 *   API calls during Next.js SSR.
 * - Every public function starts with `Capacitor.isNativePlatform()` guard so
 *   on web (browser / Vercel preview) all calls are silent no-ops.
 *
 * Stable notification IDs:
 *   1   — daily spending reminder
 *   2   — monthly recap
 *   3   — weekly digest
 *   4   — budget limit warning
 *   100–199 — upcoming-bill reminders (one per (bill × occurrence) in the
 *             next BILL_LOOKAHEAD_DAYS, capped at MAX_BILL_NOTIFICATIONS)
 */

import { Capacitor } from '@capacitor/core';
import type { Transaction } from '@/types';
import { firesOnDate } from '@/engine/recurringResolver';

// ─── ID constants ────────────────────────────────────────────────────────────

const ID_DAILY     = 1;
const ID_MONTHLY   = 2;
const ID_WEEKLY    = 3;
const ID_BUDGET    = 4;
const ID_BILL_BASE = 100;

// ─── Bill reminder configuration ─────────────────────────────────────────────

/** How far ahead to pre-schedule bill reminders. */
export const BILL_LOOKAHEAD_DAYS = 30;

/**
 * Cap on simultaneously pending bill notifications.
 * iOS allows ~64 pending local notifications per app; we reserve headroom for
 * the 4 toggleable reminders above and any future use, keeping bills ≤ 50.
 */
export const MAX_BILL_NOTIFICATIONS = 50;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NotificationSettings {
  dailyReminder:  boolean;
  dailyHour:      number;   // 0-23
  dailyMinute:    number;   // 0-59
  billReminders:  boolean;
  monthlyRecap:   boolean;
  weeklyDigest:   boolean;
  budgetWarnings: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dailyReminder:  true,
  dailyHour:      20,
  dailyMinute:    0,
  billReminders:  true,
  monthlyRecap:   true,
  weeklyDigest:   true,
  budgetWarnings: true,
};

// ─── Permission ──────────────────────────────────────────────────────────────

export type NotifPermission = 'granted' | 'denied' | 'prompt';

function normalisePermission(raw: string): NotifPermission {
  if (raw === 'granted') return 'granted';
  if (raw === 'denied')  return 'denied';
  return 'prompt';
}

export async function requestNotificationPermission(): Promise<NotifPermission> {
  if (!Capacitor.isNativePlatform()) return 'denied';
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.requestPermissions();
    return normalisePermission(display);
  } catch {
    return 'denied';
  }
}

export async function checkNotificationPermission(): Promise<NotifPermission> {
  if (!Capacitor.isNativePlatform()) return 'denied';
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.checkPermissions();
    return normalisePermission(display);
  } catch {
    return 'denied';
  }
}

// ─── Cancel helpers ──────────────────────────────────────────────────────────

export async function cancelIds(ids: number[]) {
  if (!ids.length) return;
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch { /* ignore */ }
}

export async function cancelAllScheduledNotifications() {
  await cancelIds([
    ID_DAILY, ID_MONTHLY, ID_WEEKLY, ID_BUDGET,
    ...Array.from({ length: 100 }, (_, i) => ID_BILL_BASE + i),
  ]);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function dateStr(offsetDays = 0, baseDate = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// ─── Bill reminder construction (pure, testable) ─────────────────────────────

export interface BillReminder {
  /** The recurring transaction this reminder is for. */
  tx: Transaction;
  /** YYYY-MM-DD — the date the bill is actually due. */
  dueDate: string;
  /** When the OS should fire the notification. */
  fireAt: Date;
  /** True → "due tomorrow" copy; false → "due today" copy. */
  isEveBefore: boolean;
}

/**
 * Returns the best moment to fire a reminder for a bill due on `dueDate`.
 *
 * Convention:
 *  - Prefer 8pm the evening BEFORE — gives the user 24h to top up / transfer.
 *  - If that slot is already past (e.g. bill is due tomorrow and it's after
 *    8pm tonight), fall back to 8am the morning of.
 *  - If both slots are past, the bill is essentially "now" — skip it.
 */
export function reminderFireTime(
  dueDate: string,
  now: Date = new Date(),
): { fireAt: Date; isEveBefore: boolean } | null {
  const due = new Date(dueDate + 'T00:00:00');

  const eveBefore = new Date(due);
  eveBefore.setDate(eveBefore.getDate() - 1);
  eveBefore.setHours(20, 0, 0, 0);
  if (eveBefore > now) return { fireAt: eveBefore, isEveBefore: true };

  const morningOf = new Date(due);
  morningOf.setHours(8, 0, 0, 0);
  if (morningOf > now) return { fireAt: morningOf, isEveBefore: false };

  return null;
}

/**
 * Computes the set of bill reminders to schedule for the next
 * BILL_LOOKAHEAD_DAYS. Each (recurring tx × fire date) becomes one reminder.
 *
 * Result is sorted by fireAt ascending and capped at MAX_BILL_NOTIFICATIONS
 * to stay under iOS's pending-notification limit.
 */
export function buildBillReminders(
  transactions: Transaction[],
  now: Date = new Date(),
): BillReminder[] {
  const out: BillReminder[] = [];

  for (let offset = 0; offset <= BILL_LOOKAHEAD_DAYS; offset++) {
    const due = dateStr(offset, now);

    for (const t of transactions) {
      if (t.type !== 'recurring') continue;
      if (!t.start_date || !t.frequency) continue;
      if (t.end_date && t.end_date < due) continue;
      if (!firesOnDate(t.start_date, t.frequency, due)) continue;

      const slot = reminderFireTime(due, now);
      if (!slot) continue;

      out.push({
        tx: t,
        dueDate: due,
        fireAt: slot.fireAt,
        isEveBefore: slot.isEveBefore,
      });
    }
  }

  out.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
  return out.slice(0, MAX_BILL_NOTIFICATIONS);
}

// ─── Schedulers ──────────────────────────────────────────────────────────────

export async function scheduleDailyReminder(hour: number, minute: number) {
  if (!Capacitor.isNativePlatform()) return;
  await cancelIds([ID_DAILY]);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id:        ID_DAILY,
        title:     'Spentum',
        body:      "Don't forget to log today's spending",
        smallIcon: 'ic_notification',
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
      }],
    });
  } catch { /* web / bridge unavailable */ }
}

export async function scheduleBillReminders(transactions: Transaction[]) {
  if (!Capacitor.isNativePlatform()) return;
  await cancelIds(Array.from({ length: 100 }, (_, i) => ID_BILL_BASE + i));

  const reminders = buildBillReminders(transactions);
  if (!reminders.length) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: reminders.map((r, i) => ({
        id:        ID_BILL_BASE + i,
        title:     r.isEveBefore ? 'Bill due tomorrow' : 'Bill due today',
        body:      r.isEveBefore
          ? `Your ${r.tx.name} payment is due tomorrow`
          : `Your ${r.tx.name} payment is due today`,
        smallIcon: 'ic_notification',
        schedule: {
          at: r.fireAt,
          allowWhileIdle: true,
        },
      })),
    });
  } catch { /* web / bridge unavailable */ }
}

/**
 * Computes when the next monthly recap notification should fire and which
 * month's spending it summarizes.
 *
 * Convention:
 *  - Recaps fire on the 1st of a month at 9am, summarizing the month that
 *    just ended.
 *  - If `now` is before 9am on the 1st, schedule for *today* at 9am.
 *  - Otherwise, schedule for the 1st of next month at 9am.
 *
 * The recap month is always the month immediately before the firing date.
 */
export function monthlyRecapTime(now: Date = new Date()): { fireAt: Date; recapMonthName: string } {
  const thisMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1, 9, 0, 0);
  const fireAt = thisMonthFirst > now
    ? thisMonthFirst
    : new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);

  // Last day of the month before fireAt → tells us which month is being summarized
  const recapMonthDate = new Date(fireAt);
  recapMonthDate.setDate(0);
  const recapMonthName = recapMonthDate.toLocaleString('default', { month: 'long' });

  return { fireAt, recapMonthName };
}

export async function scheduleMonthlyRecap() {
  if (!Capacitor.isNativePlatform()) return;
  await cancelIds([ID_MONTHLY]);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { fireAt, recapMonthName } = monthlyRecapTime();
    await LocalNotifications.schedule({
      notifications: [{
        id:        ID_MONTHLY,
        title:     'Monthly recap ready',
        body:      `Your ${recapMonthName} spending summary is ready to review`,
        smallIcon: 'ic_notification',
        schedule: {
          at: fireAt,
          repeats: false,
          allowWhileIdle: true,
        },
      }],
    });
  } catch { /* web / bridge unavailable */ }
}

export async function scheduleWeeklyDigest() {
  if (!Capacitor.isNativePlatform()) return;
  await cancelIds([ID_WEEKLY]);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id:        ID_WEEKLY,
        title:     'Weekly digest',
        body:      'Your week in Spentum — tap to see spending and upcoming bills',
        smallIcon: 'ic_notification',
        schedule: {
          on: { weekday: 2, hour: 9, minute: 0 }, // Monday = 2
          repeats: true,
          allowWhileIdle: true,
        },
      }],
    });
  } catch { /* web / bridge unavailable */ }
}

export async function scheduleBudgetWarning(monthName: string, pct: number) {
  if (!Capacitor.isNativePlatform()) return;
  if (pct < 85) return;
  await cancelIds([ID_BUDGET]);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const fireAt = new Date(Date.now() + 2 * 60_000); // 2 min from now
    await LocalNotifications.schedule({
      notifications: [{
        id:        ID_BUDGET,
        title:     'Budget limit alert',
        body:      `You've used ${Math.round(pct)}% of your ${monthName} budget`,
        smallIcon: 'ic_notification',
        schedule: {
          at: fireAt,
          allowWhileIdle: true,
        },
      }],
    });
  } catch { /* web / bridge unavailable */ }
}
