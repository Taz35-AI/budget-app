'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { useBalances } from '@/hooks/useBalances';
import { useCurrency } from '@/hooks/useCurrency';
import { useCreateTransaction, useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { CalendarView } from './CalendarView';
import type { CalendarNavHandle } from './CalendarView';
import { DayBottomSheet } from './DayBottomSheet';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';
import { MonthSummary } from './MonthSummary';
import { AdjustBalanceButton } from './AdjustBalanceButton';
import { BudgetLimitButton } from './BudgetLimitButton';
import { CurrencySelector } from './CurrencySelector';
import { useBudgetLimit } from '@/hooks/useBudgetLimit';
import { useSettings } from '@/hooks/useSettings';
import { OnboardingTip } from './OnboardingTip';
import { TourSpotlight } from './TourSpotlight';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton, MobileLogo } from '@/components/layout/NavSidebar';
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


// ─── Shell ────────────────────────────────────────────────────────────────────

export function DashboardShell() {
  // ── Accounts ────────────────────────────────────────────────────────────────
  const { data: accounts } = useAccounts();
  const [activeAccountId, setActiveAccountId] = useState<string>('combined');

  // Once accounts load, default to the first account (not combined) if there's only one account
  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    if (activeAccountId === 'combined' && accounts.length === 1) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const calendarNavRef = useRef<CalendarNavHandle | null>(null);

  // ── Balances & transactions ──────────────────────────────────────────────────
  const { balances, dayTransactions, isLoading } = useBalances(activeAccountId);
  const { data: txData } = useTransactions();

  // isEmpty: true only when the active account has no transactions
  const isEmpty = !isLoading && (
    activeAccountId === 'combined'
      ? (txData?.transactions.length ?? 0) === 0
      : (txData?.transactions.filter((t) => t.account_id === activeAccountId).length ?? 0) === 0
  );

  const { currency, setCurrency, formatAmount, symbol } = useCurrency();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date());

  // Which account new transactions go to in the desktop panel
  const defaultCreateAccountId = activeAccountId !== 'combined' ? activeAccountId : (accounts?.[0]?.id);
  const [desktopFormAccountId, setDesktopFormAccountId] = useState<string | undefined>(defaultCreateAccountId);

  // Re-sync when active tab changes or when the add form opens
  useEffect(() => {
    setDesktopFormAccountId(activeAccountId !== 'combined' ? activeAccountId : accounts?.[0]?.id);
  }, [activeAccountId, accounts, isAdding]);

  const create = useCreateTransaction(desktopFormAccountId);

  const { todayBalance, monthIncome, monthExpense, monthNet } = useMonthStats(
    balances, dayTransactions, visibleMonth,
  );
  const { limit: budgetLimit, setLimit: setBudgetLimit } = useBudgetLimit(visibleMonth);
  const { firstDayOfWeek } = useSettings();
  const budgetProgress = budgetLimit ? monthExpense / budgetLimit : undefined;
  const clampedBudgetPct = budgetProgress !== undefined ? Math.min(budgetProgress, 1) * 100 : undefined;
  const budgetDanger = budgetProgress !== undefined && budgetProgress >= 0.85;

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
    <div className="min-h-screen bg-[#F7FAF9] dark:bg-[#0C1F1E]">

      {/* Ambient glow */}
      <div className="fixed top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#B2CFCE]/40 to-transparent dark:from-[#16302F]/15 dark:to-transparent pointer-events-none -z-10" />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20
        bg-white/95 dark:bg-[#0C1F1E]/95
        backdrop-blur-2xl
        border-b border-[#B2CFCE]/70 dark:border-[#3B7A78]/[0.08]
        shadow-[0_1px_0_rgba(22,48,47,0.06),0_4px_16px_rgba(22,48,47,0.04)]
        dark:shadow-[0_1px_0_rgba(59,122,120,0.06)]">
        {/* Accent line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3B7A78]/40 to-transparent" />

        <div className="px-4 sm:px-6 h-12 sm:h-14 flex items-center gap-3">

          {/* Hamburger — mobile only */}
          <NavMenuButton />
          <MobileLogo />

          {/* Page title — desktop only */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl font-extrabold text-[#16302F] dark:text-white tracking-tight">Dashboard</h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {isLoading && (
              <div className="w-4 h-4 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
            )}
            <CurrencySelector value={currency} onChange={setCurrency} />
            <div id="tour-budget"><BudgetLimitButton limit={budgetLimit} monthExpense={monthExpense} formatAmount={formatAmount} symbol={symbol} onSetLimit={setBudgetLimit} /></div>
            <div id="tour-adjust"><AdjustBalanceButton todayBalance={todayBalance} formatAmount={formatAmount} symbol={symbol} accountId={activeAccountId !== 'combined' ? activeAccountId : undefined} /></div>
          </div>
        </div>
      </header>

      {/* ── Two-column layout ────────────────────────────────────────── */}
      <div className="flex gap-4 px-3 sm:px-5 py-3 sm:py-4 items-start">

        {/* Left: stats + calendar */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Stats bar — typographic headline style */}
          <div id="tour-stats"
            className="bg-brand-card dark:bg-[#122928] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] overflow-hidden shadow-[0_1px_6px_rgba(22,48,47,0.05)] dark:shadow-none">

            {/* Desktop: single horizontal row */}
            <div className="hidden sm:flex divide-x divide-brand-primary/[0.08] dark:divide-brand-primary/[0.06]">

              {/* Balance Today — hero, wider */}
              <div className="flex-[1.6] px-5 py-3.5 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18">Balance Today</span>
                  <button
                    onClick={() => calendarNavRef.current?.today()}
                    className="text-[9px] font-semibold text-brand-primary/60 hover:text-brand-primary transition-colors px-1.5 py-0.5 rounded-md hover:bg-brand-primary/8 dark:hover:bg-brand-primary/10"
                  >
                    Today
                  </button>
                </div>
                <span className={cn(
                  'text-[1.75rem] font-black tabular-nums leading-none tracking-tight truncate block',
                  todayBalance > 0 ? 'text-brand-positive' : todayBalance < 0 ? 'text-brand-danger' : 'text-brand-text dark:text-white',
                )}>
                  {formatAmount(todayBalance)}
                </span>
              </div>

              {/* Income */}
              <div className="flex-1 px-4 py-3.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">{format(visibleMonth, 'MMM')} Income</span>
                <span className="text-xl font-black tabular-nums leading-none tracking-tight text-brand-positive truncate block">
                  {formatAmount(monthIncome)}
                </span>
              </div>

              {/* Expenses */}
              <div className="flex-1 px-4 py-3.5 min-w-0 relative">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">
                  {format(visibleMonth, 'MMM')} Expenses
                </span>
                <span className="text-xl font-black tabular-nums leading-none tracking-tight text-brand-danger truncate block">
                  {formatAmount(monthExpense)}
                </span>
                {budgetLimit && (
                  <span className="text-[9px] font-semibold text-brand-text/22 dark:text-white/14 block mt-1 leading-none">
                    / {formatAmount(budgetLimit)} budget
                  </span>
                )}
                {clampedBudgetPct !== undefined && (
                  <div className="absolute bottom-0 inset-x-0 h-[2px] bg-brand-primary/8 dark:bg-brand-primary/10">
                    <div
                      className={cn('h-full transition-all duration-700', budgetDanger ? 'bg-brand-danger' : 'bg-brand-positive')}
                      style={{ width: `${clampedBudgetPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Net */}
              <div className="flex-1 px-4 py-3.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">{format(visibleMonth, 'MMM')} Net</span>
                <span className={cn(
                  'text-xl font-black tabular-nums leading-none tracking-tight truncate block',
                  monthNet > 0 ? 'text-brand-positive' : monthNet < 0 ? 'text-brand-danger' : 'text-brand-text dark:text-white',
                )}>
                  {(monthNet >= 0 ? '+' : '') + formatAmount(monthNet)}
                </span>
              </div>
            </div>

            {/* Mobile: balance hero on top, 3 sub-metrics below */}
            <div className="sm:hidden">
              <div className="px-3 pt-3 pb-2 border-b border-brand-primary/[0.08] dark:border-brand-primary/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18">Balance Today</span>
                  <button
                    onClick={() => calendarNavRef.current?.today()}
                    className="text-[9px] font-semibold text-brand-primary/60 hover:text-brand-primary transition-colors"
                  >
                    Today
                  </button>
                </div>
                <span className={cn(
                  'text-[1.35rem] font-black tabular-nums leading-none tracking-tight block',
                  todayBalance > 0 ? 'text-brand-positive' : todayBalance < 0 ? 'text-brand-danger' : 'text-brand-text dark:text-white',
                )}>
                  {formatAmount(todayBalance)}
                </span>
              </div>
              <div className="flex divide-x divide-brand-primary/[0.08] dark:divide-brand-primary/[0.06]">
                <div className="flex-1 px-2.5 py-2 min-w-0">
                  <span className="text-[7px] font-bold uppercase tracking-[0.10em] text-brand-text/25 dark:text-white/16 block mb-0.5">{format(visibleMonth, 'MMM')} Inc</span>
                  <span className="text-sm font-black tabular-nums text-brand-positive truncate block">{formatAmount(monthIncome)}</span>
                </div>
                <div className="flex-1 px-2.5 py-2 min-w-0 relative">
                  <span className="text-[7px] font-bold uppercase tracking-[0.10em] text-brand-text/25 dark:text-white/16 block mb-0.5">{format(visibleMonth, 'MMM')} Exp</span>
                  <span className="text-sm font-black tabular-nums text-brand-danger truncate block">{formatAmount(monthExpense)}</span>
                  {clampedBudgetPct !== undefined && (
                    <div className="absolute bottom-0 inset-x-0 h-[2px] bg-brand-primary/8">
                      <div className={cn('h-full', budgetDanger ? 'bg-brand-danger' : 'bg-brand-positive')} style={{ width: `${clampedBudgetPct}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 px-2.5 py-2 min-w-0">
                  <span className="text-[7px] font-bold uppercase tracking-[0.10em] text-brand-text/25 dark:text-white/16 block mb-0.5">{format(visibleMonth, 'MMM')} Net</span>
                  <span className={cn(
                    'text-sm font-black tabular-nums truncate block',
                    monthNet > 0 ? 'text-brand-positive' : monthNet < 0 ? 'text-brand-danger' : 'text-brand-text dark:text-white',
                  )}>
                    {(monthNet >= 0 ? '+' : '') + formatAmount(monthNet)}
                  </span>
                </div>
              </div>
            </div>

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
            <div className="animate-pulse rounded-3xl bg-white dark:bg-[#122928] p-5 space-y-3 border border-[#B2CFCE]/60 dark:border-[#16302F]/30">
              <div className="h-5 bg-[#B2CFCE]/60 dark:bg-[#16302F]/30 rounded-lg w-36" />
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-[90px] sm:h-[110px] bg-[#B2CFCE]/40 dark:bg-[#16302F]/20 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="rounded-3xl overflow-hidden
                bg-white border border-[#B2CFCE]/60 shadow-[0_2px_20px_rgba(22,48,47,0.08)]
                dark:bg-[#122928] dark:border-[#3B7A78]/[0.08] dark:shadow-[0_4px_30px_rgba(12,31,30,0.5)]">
                <CalendarView
                  balances={balances}
                  dayTransactions={dayTransactions}
                  selectedDate={selectedDate}
                  onDateClick={handleDateClick}
                  formatAmount={formatAmount}
                  isLoading={isLoading}
                  onMonthChange={setVisibleMonth}
                  firstDayOfWeek={firstDayOfWeek}
                  accounts={accounts}
                  activeAccountId={activeAccountId}
                  onAccountChange={setActiveAccountId}
                  calendarNavRef={calendarNavRef}
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
            bg-white border border-[#B2CFCE]/60 shadow-[0_2px_20px_rgba(22,48,47,0.08)]
            dark:bg-[#122928] dark:border-[#3B7A78]/[0.08] dark:shadow-[0_4px_30px_rgba(12,31,30,0.5)]">
            <MonthSummary month={visibleMonth} dayTransactions={dayTransactions} formatAmount={formatAmount} />
          </div>
        </div>

        {/* Right panel — desktop */}
        <aside className={cn(
          'hidden lg:flex flex-col w-[340px] xl:w-[400px] 2xl:w-[460px] flex-shrink-0',
          'sticky top-[56px] max-h-[calc(100vh-56px-16px)] self-start',
          'rounded-3xl overflow-hidden',
          'bg-white border border-[#B2CFCE]/60 shadow-[0_2px_20px_rgba(22,48,47,0.08)]',
          'dark:bg-[#122928] dark:border-[#3B7A78]/[0.08] dark:shadow-[0_4px_30px_rgba(12,31,30,0.5)]',
        )}>
          {selectedDate ? (
            <>
              {/* Day panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#B2CFCE]/50 dark:border-[#3B7A78]/[0.08] flex-shrink-0
                bg-gradient-to-r from-white to-[#B2CFCE]/10 dark:from-[#122928] dark:to-[#122928]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#16302F]/40 dark:text-[#B2CFCE]/30 mb-0.5">
                    Selected day
                  </p>
                  <h2 className="text-base font-bold text-[#16302F] dark:text-white tracking-tight">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-[#B2CFCE]/40 dark:hover:bg-[#16302F]/40 text-[#16302F]/40 dark:text-[#B2CFCE]/30 hover:text-[#16302F] dark:hover:text-white transition-all"
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
                  <>
                    {/* Account picker — desktop, only when 2+ accounts */}
                    {(accounts?.length ?? 0) >= 2 && (
                      <div className="flex gap-1 flex-wrap mb-2 pb-2 border-b border-slate-100 dark:border-white/[0.07]">
                        <p className="w-full text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-0.5">Add to account</p>
                        {accounts!.map((acct) => (
                          <button
                            key={acct.id}
                            type="button"
                            onClick={() => setDesktopFormAccountId(acct.id)}
                            className={cn(
                              'h-6 px-2.5 rounded-lg text-[10px] font-semibold transition-all border',
                              desktopFormAccountId === acct.id
                                ? 'bg-brand-primary text-white border-brand-primary'
                                : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/50 border-slate-200 dark:border-white/10 hover:border-brand-primary/40',
                            )}
                          >
                            {acct.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <TransactionForm
                      defaultDate={selectedDate}
                      symbol={symbol}
                      compact
                      onCancel={handleCancelAdd}
                      isLoading={create.isPending}
                      onSubmit={(values: TransactionFormValues) => {
                        create.reset();
                        create.mutate(values, { onSuccess: handleCancelAdd });
                      }}
                    />
                  </>
                ) : (
                  <TransactionList
                    date={selectedDate}
                    transactions={selectedTransactions}
                    balance={selectedBalance}
                    formatAmount={formatAmount}
                    symbol={symbol}
                    onAddNew={handleAddNew}
                    showTip={isEmpty && onboardingStep === 1}
                    accounts={accounts}
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
        accountId={activeAccountId !== 'combined' ? activeAccountId : undefined}
        accounts={accounts}
      />
    </div>
    </AppLayout>
  );
}
