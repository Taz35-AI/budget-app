'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleBillReminders,
  scheduleMonthlyRecap,
  scheduleWeeklyDigest,
  scheduleBudgetWarning,
  cancelAllScheduledNotifications,
} from '@/lib/notificationScheduler';
import type { NotifPermission } from '@/lib/notificationScheduler';
import type { Transaction } from '@/types';

interface Options {
  transactions: Transaction[];
  monthExpense:  number;
  budgetLimit:   number | null;
}

export function useLocalNotifications({ transactions, monthExpense, budgetLimit }: Options) {
  const notif = useSettingsStore((s) => s.notificationSettings);
  const [permissionState, setPermissionState] = useState<NotifPermission | 'unknown'>('unknown');

  // Track the last budget-warning percentage to avoid re-firing on every re-render
  const lastWarnedPct = useRef<number>(0);

  // Check permission on mount
  useEffect(() => {
    checkNotificationPermission().then(setPermissionState);
  }, []);

  // Re-schedule everything whenever relevant settings or data change
  useEffect(() => {
    if (permissionState !== 'granted') return;

    async function reschedule() {
      // Daily reminder
      if (notif.dailyReminder) {
        await scheduleDailyReminder(notif.dailyHour, notif.dailyMinute);
      } else {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
          .catch(() => ({ LocalNotifications: null }));
        LocalNotifications?.cancel({ notifications: [{ id: 1 }] });
      }

      // Bill reminders
      if (notif.billReminders) {
        await scheduleBillReminders(transactions);
      } else {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
          .catch(() => ({ LocalNotifications: null }));
        const ids = Array.from({ length: 100 }, (_, i) => ({ id: 100 + i }));
        LocalNotifications?.cancel({ notifications: ids });
      }

      // Monthly recap
      if (notif.monthlyRecap) {
        await scheduleMonthlyRecap();
      } else {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
          .catch(() => ({ LocalNotifications: null }));
        LocalNotifications?.cancel({ notifications: [{ id: 2 }] });
      }

      // Weekly digest
      if (notif.weeklyDigest) {
        await scheduleWeeklyDigest();
      } else {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
          .catch(() => ({ LocalNotifications: null }));
        LocalNotifications?.cancel({ notifications: [{ id: 3 }] });
      }
    }

    reschedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    permissionState,
    notif.dailyReminder, notif.dailyHour, notif.dailyMinute,
    notif.billReminders, notif.monthlyRecap, notif.weeklyDigest,
    transactions,
  ]);

  // Budget warning — fires when crossing 85% threshold, once per month
  useEffect(() => {
    if (permissionState !== 'granted') return;
    if (!notif.budgetWarnings) return;
    if (!budgetLimit || budgetLimit <= 0) return;

    const pct = (monthExpense / budgetLimit) * 100;
    if (pct >= 85 && lastWarnedPct.current < 85) {
      const now = new Date();
      const monthName = now.toLocaleString('default', { month: 'long' });
      scheduleBudgetWarning(monthName, pct);
    }
    // Reset when a new month starts (pct drops back near 0)
    if (pct < 10) lastWarnedPct.current = 0;
    else lastWarnedPct.current = pct;
  }, [permissionState, notif.budgetWarnings, monthExpense, budgetLimit]);

  const requestPermission = useCallback(async () => {
    const state = await requestNotificationPermission();
    setPermissionState(state);
    return state;
  }, []);

  return { permissionState, requestPermission, cancelAll: cancelAllScheduledNotifications };
}
