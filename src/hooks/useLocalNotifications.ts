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
  cancelIds,
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

  const lastWarnedPct = useRef<number>(0);

  // Check permission on mount
  useEffect(() => {
    checkNotificationPermission().then(setPermissionState);
  }, []);

  // Re-schedule all toggle-able notifications when settings or data change
  useEffect(() => {
    if (permissionState !== 'granted') return;

    async function reschedule() {
      if (notif.dailyReminder) {
        await scheduleDailyReminder(notif.dailyHour, notif.dailyMinute);
      } else {
        await cancelIds([1]);
      }

      if (notif.billReminders) {
        await scheduleBillReminders(transactions);
      } else {
        await cancelIds(Array.from({ length: 100 }, (_, i) => 100 + i));
      }

      if (notif.monthlyRecap) {
        await scheduleMonthlyRecap();
      } else {
        await cancelIds([2]);
      }

      if (notif.weeklyDigest) {
        await scheduleWeeklyDigest();
      } else {
        await cancelIds([3]);
      }
    }

    reschedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    permissionState,
    notif.dailyReminder, notif.dailyHour, notif.dailyMinute,
    notif.billReminders, notif.monthlyRecap, notif.weeklyDigest,
    // transactions reference changes when data refreshes — intentional
    transactions,
  ]);

  // Budget warning — fires once when crossing 85%, resets each month
  useEffect(() => {
    if (permissionState !== 'granted') return;
    if (!notif.budgetWarnings) return;
    if (!budgetLimit || budgetLimit <= 0) return;

    const pct = (monthExpense / budgetLimit) * 100;
    if (pct >= 85 && lastWarnedPct.current < 85) {
      const monthName = new Date().toLocaleString('default', { month: 'long' });
      scheduleBudgetWarning(monthName, pct);
    }
    if (pct < 10) lastWarnedPct.current = 0; // new month reset
    else lastWarnedPct.current = pct;
  }, [permissionState, notif.budgetWarnings, monthExpense, budgetLimit]);

  const requestPermission = useCallback(async () => {
    const state = await requestNotificationPermission();
    setPermissionState(state);
    return state;
  }, []);

  return { permissionState, requestPermission, cancelAll: cancelAllScheduledNotifications };
}
