'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { getDateLocale } from '@/lib/dateLocale';
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
  const language = useSettingsStore((s) => s.language);
  const warnedMonth = useSettingsStore((s) => s.budgetWarnedMonth);
  const setWarnedMonth = useSettingsStore((s) => s.setBudgetWarnedMonth);
  const [permissionState, setPermissionState] = useState<NotifPermission | 'unknown'>('unknown');

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

  // Budget warning — fires at most once per calendar month. The warned month
  // is persisted, so restarting the app doesn't re-fire it.
  useEffect(() => {
    if (permissionState !== 'granted') return;
    if (!notif.budgetWarnings) return;
    if (!budgetLimit || budgetLimit <= 0) return;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (warnedMonth === monthKey) return;

    const pct = (monthExpense / budgetLimit) * 100;
    if (pct >= 85) {
      const monthName = now.toLocaleString(getDateLocale(language), { month: 'long' });
      scheduleBudgetWarning(monthName, pct);
      setWarnedMonth(monthKey);
    }
  }, [permissionState, notif.budgetWarnings, monthExpense, budgetLimit, warnedMonth, setWarnedMonth, language]);

  const requestPermission = useCallback(async () => {
    const state = await requestNotificationPermission();
    setPermissionState(state);
    return state;
  }, []);

  return { permissionState, requestPermission, cancelAll: cancelAllScheduledNotifications };
}
