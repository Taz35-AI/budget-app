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
 *   100–199 — bill-due-tomorrow reminders (one per recurring transaction)
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

function dateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/**
 * Returns the best time to fire a "bill due tomorrow" notification:
 *  - Before 8pm today  → fire at 8pm today   (evening reminder)
 *  - After  8pm today  → fire at 8am tomorrow (morning of bill due date)
 *    (notification body will say "due today" implicitly — acceptable tradeoff
 *     vs pushing so far in future the user misses it entirely)
 */
function billReminderTime(): Date {
  const now = new Date();
  const eightPm = new Date(now);
  eightPm.setHours(20, 0, 0, 0);
  if (now < eightPm) return eightPm;

  const tomorrow8am = new Date(now);
  tomorrow8am.setDate(now.getDate() + 1);
  tomorrow8am.setHours(8, 0, 0, 0);
  return tomorrow8am;
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

  const tomorrow = dateStr(1);
  const dueTomorrow = transactions.filter((t) => {
    if (t.type !== 'recurring') return false;
    if (!t.start_date || !t.frequency) return false;
    if (t.end_date && t.end_date < tomorrow) return false;
    return firesOnDate(t.start_date, t.frequency, tomorrow);
  });

  if (!dueTomorrow.length) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const fireAt = billReminderTime();
    await LocalNotifications.schedule({
      notifications: dueTomorrow.slice(0, 100).map((t, i) => ({
        id:        ID_BILL_BASE + i,
        title:     'Bill due tomorrow',
        body:      `Your ${t.name} payment is due tomorrow`,
        smallIcon: 'ic_notification',
        schedule: {
          at: fireAt,
          allowWhileIdle: true,
        },
      })),
    });
  } catch { /* web / bridge unavailable */ }
}

export async function scheduleMonthlyRecap() {
  if (!Capacitor.isNativePlatform()) return;
  await cancelIds([ID_MONTHLY]);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
    const prevMonth = now.toLocaleString('default', { month: 'long' });
    await LocalNotifications.schedule({
      notifications: [{
        id:        ID_MONTHLY,
        title:     'Monthly recap ready',
        body:      `Your ${prevMonth} spending summary is ready to review`,
        smallIcon: 'ic_notification',
        schedule: {
          at: target,
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
