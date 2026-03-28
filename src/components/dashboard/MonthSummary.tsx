'use client';

import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, getDaysInMonth, addDays, subMonths } from 'date-fns';
import { FREQUENCIES } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { useTransactions } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';
import type { DayTransaction } from '@/types';

interface Props {
  month: Date;
  dayTransactions: Map<string, DayTransaction[]>;
  formatAmount: (n: number) => string;
}

function SectionHeader({
  label,
  accent,
  expandable,
  expanded,
  onToggle,
}: {
  label: string;
  accent: string;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={expandable ? onToggle : undefined}
      className={cn(
        'flex items-center gap-2 mb-2.5 w-full',
        expandable && 'cursor-pointer group',
        !expandable && 'cursor-default',
      )}
    >
      <div className={cn('w-1 h-3.5 rounded-full flex-shrink-0', accent)} />
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#16302F]/50 dark:text-[#B2CFCE]/35 flex-1 text-left">
        {label}
      </p>
      {expandable && (
        <svg
          className={cn(
            'w-3 h-3 text-[#16302F]/30 dark:text-[#B2CFCE]/25 transition-transform duration-200 flex-shrink-0',
            expanded && 'rotate-180',
          )}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );
}

const ROW_CLASS = 'flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F7FAF9] dark:bg-[#16302F]/10 border border-[#B2CFCE]/50 dark:border-[#3B7A78]/[0.07] hover:bg-[#B2CFCE]/30 dark:hover:bg-[#16302F]/20 transition-colors';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthSummary({ month, dayTransactions, formatAmount }: Props) {
  const { allTags, goals } = useSettings();
  const { data: txData } = useTransactions();
  const rawTransactions = txData?.transactions ?? [];
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

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
    const totalIncome = pastTxs.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = pastTxs.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
    const dailyAvg = currentDay > 0 ? totalExpense / currentDay : 0;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : null;
    const txCount = pastTxs.length;

    // Average transaction value (expense only)
    const expenseTxs = pastTxs.filter(t => t.category === 'expense');
    const avgTxValue = expenseTxs.length > 0 ? totalExpense / expenseTxs.length : 0;

    // Biggest single day of spending
    const spendByDay: Record<string, number> = {};
    dayTransactions.forEach((txs, date) => {
      if (date < start || date > end) return;
      const daySpend = txs.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
      if (daySpend > 0) spendByDay[date] = daySpend;
    });
    const peakDayEntry = Object.entries(spendByDay).sort((a, b) => b[1] - a[1])[0];
    const peakDay = peakDayEntry
      ? { date: peakDayEntry[0], amount: peakDayEntry[1] }
      : null;

    // Spending by day of week
    const byDow: number[] = [0, 0, 0, 0, 0, 0, 0];
    dayTransactions.forEach((txs, date) => {
      if (date < start || date > end || date > today) return;
      const dow = new Date(date + 'T12:00:00').getDay();
      txs.filter(t => t.category === 'expense').forEach(t => { byDow[dow] += t.amount; });
    });
    const peakDow = byDow.indexOf(Math.max(...byDow));
    const hasDowData = byDow.some(v => v > 0);

    // Spending by tag
    const tagSpend: Record<string, number> = {};
    allMonthTxs.filter(t => t.category === 'expense' && t.tag).forEach(t => {
      tagSpend[t.tag!] = (tagSpend[t.tag!] ?? 0) + t.amount;
    });
    const tagBreakdown = Object.entries(tagSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Last month total expense for the month-over-month comparison
    const lastMonthStart = format(startOfMonth(subMonths(month, 1)), 'yyyy-MM-dd');
    const lastMonthEnd = format(endOfMonth(subMonths(month, 1)), 'yyyy-MM-dd');
    let lastMonthExpense = 0;
    let lastMonthIncome = 0;
    dayTransactions.forEach((txs, date) => {
      if (date < lastMonthStart || date > lastMonthEnd) return;
      txs.forEach(t => {
        if (t.category === 'expense') lastMonthExpense += t.amount;
        else lastMonthIncome += t.amount;
      });
    });
    // null when there is no last-month data (new user, first month)
    const spendDiff = lastMonthExpense > 0 ? totalExpense - lastMonthExpense : null;

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

    return {
      dailyAvg, savingsRate, txCount, avgTxValue,
      peakDay, peakDow, hasDowData, byDow,
      tagBreakdown, topExpenses, recurringItems, upcoming,
      isCurrentMonth, daysInMonth, totalExpense, totalIncome,
      lastMonthExpense, lastMonthIncome, spendDiff,
    };
  }, [month, dayTransactions]);

  const {
    dailyAvg, savingsRate, txCount, avgTxValue,
    peakDay, peakDow, hasDowData, byDow,
    tagBreakdown, topExpenses, recurringItems, upcoming,
    isCurrentMonth, daysInMonth, totalExpense, spendDiff,
  } = stats;

  const isEmpty = topExpenses.length === 0 && recurringItems.length === 0;

  return (
    <div className="flex flex-col gap-5 px-5 py-5">

      {/* Month heading */}
      <div>
        <h2 className="text-base font-extrabold text-[#16302F] dark:text-white tracking-tight leading-tight">
          {format(month, 'MMMM yyyy')}
        </h2>
        <p className="text-[11px] text-[#16302F]/40 dark:text-[#B2CFCE]/30 mt-0.5 font-medium">
          Click a day to view or add transactions
        </p>
      </div>

      {/* Quick insight row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Daily avg */}
        <div className="relative rounded-xl overflow-hidden bg-[#F7FAF9] dark:bg-[#16302F]/10 border border-[#B2CFCE]/50 dark:border-[#3B7A78]/[0.07] px-3 py-2.5">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#16302F] to-[#16302F]/50 dark:from-[#3B7A78]/60 dark:to-[#5FAF6B]/40" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#16302F]/40 dark:text-[#B2CFCE]/30 mb-1">Daily avg</p>
          <p className="text-sm font-extrabold text-[#16302F] dark:text-white tabular-nums leading-none truncate">{formatAmount(dailyAvg)}</p>
        </div>

        {/* Savings rate */}
        <div className="relative rounded-xl overflow-hidden bg-[#F7FAF9] dark:bg-[#16302F]/10 border border-[#B2CFCE]/50 dark:border-[#3B7A78]/[0.07] px-3 py-2.5">
          <div className={cn(
            'absolute top-0 inset-x-0 h-[2px]',
            savingsRate === null ? 'bg-[#B2CFCE]/60 dark:bg-[#16302F]/40' :
            savingsRate >= 20 ? 'bg-gradient-to-r from-[#3B7A78] to-[#5FAF6B]' :
            savingsRate >= 0 ? 'bg-gradient-to-r from-[#3B7A78] to-[#3B7A78]/50' :
            'bg-gradient-to-r from-red-400 to-rose-400',
          )} />
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#16302F]/40 dark:text-[#B2CFCE]/30 mb-1">Saved</p>
          <p className={cn(
            'text-sm font-extrabold tabular-nums leading-none',
            savingsRate === null ? 'text-[#16302F]/40 dark:text-[#B2CFCE]/30' :
            savingsRate >= 20 ? 'text-[#3B7A78]' :
            savingsRate >= 0 ? 'text-[#3B7A78]' :
            'text-red-500 dark:text-red-400',
          )}>
            {savingsRate === null ? '—' : `${savingsRate}%`}
          </p>
        </div>

        {/* Transactions */}
        <div className="relative rounded-xl overflow-hidden bg-[#F7FAF9] dark:bg-[#16302F]/10 border border-[#B2CFCE]/50 dark:border-[#3B7A78]/[0.07] px-3 py-2.5">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#3B7A78] to-[#3B7A78]/50" />
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#16302F]/40 dark:text-[#B2CFCE]/30 mb-1">Count</p>
          <p className="text-sm font-extrabold text-[#16302F] dark:text-white tabular-nums leading-none">{txCount}</p>
        </div>
      </div>

      {/* Month-over-month spending insight */}
      {totalExpense > 0 && (
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-br from-[#F7FAF9] to-[#f7fafc] dark:from-[#0d1e35]/70 dark:to-[#122928]/50 border border-[#B2CFCE]/60 dark:border-[#16302F]/50">
          <div className="w-7 h-7 rounded-lg bg-[#16302F]/8 dark:bg-[#3B7A78]/10 flex items-center justify-center flex-shrink-0 text-[#16302F]/50 dark:text-[#3B7A78]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#16302F] dark:text-white/90 leading-tight">
              {isCurrentMonth ? 'Spent so far this month' : `Spent in ${format(month, 'MMMM')}`}
              {': '}
              <span className="text-red-500 dark:text-red-400">{formatAmount(totalExpense)}</span>
            </p>
            {spendDiff !== null && (
              <p className="text-[11px] mt-0.5 text-[#16302F]/50 dark:text-[#B2CFCE]/40 leading-snug">
                <span className={cn(
                  'font-semibold',
                  spendDiff > 0 ? 'text-red-500 dark:text-red-400' : 'text-[#3B7A78]',
                )}>
                  {spendDiff > 0 ? '+' : '−'}{formatAmount(Math.abs(spendDiff))}
                </span>
                {' '}vs all of {format(subMonths(month, 1), 'MMMM')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Spending patterns — expandable */}
      {(peakDay || hasDowData || avgTxValue > 0) && (
        <div>
          <SectionHeader
            label="Spending patterns"
            accent="bg-gradient-to-b from-[#1A3B3A] to-[#3B7A78]"
            expandable
            expanded={expandedSections['patterns']}
            onToggle={() => toggle('patterns')}
          />
          {expandedSections['patterns'] && (
            <div className="flex flex-col gap-2">
              {/* Peak day */}
              {peakDay && (
                <div className={ROW_CLASS}>
                  <div className="w-7 h-7 rounded-lg bg-[#3B7A78]/10 flex items-center justify-center flex-shrink-0 text-[#3B7A78]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#16302F] dark:text-white/90 leading-tight">Biggest spending day</p>
                    <p className="text-[11px] text-[#16302F]/40 dark:text-[#B2CFCE]/35 mt-0.5">
                      {new Date(peakDay.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-500 dark:text-red-400 tabular-nums flex-shrink-0">
                    −{formatAmount(peakDay.amount)}
                  </span>
                </div>
              )}

              {/* Peak day of week */}
              {hasDowData && (
                <div className={ROW_CLASS}>
                  <div className="w-7 h-7 rounded-lg bg-[#3B7A78]/10 flex items-center justify-center flex-shrink-0 text-[#3B7A78]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#16302F] dark:text-white/90 leading-tight">You spend most on</p>
                    <p className="text-[11px] text-[#16302F]/40 dark:text-[#B2CFCE]/35 mt-0.5">{DAY_NAMES[peakDow]}s</p>
                  </div>
                  {/* Mini bar chart */}
                  <div className="flex items-end gap-[2px] h-6 flex-shrink-0">
                    {byDow.map((v, i) => {
                      const max = Math.max(...byDow);
                      const pct = max > 0 ? v / max : 0;
                      return (
                        <div
                          key={i}
                          className={cn(
                            'w-2 rounded-sm transition-all',
                            i === peakDow ? 'bg-[#3B7A78]' : 'bg-[#B2CFCE]/60 dark:bg-[#16302F]/40',
                          )}
                          style={{ height: `${Math.max(pct * 100, 6)}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Avg transaction */}
              {avgTxValue > 0 && (
                <div className={ROW_CLASS}>
                  <div className="w-7 h-7 rounded-lg bg-[#16302F]/10 dark:bg-[#B2CFCE]/10 flex items-center justify-center flex-shrink-0 text-[#16302F]/60 dark:text-[#B2CFCE]/50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#16302F] dark:text-white/90 leading-tight">Avg per transaction</p>
                    <p className="text-[11px] text-[#16302F]/40 dark:text-[#B2CFCE]/35 mt-0.5">expenses only</p>
                  </div>
                  <span className="text-sm font-bold text-[#16302F] dark:text-white tabular-nums flex-shrink-0">
                    {formatAmount(avgTxValue)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tag breakdown — expandable */}
      {tagBreakdown.length > 0 && (
        <div>
          <SectionHeader
            label="Spending by tag"
            accent="bg-gradient-to-b from-[#3B7A78] to-[#3B7A78]/40"
            expandable
            expanded={expandedSections['tags']}
            onToggle={() => toggle('tags')}
          />
          {expandedSections['tags'] && (
            <div className="flex flex-col gap-1.5">
              {tagBreakdown.map(([tagKey, amount]) => {
                const tag = allTags[tagKey];
                const pct = totalExpense > 0 ? amount / totalExpense : 0;
                return (
                  <div key={tagKey} className="flex flex-col gap-1 px-3 py-2 rounded-xl bg-[#F7FAF9] dark:bg-[#16302F]/10 border border-[#B2CFCE]/50 dark:border-[#3B7A78]/[0.07]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {tag && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                        )}
                        <span className="text-xs font-semibold text-[#16302F] dark:text-white/90 truncate">
                          {tag?.label ?? tagKey}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-[#16302F]/40 dark:text-[#B2CFCE]/30">{Math.round(pct * 100)}%</span>
                        <span className="text-xs font-bold text-red-500 dark:text-red-400 tabular-nums">−{formatAmount(amount)}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-[#B2CFCE]/50 dark:bg-[#16302F]/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct * 100}%`, backgroundColor: tag?.color ?? '#3B7A78' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming — next 7 days */}
      {upcoming.length > 0 && (
        <div>
          <SectionHeader
            label="Next 7 days"
            accent="bg-gradient-to-b from-[#16302F] to-[#3B7A78]"
            expandable
            expanded={expandedSections['upcoming'] ?? true}
            onToggle={() => toggle('upcoming')}
          />
          {(expandedSections['upcoming'] ?? true) && (
            <div className="flex flex-col gap-1.5">
              {upcoming.map(({ tx, date }) => (
                <div key={tx.id} className={ROW_CLASS}>
                  <div className={cn(
                    'w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[1.5rem]',
                    tx.category === 'income' ? 'bg-[#3B7A78]' : 'bg-red-400',
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#16302F] dark:text-white/90 truncate font-medium leading-tight">{tx.name}</p>
                    <p className="text-[11px] text-[#16302F]/40 dark:text-[#B2CFCE]/35 mt-0.5 leading-tight">
                      {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={cn(
                    'text-sm font-bold tabular-nums flex-shrink-0',
                    tx.category === 'income' ? 'text-[#3B7A78]' : 'text-red-500 dark:text-red-400',
                  )}>
                    {tx.category === 'income' ? '+' : '−'}{formatAmount(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Biggest expenses — expandable */}
      {topExpenses.length > 0 && (
        <div>
          <SectionHeader
            label="Biggest expenses"
            accent="bg-gradient-to-b from-red-400 to-rose-500"
            expandable
            expanded={expandedSections['expenses'] ?? true}
            onToggle={() => toggle('expenses')}
          />
          {(expandedSections['expenses'] ?? true) && (
            <div className="flex flex-col gap-1.5">
              {topExpenses.map((tx) => (
                <div key={tx.id} className={ROW_CLASS}>
                  <div className="w-[3px] self-stretch rounded-full bg-red-400 flex-shrink-0 min-h-[1.5rem]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#16302F] dark:text-white/90 truncate font-medium leading-tight">{tx.name}</p>
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
          )}
        </div>
      )}

      {/* Recurring items — expandable */}
      {recurringItems.length > 0 && (
        <div>
          <SectionHeader
            label="Recurring this month"
            accent="bg-gradient-to-b from-[#3B7A78] to-[#5FAF6B]"
            expandable
            expanded={expandedSections['recurring']}
            onToggle={() => toggle('recurring')}
          />
          {expandedSections['recurring'] && (
            <div className="flex flex-col gap-1.5">
              {recurringItems.map((tx) => (
                <div key={tx.transaction_id} className={ROW_CLASS}>
                  <div className={cn(
                    'w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[1.5rem]',
                    tx.category === 'income' ? 'bg-[#3B7A78]' : 'bg-[#16302F]/40 dark:bg-[#B2CFCE]/30',
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#16302F] dark:text-white/90 truncate font-medium leading-tight">{tx.name}</p>
                    {tx.frequency && (
                      <p className="text-[11px] text-[#16302F]/40 dark:text-[#B2CFCE]/35 mt-0.5 leading-tight">{FREQUENCIES[tx.frequency]}</p>
                    )}
                  </div>
                  <span className={cn(
                    'text-sm font-bold tabular-nums flex-shrink-0',
                    tx.category === 'income' ? 'text-[#3B7A78]' : 'text-red-500 dark:text-red-400',
                  )}>
                    {tx.category === 'income' ? '+' : '−'}{formatAmount(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Savings Goals */}
      {goals.length > 0 && (
        <div>
          <SectionHeader
            label="Savings goals"
            accent="bg-gradient-to-b from-[#3B7A78] to-[#5FAF6B]"
            expandable
            expanded={expandedSections['goals'] ?? true}
            onToggle={() => toggle('goals')}
          />
          {(expandedSections['goals'] ?? true) && (
            <div className="flex flex-col gap-2">
              {goals.map((goal) => {
                // If a tag is linked, compute saved amount from one-off expense transactions with that tag.
                // Savings are modelled as expenses — money leaving your spending balance into a pot.
                // Recurring transactions are excluded — we can't reliably sum their occurrences from the raw row.
                const linkedTxs = goal.linkedTagId
                  ? rawTransactions.filter((tx) => tx.type === 'one_off' && tx.category === 'expense' && tx.tag === goal.linkedTagId)
                  : [];
                const savedAmount = goal.linkedTagId
                  ? linkedTxs.reduce((sum, tx) => sum + Number(tx.amount), 0)
                  : goal.currentSaved;

                const pct = goal.targetAmount > 0 ? Math.min(savedAmount / goal.targetAmount, 1) : 0;
                const linkedTag = goal.linkedTagId ? allTags[goal.linkedTagId] : null;
                const daysLeft = goal.deadline
                  ? Math.max(0, Math.ceil((new Date(goal.deadline + 'T12:00:00').getTime() - Date.now()) / 86_400_000))
                  : null;

                // Savings rate countdown (only for linked-tag goals without a deadline)
                let savingsCountdown: string | null = null;
                if (goal.linkedTagId && !goal.deadline && savedAmount < goal.targetAmount && linkedTxs.length >= 2) {
                  const dates = linkedTxs.map((tx) => new Date(tx.date ?? tx.created_at).getTime()).sort((a, b) => a - b);
                  const daysSinceFirst = Math.max(1, (Date.now() - dates[0]) / 86_400_000);
                  const dailyRate = savedAmount / daysSinceFirst;
                  if (dailyRate > 0) {
                    const daysToGoal = Math.ceil((goal.targetAmount - savedAmount) / dailyRate);
                    savingsCountdown = daysToGoal > 60
                      ? `~${Math.ceil(daysToGoal / 30)}mo to goal`
                      : `~${daysToGoal}d to goal`;
                  }
                }
                return (
                  <div key={goal.id} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl bg-[#F7FAF9] dark:bg-[#16302F]/10 border border-[#B2CFCE]/50 dark:border-[#3B7A78]/[0.07]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {linkedTag && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: linkedTag.color }} />
                        )}
                        <p className="text-sm font-medium text-[#16302F] dark:text-white/90 truncate">{goal.name}</p>
                      </div>
                      <span className={cn(
                        'text-xs font-semibold tabular-nums flex-shrink-0',
                        pct >= 1 ? 'text-[#3B7A78]' : 'text-[#16302F]/50 dark:text-[#B2CFCE]/40',
                      )}>
                        {Math.round(pct * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#B2CFCE]/50 dark:bg-[#16302F]/40 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', pct >= 1 ? 'bg-[#3B7A78]' : 'bg-gradient-to-r from-[#3B7A78] to-[#5FAF6B]')}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#16302F]/40 dark:text-[#B2CFCE]/35">
                        {formatAmount(savedAmount)} / {formatAmount(goal.targetAmount)}
                      </span>
                      {daysLeft !== null ? (
                        <span className="text-[11px] text-[#16302F]/40 dark:text-[#B2CFCE]/35">
                          {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                        </span>
                      ) : savingsCountdown ? (
                        <span className="text-[11px] text-[#3B7A78] dark:text-[#3B7A78]/70 font-medium">{savingsCountdown}</span>
                      ) : linkedTag ? (
                        <span className="text-[10px] text-[#16302F]/30 dark:text-[#B2CFCE]/25 italic">auto</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isEmpty && (
        <div className="py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-[#B2CFCE]/40 dark:bg-[#16302F]/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-[#16302F]/30 dark:text-[#B2CFCE]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#16302F]/35 dark:text-[#B2CFCE]/25">No transactions this month</p>
        </div>
      )}
    </div>
  );
}
