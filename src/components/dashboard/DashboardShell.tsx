'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useBalances } from '@/hooks/useBalances';
import { useCurrency } from '@/hooks/useCurrency';
import { useCreateTransaction, useTransactions } from '@/hooks/useTransactions';
import { CalendarView } from './CalendarView';
import { DayBottomSheet } from './DayBottomSheet';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';
import { MonthSummary } from './MonthSummary';
import { CurrencySelector } from './CurrencySelector';
import { AdjustBalanceButton } from './AdjustBalanceButton';
import { ResetAllButton } from './ResetAllButton';
import { BudgetLimitButton } from './BudgetLimitButton';
import { ExportButton } from './ExportButton';
import { ThemeToggle } from './ThemeToggle';
import { LogoutButton } from './LogoutButton';
import { HeaderOverflowMenu } from './HeaderOverflowMenu';
import { useBudgetLimit } from '@/hooks/useBudgetLimit';
import { useSettings } from '@/hooks/useSettings';
import { OnboardingTip } from './OnboardingTip';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton } from '@/components/layout/NavSidebar';
import { cn } from '@/lib/utils';
import type { DayTransaction, TransactionFormValues } from '@/types';

// ─── Month stats ──────────────────────────────────────────────────────────────

function useMonthStats(
  balances: Map<string, number>,
  dayTransactions: Map<string, DayTransaction[]>,
  month: Date,
) {
  return useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayBalance = balances.get(today) ?? 0;
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    let monthIncome = 0;
    let monthExpense = 0;
    dayTransactions.forEach((txs, date) => {
      if (date < start || date > end) return;
      for (const tx of txs) {
        if (tx.category === 'income') monthIncome += tx.amount;
        else monthExpense += tx.amount;
      }
    });
    return { todayBalance, monthIncome, monthExpense, monthNet: monthIncome - monthExpense };
  }, [balances, dayTransactions, month]);
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent, progress, bar }: {
  label: string;
  value: string;
  accent?: 'green' | 'red' | 'default';
  progress?: number;
  bar: string;
}) {
  const clampedPct = progress !== undefined ? Math.min(progress, 1) * 100 : undefined;
  const progressDanger = progress !== undefined && progress >= 0.85;
  return (
    <div className="relative flex flex-col gap-1 px-2.5 py-2.5 sm:px-3 sm:py-3 rounded-xl sm:rounded-2xl overflow-hidden min-w-0
      bg-white border border-slate-100 shadow-[0_1px_6px_rgba(0,0,0,0.05)]
      dark:bg-[#0d1629] dark:border-white/[0.06] dark:shadow-none">
      {/* Coloured top accent bar */}
      <div className={cn('absolute top-0 inset-x-0 h-[3px]', bar)} />
      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 truncate mt-0.5">
        {label}
      </span>
      <span className={cn(
        'font-bold tabular-nums tracking-tight leading-none text-sm sm:text-xl truncate',
        accent === 'green' && 'text-emerald-600 dark:text-emerald-400',
        accent === 'red' && 'text-rose-500 dark:text-rose-400',
        (!accent || accent === 'default') && 'text-slate-900 dark:text-white',
      )}>
        {value}
      </span>
      {clampedPct !== undefined && (
        <div className="mt-0.5 h-1 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', progressDanger ? 'bg-rose-400' : 'bg-emerald-400')}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function DashboardShell() {
  const { balances, dayTransactions, isLoading } = useBalances();
  const { data: txData } = useTransactions();
  const isEmpty = !isLoading && (txData?.transactions.length ?? 0) === 0;

  // Onboarding tour: step 0 = tap a day, step 1 = tap add button
  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 'done'>(() => {
    try { return localStorage.getItem('bt_onboarding') === 'done' ? 'done' : 0; } catch { return 0; }
  });

  // Advance 0 → 1 when a day is selected
  useEffect(() => {
    if (isEmpty && selectedDate && onboardingStep === 0) setOnboardingStep(1);
  }, [isEmpty, selectedDate, onboardingStep]);

  // Reset back to 0 if day panel closes before adding
  useEffect(() => {
    if (!selectedDate && onboardingStep === 1) setOnboardingStep(0);
  }, [selectedDate, onboardingStep]);

  // Mark done when a transaction is created
  useEffect(() => {
    if (!isEmpty && onboardingStep !== 'done') {
      setOnboardingStep('done');
      try { localStorage.setItem('bt_onboarding', 'done'); } catch {}
    }
  }, [isEmpty, onboardingStep]);
  const { currency, setCurrency, formatAmount, symbol } = useCurrency();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const create = useCreateTransaction();

  const { todayBalance, monthIncome, monthExpense, monthNet } = useMonthStats(
    balances, dayTransactions, visibleMonth,
  );
  const { limit: budgetLimit, setLimit: setBudgetLimit } = useBudgetLimit(visibleMonth);
  const { firstDayOfWeek } = useSettings();
  const budgetProgress = budgetLimit ? monthExpense / budgetLimit : undefined;

  const handleDateClick = useCallback((date: string) => { setSelectedDate(date); setIsAdding(false); }, []);
  const handleClose = useCallback(() => { setSelectedDate(null); setIsAdding(false); }, []);
  const handleAddNew = useCallback(() => setIsAdding(true), []);
  const handleCancelAdd = useCallback(() => setIsAdding(false), []);
  const handleOnboardingAdd = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setSelectedDate(today);
    setIsAdding(true);
  }, []);

  const selectedBalance = selectedDate ? (balances.get(selectedDate) ?? 0) : 0;
  const selectedTransactions: DayTransaction[] = selectedDate ? (dayTransactions.get(selectedDate) ?? []) : [];

  return (
    <AppLayout>
    <div className="min-h-screen bg-[#edf1f9] dark:bg-[#050911]">

      {/* Ambient top glow */}
      <div className="fixed top-0 inset-x-0 h-[480px] bg-gradient-to-b from-indigo-100/60 via-violet-50/20 to-transparent dark:from-indigo-950/25 dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#050911]/85 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/[0.05] shadow-[0_1px_0_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        {/* Gradient accent line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 dark:via-indigo-400/40 to-transparent" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">

          {/* Hamburger — mobile only */}
          <NavMenuButton />

          {/* Page title — desktop only */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isLoading && (
              <div className="w-4 h-4 rounded-full border-2 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-500 dark:border-t-indigo-400 animate-spin" />
            )}
            <BudgetLimitButton limit={budgetLimit} monthExpense={monthExpense} formatAmount={formatAmount} symbol={symbol} onSetLimit={setBudgetLimit} />
            <AdjustBalanceButton todayBalance={todayBalance} formatAmount={formatAmount} symbol={symbol} />
            <div className="hidden sm:flex items-center gap-1.5">
              <ExportButton />
              <ResetAllButton />
              <ThemeToggle />
              <CurrencySelector value={currency} onChange={setCurrency} />
            </div>
            <HeaderOverflowMenu currency={currency} onCurrencyChange={setCurrency} />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* ── Two-column layout ────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto flex gap-5 px-4 sm:px-6 py-5 items-start">

        {/* Left: stats + calendar */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <StatCard
              bar="bg-gradient-to-r from-violet-500 to-indigo-500"
              label="Balance Today"
              value={formatAmount(todayBalance)}
              accent={todayBalance > 0 ? 'green' : todayBalance < 0 ? 'red' : 'default'}
            />
            <StatCard
              bar="bg-gradient-to-r from-emerald-400 to-teal-500"
              label={`${format(visibleMonth, 'MMM')} Income`}
              value={formatAmount(monthIncome)}
              accent="green"
            />
            <StatCard
              bar="bg-gradient-to-r from-rose-500 to-red-500"
              label={budgetLimit ? `${format(visibleMonth, 'MMM')} Spend / Budget` : `${format(visibleMonth, 'MMM')} Expenses`}
              value={budgetLimit ? `${formatAmount(monthExpense)} / ${formatAmount(budgetLimit)}` : formatAmount(monthExpense)}
              accent="red"
              progress={budgetProgress}
            />
            <StatCard
              bar={monthNet >= 0 ? 'bg-gradient-to-r from-sky-400 to-cyan-500' : 'bg-gradient-to-r from-rose-500 to-red-500'}
              label={`${format(visibleMonth, 'MMM')} Net`}
              value={(monthNet >= 0 ? '+' : '') + formatAmount(monthNet)}
              accent={monthNet > 0 ? 'green' : monthNet < 0 ? 'red' : 'default'}
            />
          </div>

          {/* Calendar */}
          {isLoading && balances.size === 0 ? (
            <div className="animate-pulse rounded-3xl bg-white dark:bg-[#0d1629] p-5 space-y-3">
              <div className="h-5 bg-slate-100 dark:bg-white/5 rounded-lg w-36" />
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-[90px] sm:h-[110px] bg-slate-100 dark:bg-white/5 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="rounded-3xl overflow-hidden
                bg-white border border-slate-100 shadow-[0_2px_24px_rgba(0,0,0,0.06)]
                dark:bg-[#0d1629] dark:border-white/[0.05] dark:shadow-[0_4px_40px_rgba(0,0,0,0.5)]">
                <CalendarView
                  balances={balances}
                  dayTransactions={dayTransactions}
                  selectedDate={selectedDate}
                  onDateClick={handleDateClick}
                  formatAmount={formatAmount}
                  isLoading={isLoading}
                  onMonthChange={setVisibleMonth}
                  firstDayOfWeek={firstDayOfWeek}
                />
              </div>
              {/* Step 0 tip — tap a day */}
              {isEmpty && onboardingStep === 0 && (
                <div className="absolute inset-x-0 top-[4.5rem] flex justify-center pointer-events-none z-10">
                  <OnboardingTip arrow="top">
                    Tap any day on the calendar to open it
                  </OnboardingTip>
                </div>
              )}
            </div>
          )}

          {/* Month summary — mobile only */}
          <div className="lg:hidden rounded-3xl overflow-hidden
            bg-white border border-slate-100 shadow-[0_2px_24px_rgba(0,0,0,0.06)]
            dark:bg-[#0d1629] dark:border-white/[0.05] dark:shadow-[0_4px_40px_rgba(0,0,0,0.5)]">
            <MonthSummary month={visibleMonth} dayTransactions={dayTransactions} formatAmount={formatAmount} />
          </div>
        </div>

        {/* Right panel — desktop */}
        <aside className={cn(
          'hidden lg:flex flex-col w-[340px] xl:w-[380px] flex-shrink-0',
          'sticky top-[88px] sm:top-[96px] max-h-[calc(100vh-88px-20px)] sm:max-h-[calc(100vh-96px-20px)]',
          'rounded-3xl overflow-hidden',
          'bg-white border border-slate-100 shadow-[0_2px_24px_rgba(0,0,0,0.06)]',
          'dark:bg-[#0d1629] dark:border-white/[0.05] dark:shadow-[0_4px_40px_rgba(0,0,0,0.5)]',
        )}>
          {selectedDate ? (
            <>
              {/* Day panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex-shrink-0
                bg-gradient-to-r from-white to-slate-50/60 dark:from-[#0d1629] dark:to-[#0d1629]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-0.5">
                    Selected day
                  </p>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-all"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {create.isError && (
                <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 text-sm text-rose-700 dark:text-rose-400 flex-shrink-0">
                  Failed to save: {(create.error as Error)?.message ?? 'Unknown error'}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {isAdding ? (
                  <TransactionForm
                    defaultDate={selectedDate}
                    symbol={symbol}
                    onCancel={handleCancelAdd}
                    isLoading={create.isPending}
                    onSubmit={(values: TransactionFormValues) => {
                      create.reset();
                      create.mutate(values, { onSuccess: handleCancelAdd });
                    }}
                  />
                ) : (
                  <TransactionList
                    date={selectedDate}
                    transactions={selectedTransactions}
                    balance={selectedBalance}
                    formatAmount={formatAmount}
                    symbol={symbol}
                    onAddNew={handleAddNew}
                    showTip={isEmpty && onboardingStep === 1}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <MonthSummary month={visibleMonth} dayTransactions={dayTransactions} formatAmount={formatAmount} />
            </div>
          )}
        </aside>
      </div>

      {/* Mobile bottom sheet */}
      <DayBottomSheet
        date={selectedDate}
        transactions={selectedTransactions}
        balance={selectedBalance}
        formatAmount={formatAmount}
        symbol={symbol}
        isAdding={isAdding}
        onAddNew={handleAddNew}
        onCancelAdd={handleCancelAdd}
        onClose={handleClose}
        showTip={isEmpty && onboardingStep === 1}
      />
    </div>
    </AppLayout>
  );
}
