'use client';

import { useMemo, useState } from 'react';
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
  const [expanded, setExpanded] = useState(false);

  // Group the next 8 days of recurring expenses by transaction_id so that
  // a daily recurring shows once (at its next occurrence) with a ×N pill,
  // rather than taking up 8 rows on its own.
  const upcomingBills = useMemo(() => {
    type Bill = {
      name: string;
      amount: number;
      date: string;
      daysAway: number;
      occurrences: number;
      tag?: string | null;
    };
    const byTx = new Map<string, Bill>();
    const today = new Date();
    for (let i = 0; i <= 7; i++) {
      const d = addDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const txs = dayTransactions.get(dateStr) ?? [];
      for (const tx of txs) {
        if (tx.type !== 'recurring' || tx.category !== 'expense') continue;
        const existing = byTx.get(tx.transaction_id);
        if (existing) {
          existing.occurrences += 1;
        } else {
          byTx.set(tx.transaction_id, {
            name: tx.name,
            amount: tx.amount,
            date: dateStr,
            daysAway: i,
            occurrences: 1,
            tag: tx.tag,
          });
        }
      }
    }
    // Sort by soonest first, then by amount descending for same day
    return [...byTx.values()].sort((a, b) =>
      a.daysAway - b.daysAway || b.amount - a.amount,
    );
  }, [dayTransactions]);

  if (upcomingBills.length === 0) return null;

  // Total spend across all upcoming occurrences in the window
  const totalSpend = upcomingBills.reduce((sum, b) => sum + b.amount * b.occurrences, 0);
  const distinctCount = upcomingBills.length;
  const soonest = upcomingBills[0];

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
      {/* Summary header — always visible, clickable to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded}
      >
        <svg className="w-4 h-4 text-brand-primary/60 dark:text-teal-400/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="flex items-baseline gap-2 min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-text/70 dark:text-white/60 flex-shrink-0">
            {t('summary', { count: distinctCount })}
          </p>
          <span className="text-[11px] text-brand-text/35 dark:text-white/30 truncate">
            · {t('nextUp', { name: soonest.name, when: urgencyLabel(soonest.daysAway) })}
          </span>
        </div>
        <span className="text-xs font-bold text-brand-danger tabular-nums flex-shrink-0">
          {formatAmount(totalSpend)}
        </span>
        <svg
          className={cn('w-3.5 h-3.5 text-brand-text/40 dark:text-white/35 flex-shrink-0 transition-transform duration-100', expanded && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3.5 max-h-[280px] overflow-y-auto overscroll-contain border-t border-black/[0.04] dark:border-white/[0.04]">
          {upcomingBills.map((bill, i) => (
            <div
              key={`${bill.date}-${bill.name}-${i}`}
              className={cn(
                'flex items-center justify-between py-2',
                i < upcomingBills.length - 1 && 'border-b border-black/[0.04] dark:border-white/[0.04]',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-sm font-medium text-brand-text dark:text-white truncate">{bill.name}</span>
                {bill.occurrences > 1 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-primary/10 dark:bg-brand-primary/15 text-brand-primary tabular-nums flex-shrink-0">
                    ×{bill.occurrences}
                  </span>
                )}
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
      )}
    </div>
  );
}
