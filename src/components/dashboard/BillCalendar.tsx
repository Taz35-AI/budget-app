'use client';

import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { DayTransaction } from '@/types';

interface Props {
  dayTransactions: Map<string, DayTransaction[]>;
  formatAmount: (n: number) => string;
}

export function BillCalendar({ dayTransactions, formatAmount }: Props) {
  const t = useTranslations('bills');

  const upcomingBills = useMemo(() => {
    const bills: { name: string; amount: number; date: string; daysAway: number; tag?: string | null }[] = [];
    const today = new Date();
    for (let i = 0; i <= 7; i++) {
      const d = addDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const txs = dayTransactions.get(dateStr) ?? [];
      for (const tx of txs) {
        if (tx.type === 'recurring' && tx.category === 'expense') {
          bills.push({ name: tx.name, amount: tx.amount, date: dateStr, daysAway: i, tag: tx.tag });
        }
      }
    }
    return bills;
  }, [dayTransactions]);

  if (upcomingBills.length === 0) return null;

  const urgencyLabel = (days: number) => {
    if (days === 0) return t('today');
    if (days === 1) return t('tomorrow');
    return t('inDays', { days });
  };

  const urgencyColor = (days: number) => {
    if (days === 0) return 'text-red-500 dark:text-red-400 font-bold';
    if (days === 1) return 'text-amber-500 dark:text-amber-400 font-semibold';
    return 'text-brand-text/40 dark:text-white/35 font-medium';
  };

  return (
    <div className="native-card rounded-3xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <svg className="w-4 h-4 text-brand-primary/60 dark:text-teal-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-xs font-bold text-brand-text/60 dark:text-white/50">{t('title')}</p>
      </div>
      <div className="px-4 pb-3.5">
        {upcomingBills.map((bill, i) => (
          <div
            key={`${bill.date}-${bill.name}-${i}`}
            className={cn(
              'flex items-center justify-between py-2.5',
              i < upcomingBills.length - 1 && 'border-b border-black/[0.04] dark:border-white/[0.04]',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-sm font-medium text-brand-text dark:text-white truncate">{bill.name}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-bold text-brand-danger tabular-nums">{formatAmount(bill.amount)}</span>
              <span className={cn('text-[10px] min-w-[52px] text-right', urgencyColor(bill.daysAway))}>
                {urgencyLabel(bill.daysAway)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
