'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
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
import { TourSpotlight } from './TourSpotlight';
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

function StatCard({ label, value, accent, progress, icon, hero }: {
  label: string;
  value: string;
  accent?: 'green' | 'red' | 'gold' | 'default';
  progress?: number;
  icon: React.ReactNode;
  hero?: boolean;
}) {
  const clampedPct = progress !== undefined ? Math.min(progress, 1) * 100 : undefined;
  const progressDanger = progress !== undefined && progress >= 0.85;

  if (hero) {
    return (
      <div className="relative flex items-center gap-2 sm:gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl overflow-hidden min-w-0
        bg-gradient-to-br from-[#1a5099] to-[#1a4080]
        shadow-[0_2px_12px_rgba(26,80,153,0.35)]
        border border-white/[0.12]">
        {/* Left accent bar */}
        <div className="absolute left-0 inset-y-0 w-[3px] bg-gradient-to-b from-[#F7D56E] to-[#F7D56E]/40 rounded-r-full" />
        {/* Icon */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F7D56E]/10 flex items-center justify-center flex-shrink-0 text-[#F7D56E] ml-1">
          {icon}
        </div>
        {/* Text */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#D1E3EE]/45 truncate leading-none mb-0.5">
            {label}
          </span>
          <span className={cn(
            'font-black tabular-nums tracking-tight leading-none text-sm sm:text-base truncate',
            accent === 'green' && 'text-[#9FEA86]',
            accent === 'red' && 'text-rose-300',
            (!accent || accent === 'default' || accent === 'gold') && 'text-[#F7D56E]',
          )}>
            {value}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2 sm:gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl overflow-hidden min-w-0
      bg-white border border-[#D1E3EE]/60
      shadow-[0_1px_6px_rgba(21,66,101,0.06)]
      dark:bg-[#0a1e38] dark:border-[#154265]/40 dark:shadow-[0_1px_8px_rgba(4,13,26,0.4)]">
      {/* Left accent bar */}
      <div className={cn('absolute left-0 inset-y-0 w-[3px] rounded-r-full',
        accent === 'green' && 'bg-gradient-to-b from-[#1ECB6C] to-[#9FEA86]',
        accent === 'red' && 'bg-gradient-to-b from-red-500 to-rose-400',
        accent === 'gold' && 'bg-gradient-to-b from-[#F7D56E] to-[#F7D56E]/50',
        (!accent || accent === 'default') && 'bg-gradient-to-b from-[#D1E3EE] to-[#D1E3EE]/30 dark:from-[#154265]',
      )} />
      {/* Icon */}
      <div className={cn(
        'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-1',
        accent === 'green' && 'bg-[#1ECB6C]/10 dark:bg-[#1ECB6C]/15 text-[#1ECB6C]',
        accent === 'red' && 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400',
        accent === 'gold' && 'bg-[#F7D56E]/10 text-[#F7D56E]',
        (!accent || accent === 'default') && 'bg-[#D1E3EE]/50 dark:bg-[#154265]/40 text-[#154265]/60 dark:text-[#D1E3EE]/50',
      )}>
        {icon}
      </div>
      {/* Text */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#154265]/45 dark:text-[#D1E3EE]/30 truncate leading-none mb-0.5">
          {label}
        </span>
        <span className={cn(
          'font-black tabular-nums tracking-tight leading-none text-sm sm:text-base truncate',
          accent === 'green' && 'text-[#1ECB6C]',
          accent === 'red' && 'text-red-600 dark:text-red-400',
          accent === 'gold' && 'text-[#154265] dark:text-[#F7D56E]',
          (!accent || accent === 'default') && 'text-[#154265] dark:text-white',
        )}>
          {value}
        </span>
        {clampedPct !== undefined && (
          <div className="mt-1 h-1 rounded-full bg-[#D1E3EE]/60 dark:bg-[#154265]/40 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                progressDanger
                  ? 'bg-gradient-to-r from-red-400 to-rose-500'
                  : 'bg-gradient-to-r from-[#1ECB6C] to-[#9FEA86]',
              )}
              style={{ width: `${clampedPct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function DashboardShell() {
  const { balances, dayTransactions, isLoading } = useBalances();
  const { data: txData } = useTransactions();
  const isEmpty = !isLoading && (txData?.transactions.length ?? 0) === 0;

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

  // Warn when balance is predicted to go negative within the next 7 days
  const runningLowDate = useMemo(() => {
    const isCurrentMonth = format(visibleMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
    if (!isCurrentMonth || balances.size === 0) return null;
    for (let i = 1; i <= 7; i++) {
      const d = format(addDays(new Date(), i), 'yyyy-MM-dd');
      const bal = balances.get(d);
      if (bal !== undefined && bal < 0) return { date: d, balance: bal };
    }
    return null;
  }, [balances, visibleMonth]);

  // Onboarding tour: 0=tap day, 1=tap add, 2-5=spotlight tour, done=finished
  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 'done'>(() => {
    try { return localStorage.getItem('bt_onboarding') === 'done' ? 'done' : 0; } catch { return 0; }
  });

  const advanceTour = useCallback(() => {
    setOnboardingStep((s) => {
      if (s === 2) return 3;
      if (s === 3) return 4;
      if (s === 4) return 5;
      return s;
    });
  }, []);

  const finishTour = useCallback(() => {
    setOnboardingStep('done');
    try { localStorage.setItem('bt_onboarding', 'done'); } catch {}
  }, []);

  // Advance 0 → 1 when a day is selected
  useEffect(() => {
    if (isEmpty && selectedDate && onboardingStep === 0) setOnboardingStep(1);
  }, [isEmpty, selectedDate, onboardingStep]);

  // Reset back to 0 if day panel closes before adding
  useEffect(() => {
    if (!selectedDate && onboardingStep === 1) setOnboardingStep(0);
  }, [selectedDate, onboardingStep]);

  // Transition step 1 → spotlight tour when first transaction is saved
  useEffect(() => {
    if (!isEmpty && onboardingStep === 1) {
      setOnboardingStep(2);
    }
  }, [isEmpty, onboardingStep]);

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
    <div className="min-h-screen bg-[#f0f5fa] dark:bg-[#040d1a]">

      {/* Ambient glow */}
      <div className="fixed top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#D1E3EE]/40 to-transparent dark:from-[#154265]/15 dark:to-transparent pointer-events-none -z-10" />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20
        bg-white/95 dark:bg-[#040d1a]/95
        backdrop-blur-2xl
        border-b border-[#D1E3EE]/70 dark:border-[#1ECB6C]/[0.08]
        shadow-[0_1px_0_rgba(21,66,101,0.06),0_4px_16px_rgba(21,66,101,0.04)]
        dark:shadow-[0_1px_0_rgba(30,203,108,0.06)]">
        {/* Accent line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1ECB6C]/40 to-transparent" />

        <div className="px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-3">

          {/* Hamburger — mobile only */}
          <NavMenuButton />

          {/* Page title — desktop only */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl font-extrabold text-[#154265] dark:text-white tracking-tight">Dashboard</h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isLoading && (
              <div className="w-4 h-4 rounded-full border-2 border-[#D1E3EE] dark:border-[#154265]/50 border-t-[#154265] dark:border-t-[#1ECB6C] animate-spin" />
            )}
            <div id="tour-budget"><BudgetLimitButton limit={budgetLimit} monthExpense={monthExpense} formatAmount={formatAmount} symbol={symbol} onSetLimit={setBudgetLimit} /></div>
            <div id="tour-adjust"><AdjustBalanceButton todayBalance={todayBalance} formatAmount={formatAmount} symbol={symbol} /></div>
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
      <div className="flex gap-4 px-3 sm:px-5 py-3 sm:py-4 items-start">

        {/* Left: stats + calendar */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Stats row */}
          <div id="tour-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {/* Balance Today — hero card */}
            <StatCard
              hero
              label="Balance Today"
              value={formatAmount(todayBalance)}
              accent={todayBalance > 0 ? 'green' : todayBalance < 0 ? 'red' : 'gold'}
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
            <StatCard
              label={`${format(visibleMonth, 'MMM')} Income`}
              value={formatAmount(monthIncome)}
              accent="green"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              }
            />
            <StatCard
              label={budgetLimit ? `${format(visibleMonth, 'MMM')} Spend / Budget` : `${format(visibleMonth, 'MMM')} Expenses`}
              value={budgetLimit ? `${formatAmount(monthExpense)} / ${formatAmount(budgetLimit)}` : formatAmount(monthExpense)}
              accent="red"
              progress={budgetProgress}
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              }
            />
            <StatCard
              label={`${format(visibleMonth, 'MMM')} Net`}
              value={(monthNet >= 0 ? '+' : '') + formatAmount(monthNet)}
              accent={monthNet > 0 ? 'green' : monthNet < 0 ? 'red' : 'default'}
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          {/* Running-low warning */}
          {runningLowDate && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl
              bg-amber-50 border border-amber-200 shadow-[0_1px_6px_rgba(245,158,11,0.1)]
              dark:bg-amber-950/40 dark:border-amber-500/30 dark:shadow-[0_1px_8px_rgba(245,158,11,0.08)]">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 text-amber-500 dark:text-amber-400 mt-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 leading-tight">
                  Balance goes negative soon
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                  On {new Date(runningLowDate.date + 'T12:00:00').toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })}, predicted balance:{' '}
                  <span className="font-semibold">{formatAmount(runningLowDate.balance)}</span>
                </p>
              </div>
            </div>
          )}

          {/* Calendar */}
          {isLoading && balances.size === 0 ? (
            <div className="animate-pulse rounded-3xl bg-white dark:bg-[#0a1e38] p-5 space-y-3 border border-[#D1E3EE]/60 dark:border-[#154265]/30">
              <div className="h-5 bg-[#D1E3EE]/60 dark:bg-[#154265]/30 rounded-lg w-36" />
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-[90px] sm:h-[110px] bg-[#D1E3EE]/40 dark:bg-[#154265]/20 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="rounded-3xl overflow-hidden
                bg-white border border-[#D1E3EE]/60 shadow-[0_2px_20px_rgba(21,66,101,0.08)]
                dark:bg-[#0a1e38] dark:border-[#1ECB6C]/[0.08] dark:shadow-[0_4px_30px_rgba(4,13,26,0.5)]">
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
            bg-white border border-[#D1E3EE]/60 shadow-[0_2px_20px_rgba(21,66,101,0.08)]
            dark:bg-[#0a1e38] dark:border-[#1ECB6C]/[0.08] dark:shadow-[0_4px_30px_rgba(4,13,26,0.5)]">
            <MonthSummary month={visibleMonth} dayTransactions={dayTransactions} formatAmount={formatAmount} />
          </div>
        </div>

        {/* Right panel — desktop */}
        <aside className={cn(
          'hidden lg:flex flex-col w-[340px] xl:w-[380px] flex-shrink-0',
          'sticky top-[56px] max-h-[calc(100vh-56px-16px)]',
          'rounded-3xl overflow-hidden',
          'bg-white border border-[#D1E3EE]/60 shadow-[0_2px_20px_rgba(21,66,101,0.08)]',
          'dark:bg-[#0a1e38] dark:border-[#1ECB6C]/[0.08] dark:shadow-[0_4px_30px_rgba(4,13,26,0.5)]',
        )}>
          {selectedDate ? (
            <>
              {/* Day panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#D1E3EE]/50 dark:border-[#1ECB6C]/[0.08] flex-shrink-0
                bg-gradient-to-r from-white to-[#D1E3EE]/10 dark:from-[#0a1e38] dark:to-[#0a1e38]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#154265]/40 dark:text-[#D1E3EE]/30 mb-0.5">
                    Selected day
                  </p>
                  <h2 className="text-base font-bold text-[#154265] dark:text-white tracking-tight">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-[#D1E3EE]/40 dark:hover:bg-[#154265]/40 text-[#154265]/40 dark:text-[#D1E3EE]/30 hover:text-[#154265] dark:hover:text-white transition-all"
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

      {/* Spotlight tour — steps 2-5 */}
      {typeof onboardingStep === 'number' && onboardingStep >= 2 && (
        <TourSpotlight step={onboardingStep as 2 | 3 | 4 | 5} onNext={advanceTour} onDone={finishTour} />
      )}

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
