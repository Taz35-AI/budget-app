'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, getDaysInMonth, addDays } from 'date-fns';
import { FREQUENCIES } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import type { DayTransaction } from '@/types';

interface Props {
  month: Date;
  dayTransactions: Map<string, DayTransaction[]>;
  formatAmount: (n: number) => string;
}

function SectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className={cn('w-1 h-3.5 rounded-full flex-shrink-0', accent)} />
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-white/40">
        {label}
      </p>
    </div>
  );
}


export function MonthSummary({ month, dayTransactions, formatAmount }: Props) {
  const { allTags, goals } = useSettings();

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(month);
    const isCurrentMonth = format(month, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

    const pastTxs: DayTransaction[] = [];
    const allMonthTxs: DayTransaction[] = [];
    dayTransactions.forEach((txs, date) => {
      if (date < start || date > end) return;
      allMonthTxs.push(...txs);
      if (date <= today) pastTxs.push(...txs);
    });

    const currentDay = isCurrentMonth ? new Date().getDate() : daysInMonth;
    const totalExpenseSoFar = pastTxs.filter(tx => tx.category === 'expense').reduce((s, tx) => s + tx.amount, 0);
    const dailyAvg = currentDay > 0 ? totalExpenseSoFar / currentDay : 0;
    const daysRemaining = isCurrentMonth ? daysInMonth - new Date().getDate() : 0;
    const txCount = pastTxs.length;

    const topExpenses = allMonthTxs
      .filter(tx => tx.category === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const seenIds = new Set<string>();
    const recurringItems: DayTransaction[] = [];
    allMonthTxs
      .filter(tx => tx.type === 'recurring')
      .forEach(tx => {
        if (!seenIds.has(tx.transaction_id)) {
          seenIds.add(tx.transaction_id);
          recurringItems.push(tx);
        }
      });

    const upcoming: { tx: DayTransaction; date: string }[] = [];
    if (isCurrentMonth) {
      for (let i = 1; i <= 7; i++) {
        const d = format(addDays(new Date(), i), 'yyyy-MM-dd');
        const txs = dayTransactions.get(d);
        if (txs) txs.forEach(tx => upcoming.push({ tx, date: d }));
      }
    }

    return { dailyAvg, daysRemaining, txCount, topExpenses, recurringItems, upcoming, isCurrentMonth, daysInMonth };
  }, [month, dayTransactions]);

  const { dailyAvg, daysRemaining, txCount, topExpenses, recurringItems, upcoming, isCurrentMonth, daysInMonth } = stats;

  return (
    <div className="flex flex-col gap-5 px-5 py-5">

      {/* Month heading */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {format(month, 'MMMM yyyy')}
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-white/35 mt-0.5 font-medium">
            Click a day to view or add transactions
          </p>
        </div>
      </div>

      {/* Quick insight row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="relative rounded-xl overflow-hidden bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] px-3 py-2.5">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-violet-400 to-indigo-400" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-1">Daily avg</p>
          <p className="text-sm font-extrabold text-slate-800 dark:text-white tabular-nums leading-none truncate">{formatAmount(dailyAvg)}</p>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] px-3 py-2.5">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-sky-400 to-cyan-400" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-1">{isCurrentMonth ? 'Days left' : 'Days'}</p>
          <p className="text-sm font-extrabold text-slate-800 dark:text-white tabular-nums leading-none">{isCurrentMonth ? daysRemaining : daysInMonth}</p>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] px-3 py-2.5">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-400" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-1">Transactions</p>
          <p className="text-sm font-extrabold text-slate-800 dark:text-white tabular-nums leading-none">{txCount}</p>
        </div>
      </div>

      {/* Upcoming — next 7 days */}
      {upcoming.length > 0 && (
        <div>
          <SectionHeader label="Next 7 days" accent="bg-gradient-to-b from-sky-400 to-indigo-400" />
          <div className="flex flex-col gap-1.5">
            {upcoming.map(({ tx, date }) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.025] border border-slate-100 dark:border-white/[0.05] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className={cn(
                  'w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[1.5rem]',
                  tx.category === 'income' ? 'bg-emerald-400' : 'bg-red-400',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-white/90 truncate font-medium leading-tight">{tx.name}</p>
                  <p className="text-[11px] text-slate-400 dark:text-white/35 mt-0.5 leading-tight">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className={cn(
                  'text-sm font-bold tabular-nums flex-shrink-0',
                  tx.category === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                )}>
                  {tx.category === 'income' ? '+' : '−'}{formatAmount(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biggest expenses */}
      {topExpenses.length > 0 && (
        <div>
          <SectionHeader label="Biggest expenses" accent="bg-gradient-to-b from-red-400 to-rose-500" />
          <div className="flex flex-col gap-1.5">
            {topExpenses.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.025] border border-slate-100 dark:border-white/[0.05] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-[3px] self-stretch rounded-full bg-red-400 flex-shrink-0 min-h-[1.5rem]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-white/90 truncate font-medium leading-tight">{tx.name}</p>
                  {tx.tag && allTags[tx.tag] && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-white mt-0.5"
                      style={{ backgroundColor: allTags[tx.tag].color }}
                    >
                      {allTags[tx.tag].label}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-red-500 dark:text-red-400 tabular-nums flex-shrink-0">
                  −{formatAmount(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring items */}
      {recurringItems.length > 0 && (
        <div>
          <SectionHeader label="Recurring this month" accent="bg-gradient-to-b from-violet-400 to-purple-500" />
          <div className="flex flex-col gap-1.5">
            {recurringItems.map((tx) => (
              <div
                key={tx.transaction_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.025] border border-slate-100 dark:border-white/[0.05] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className={cn(
                  'w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[1.5rem]',
                  tx.category === 'income' ? 'bg-emerald-400' : 'bg-violet-400',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-white/90 truncate font-medium leading-tight">{tx.name}</p>
                  {tx.frequency && (
                    <p className="text-[11px] text-slate-400 dark:text-white/35 mt-0.5 leading-tight">{FREQUENCIES[tx.frequency]}</p>
                  )}
                </div>
                <span className={cn(
                  'text-sm font-bold tabular-nums flex-shrink-0',
                  tx.category === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                )}>
                  {tx.category === 'income' ? '+' : '−'}{formatAmount(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Savings Goals */}
      {goals.length > 0 && (
        <div>
          <SectionHeader label="Savings goals" accent="bg-gradient-to-b from-emerald-400 to-teal-500" />
          <div className="flex flex-col gap-2">
            {goals.map((goal) => {
              const pct = goal.targetAmount > 0 ? Math.min(goal.currentSaved / goal.targetAmount, 1) : 0;
              const daysLeft = goal.deadline
                ? Math.max(0, Math.ceil((new Date(goal.deadline + 'T12:00:00').getTime() - Date.now()) / 86_400_000))
                : null;
              return (
                <div key={goal.id} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.025] border border-slate-100 dark:border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800 dark:text-white/90 truncate">{goal.name}</p>
                    <span className="text-xs font-semibold text-slate-500 dark:text-white/40 tabular-nums flex-shrink-0 ml-2">{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', pct >= 1 ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-400 to-teal-400')}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-white/35">{formatAmount(goal.currentSaved)} / {formatAmount(goal.targetAmount)}</span>
                    {daysLeft !== null && (
                      <span className="text-[11px] text-slate-400 dark:text-white/35">{daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topExpenses.length === 0 && recurringItems.length === 0 && (
        <div className="py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-white/25">No transactions this month</p>
        </div>
      )}
    </div>
  );
}
