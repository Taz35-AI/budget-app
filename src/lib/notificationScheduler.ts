/**
 * notificationScheduler.ts
 *
 * Pure scheduling helpers — all Capacitor calls are dynamically imported so this
 * module is safe to import on web (where @capacitor/local-notifications is a no-op).
 *
 * Stable notification IDs:
 *   1   — daily spending reminder
 *   2   — monthly recap
 *   3   — weekly digest
 *   4   — budget limit warning
 *   100–199 — bill-due-tomorrow reminders (one slot per recurring transaction)
 */

import type { Transaction } from '@/types';
import { firesOnDate } from '@/engine/recurringResolver';

// ─── ID constants ────────────────────────────────────────────────────────────

const ID_DAILY    = 1;
const ID_MONTHLY  = 2;
const ID_WEEKLY   = 3;
const ID_BUDGET   = 4;
const ID_BILL_BASE = 100; // IDs 100-199

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
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.requestPermissions();
    return normalisePermission(display);
  } catch {
    return 'denied';
  }
}

export async function checkNotificationPermission(): Promise<NotifPermission> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.checkPermissions();
    return normalisePermission(display);
  } catch {
    return 'denied';
  }
}

// ─── Cancel helpers ──────────────────────────────────────────────────────────

async function cancelIds(ids: number[]) {
  if (!ids.length) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  } catch { /* web / no permission */ }
}

export async function cancelAllScheduledNotifications() {
  const allIds = [
    ID_DAILY, ID_MONTHLY, ID_WEEKLY, ID_BUDGET,
    ...Array.from({ length: 100 }, (_, i) => ID_BILL_BASE + i),
  ];
  await cancelIds(allIds);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD string for today offset by `days` */
function dateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function atHourMinute(hour: number, minute: number, offsetDays = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  // If this time is already past today, push to tomorrow
  if (offsetDays === 0 && d <= new Date()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// ─── Schedulers ──────────────────────────────────────────────────────────────

export async function scheduleDailyReminder(hour: number, minute: number) {
  await cancelIds([ID_DAILY]);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        id:    ID_DAILY,
        title: 'Budget App',
        body:  "Don't forget to log today's spending",
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#1DB8AD',
      }],
    });
  } catch { /* web */ }
}

export async function scheduleBillReminders(transactions: Transaction[]) {
  // Cancel previous bill slots
  await cancelIds(Array.from({ length: 100 }, (_, i) => ID_BILL_BASE + i));

  const tomorrow = dateStr(1);

  // Find recurring transactions that fire tomorrow and haven't ended
  const dueTomorrow = transactions.filter((t) => {
    if (t.type !== 'recurring') return false;
    if (!t.start_date || !t.frequency) return false;
    if (t.end_date && t.end_date < tomorrow) return false;
    return firesOnDate(t.start_date, t.frequency, tomorrow);
  });

  if (!dueTomorrow.length) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: dueTomorrow.slice(0, 100).map((t, i) => ({
        id:    ID_BILL_BASE + i,
        title: 'Bill due tomorrow',
        body:  `Your ${t.name} payment is due tomorrow`,
        schedule: {
          at: atHourMinute(9, 0, 0),   // Today at 9am (or next 9am if already past)
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#1DB8AD',
      })),
    });
  } catch { /* web */ }
}

export async function scheduleMonthlyRecap() {
  await cancelIds([ID_MONTHLY]);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const now = new Date();
    // Fire on the 1st of next month at 9am
    const target = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
    const monthName = target.toLocaleString('default', { month: 'long' });
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toLocaleString('default', { month: 'long' });

    await LocalNotifications.schedule({
      notifications: [{
        id:    ID_MONTHLY,
        title: 'Monthly recap ready',
        body:  `Your ${prevMonth} spending summary is ready to review`,
        schedule: {
          at: target,
          repeats: false,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#1DB8AD',
      }],
    });
    void monthName; // used above for context
  } catch { /* web */ }
}

export async function scheduleWeeklyDigest() {
  await cancelIds([ID_WEEKLY]);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    // Next Monday at 9am
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7; // always future Monday
    const target = new Date(now);
    target.setDate(now.getDate() + daysUntilMonday);
    target.setHours(9, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [{
        id:    ID_WEEKLY,
        title: 'Weekly digest',
        body:  'Your week in Budget App — tap to see your spending and upcoming bills',
        schedule: {
          on: { weekday: 2, hour: 9, minute: 0 }, // Monday = 2
          repeats: true,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#1DB8AD',
      }],
    });
    void target;
  } catch { /* web */ }
}

export async function scheduleBudgetWarning(
  monthName: string,
  pct: number, // e.g. 87 for 87%
) {
  await cancelIds([ID_BUDGET]);
  if (pct < 85) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const fireAt = new Date();
    fireAt.setMinutes(fireAt.getMinutes() + 2); // fire 2 min from now
    await LocalNotifications.schedule({
      notifications: [{
        id:    ID_BUDGET,
        title: 'Budget limit alert',
        body:  `You've used ${Math.round(pct)}% of your ${monthName} budget`,
        schedule: {
          at: fireAt,
          allowWhileIdle: true,
        },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#ef4444',
      }],
    });
  } catch { /* web */ }
}
