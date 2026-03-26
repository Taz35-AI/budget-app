'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useBalances } from '@/hooks/useBalances';
import { useSettings } from '@/hooks/useSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton } from '@/components/layout/NavSidebar';
import { cn } from '@/lib/utils';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthData {
  income: number;
  expense: number;
  tags: Record<string, number>;
}

export function ReportsShell() {
  const { dayTransactions, isLoading } = useBalances();
  const { allTags } = useSettings();
  const { formatAmount } = useCurrency();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth());

  // Aggregate into monthly buckets for the selected year
  const yearlyData = useMemo<MonthData[]>(() => {
    const months: MonthData[] = Array.from({ length: 12 }, () => ({
      income: 0,
      expense: 0,
      tags: {},
    }));
    for (const [date, txs] of dayTransactions) {
      if (Number(date.slice(0, 4)) !== selectedYear) continue;
      const monthIdx = Number(date.slice(5, 7)) - 1;
      for (const tx of txs) {
        if (tx.category === 'income') {
          months[monthIdx].income += tx.amount;
        } else {
          months[monthIdx].expense += tx.amount;
          const key = tx.tag ?? '__untagged__';
          months[monthIdx].tags[key] = (months[monthIdx].tags[key] ?? 0) + tx.amount;
        }
      }
    }
    return months;
  }, [dayTransactions, selectedYear]);

  const maxMonthlyValue = useMemo(
    () => Math.max(...yearlyData.map((m) => Math.max(m.income, m.expense)), 1),
    [yearlyData],
  );

  const selectedData = yearlyData[selectedMonthIdx];
  const netForMonth = selectedData.income - selectedData.expense;

  const yearTotals = useMemo(() => ({
    totalIncome: yearlyData.reduce((s, m) => s + m.income, 0),
    totalExpense: yearlyData.reduce((s, m) => s + m.expense, 0),
    net: yearlyData.reduce((s, m) => s + m.income - m.expense, 0),
  }), [yearlyData]);

  const tagBreakdown = useMemo(() =>
    Object.entries(selectedData.tags)
      .sort((a, b) => b[1] - a[1])
      .map(([tagKey, amount]) => ({
        tagKey,
        amount,
        label: tagKey === '__untagged__' ? 'Untagged' : (allTags[tagKey]?.label ?? tagKey),
        color: tagKey === '__untagged__' ? '#6b7280' : (allTags[tagKey]?.color ?? '#6b7280'),
      })),
    [selectedData.tags, allTags],
  );

  const maxTagAmount = tagBreakdown.length > 0 ? tagBreakdown[0].amount : 1;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#edf1f9] dark:bg-[#050911]">
        {/* Ambient glow */}
        <div className="fixed top-0 inset-x-0 h-[480px] bg-gradient-to-b from-emerald-100/50 via-teal-50/20 to-transparent dark:from-emerald-950/20 dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#050911]/85 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/[0.05]">
          <div className="px-4 sm:px-6 h-12 sm:h-14 flex items-center gap-3">
            <NavMenuButton />
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Reports</h1>
            {/* Year selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-bold text-slate-800 dark:text-white w-11 text-center">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                disabled={selectedYear >= currentYear + 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-6 flex flex-col gap-5 max-w-4xl">
          {/* Year summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'Income', value: yearTotals.totalIncome, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Expenses', value: yearTotals.totalExpense, color: 'text-red-500 dark:text-red-400' },
              { label: 'Net Saved', value: yearTotals.net, color: yearTotals.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
            ] as const).map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/40 font-medium">{label}</p>
                <p className={cn('text-base sm:text-lg font-extrabold mt-1 tracking-tight', color)}>
                  {formatAmount(value, { compact: true })}
                </p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-4">Monthly Overview — click a month to inspect</p>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-[3px] sm:gap-1 h-40">
                  {yearlyData.map((month, idx) => {
                    const incomeH = Math.round((month.income / maxMonthlyValue) * 140);
                    const expenseH = Math.round((month.expense / maxMonthlyValue) * 140);
                    const isSelected = idx === selectedMonthIdx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedMonthIdx(idx)}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-0.5 cursor-pointer rounded-lg py-1 transition-all',
                          isSelected ? 'bg-slate-50 dark:bg-white/5 ring-1 ring-slate-200 dark:ring-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5',
                        )}
                      >
                        <div className="flex items-end gap-[2px] w-full justify-center" style={{ height: '140px' }}>
                          <div className="w-[40%] rounded-t-sm bg-emerald-400 dark:bg-emerald-500 transition-all duration-300" style={{ height: `${incomeH}px` }} />
                          <div className="w-[40%] rounded-t-sm bg-red-400 dark:bg-red-500 transition-all duration-300" style={{ height: `${expenseH}px` }} />
                        </div>
                        <span className={cn('text-[8px] sm:text-[9px] font-semibold mt-0.5', isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-white/30')}>
                          {MONTH_LABELS[idx]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    <span className="text-xs text-slate-500 dark:text-white/40">Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                    <span className="text-xs text-slate-500 dark:text-white/40">Expenses</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Selected month detail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Month summary */}
            <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-3">
                {MONTH_LABELS[selectedMonthIdx]} {selectedYear}
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-white/50">Income</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(selectedData.income)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-white/50">Expenses</span>
                  <span className="text-sm font-bold text-red-500 dark:text-red-400">{formatAmount(selectedData.expense)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700 dark:text-white/80">Net</span>
                  <span className={cn('text-sm font-extrabold', netForMonth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                    {netForMonth >= 0 ? '+' : ''}{formatAmount(netForMonth)}
                  </span>
                </div>
                {selectedData.income > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 dark:text-white/30">Savings rate</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-white/60">
                      {Math.max(0, Math.round((netForMonth / selectedData.income) * 100))}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tag breakdown */}
            <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-3">Spending by Category</p>
              {tagBreakdown.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-white/30 text-center py-4">No expenses this month</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {tagBreakdown.slice(0, 8).map(({ tagKey, amount, label, color }) => {
                    const pct = Math.round((amount / maxTagAmount) * 100);
                    const ofTotal = selectedData.expense > 0 ? Math.round((amount / selectedData.expense) * 100) : 0;
                    return (
                      <div key={tagKey}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs font-medium text-slate-700 dark:text-white/80">{label}</span>
                            <span className="text-[10px] text-slate-400 dark:text-white/30">{ofTotal}%</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-600 dark:text-white/60">{formatAmount(amount, { compact: true })}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
