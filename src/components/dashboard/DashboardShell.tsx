'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useBalances } from '@/hooks/useBalances';
import { useCurrency } from '@/hooks/useCurrency';
import { useTransactions } from '@/hooks/useTransactions';
import { useOfflineCreate } from '@/hooks/useOfflineCreate';
import { useAccounts } from '@/hooks/useAccounts';
import { useHouseholdMembers } from '@/hooks/useHousehold';
import { accountDisplayName, groupAccountsByOwner, memberShortName } from '@/lib/memberUtils';
import { createClient } from '@/lib/supabase/client';
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
import { TAGS } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { OnboardingTip } from './OnboardingTip';
import { TourSpotlight } from './TourSpotlight';
import { TransferModal } from './TransferModal';
import { InvitationsBanner } from './InvitationsBanner';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton, MobileLogo } from '@/components/layout/NavSidebar';
import { cn } from '@/lib/utils';
import type { DayTransaction, Transaction, TransactionFormValues } from '@/types';

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
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const tt = useTranslations('transactions');
  const tf = useTranslations('transactionForm');
  const tMonths = useTranslations('months');
  const tTags = useTranslations('tags');
  const shortMonths = tMonths.raw('short') as string[];

  // ── Auth user ───────────────────────────────────────────────────────────────
  const [myUserId, setMyUserId] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setMyUserId(data.user.id);
    });
  }, []);

  // ── Household ──────────────────────────────────────────────────────────────
  const { data: hhData } = useHouseholdMembers();
  const householdMembers = hhData?.members;
  const hasHousehold = (householdMembers?.length ?? 0) > 1;

  // ── Accounts ────────────────────────────────────────────────────────────────
  const { data: accounts } = useAccounts();
  const myAccounts = accounts?.filter((a) => a.user_id === myUserId);
  const [activeAccountId, setActiveAccountId] = useState<string>('combined');

  // Auto-select only when the user is solo (not in a household) and has
  // exactly one account. In a shared household, always default to 'combined'
  // so all members' transactions are visible.
  // Wait for hhData to load before deciding — otherwise accounts can resolve
  // first while hasHousehold is still false, causing a wrong auto-select.
  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    if (hhData === undefined) return; // household status still loading
    if (activeAccountId === 'combined' && accounts.length === 1 && !hasHousehold) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId, hasHousehold, hhData]);

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
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDefaultToId, setTransferDefaultToId] = useState<string | undefined>(undefined);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [showMobileStats, setShowMobileStats] = useState(false);

  const { firstDayOfWeek, allTags } = useSettings();

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchAmountMin, setSearchAmountMin] = useState('');
  const [searchAmountMax, setSearchAmountMax] = useState('');
  const [showAmountFilter, setShowAmountFilter] = useState(false);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchText('');
    setSearchAmountMin('');
    setSearchAmountMax('');
    setShowAmountFilter(false);
  }, []);

  // Compute which calendar dates have transactions matching the active query.
  // Runs across ALL loaded dayTransactions so highlights persist on month navigation.
  const matchingDates = useMemo(() => {
    const hasText = searchText.trim().length > 0;
    const hasMin = searchAmountMin !== '';
    const hasMax = searchAmountMax !== '';
    if (!hasText && !hasMin && !hasMax) return undefined;

    const result = new Set<string>();
    dayTransactions.forEach((txs, date) => {
      for (const tx of txs) {
        let ok = true;
        if (hasText) {
          const q = searchText.toLowerCase();
          const nameMatch = tx.name.toLowerCase().includes(q);
          const tagLabel = tx.tag ? (TAGS[tx.tag] ? tTags(tx.tag as never) : (allTags[tx.tag]?.label ?? '')) : '';
          const tagMatch = tagLabel.toLowerCase().includes(q);
          if (!nameMatch && !tagMatch) ok = false;
        }
        if (ok && hasMin && tx.amount < Number(searchAmountMin)) ok = false;
        if (ok && hasMax && tx.amount > Number(searchAmountMax)) ok = false;
        if (ok) { result.add(date); break; }
      }
    });
    return result;
  }, [dayTransactions, searchText, searchAmountMin, searchAmountMax, allTags, tTags]);

  // On mobile, FullCalendar uses height="100%" so it fills the flex-1 container.
  // On desktop it uses "auto" (content-sized). Switch on resize.
  const [calendarHeight, setCalendarHeight] = useState<'auto' | '100%'>('auto');
  useEffect(() => {
    const update = () => setCalendarHeight(window.innerWidth < 640 ? '100%' : 'auto');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Which account new transactions go to in the desktop panel
  const defaultCreateAccountId = activeAccountId !== 'combined' ? activeAccountId : (myAccounts?.[0]?.id ?? accounts?.[0]?.id);
  const [desktopFormAccountId, setDesktopFormAccountId] = useState<string | undefined>(defaultCreateAccountId);

  // In a shared household, default to showing only the user's own accounts in the
  // add-transaction picker. Toggle reveals other members' accounts when needed.
  const [showAllAddAccounts, setShowAllAddAccounts] = useState(false);
  const hasOtherAccounts = (accounts ?? []).some((a) => a.user_id !== myUserId);
  const addPickerAccounts = (showAllAddAccounts || !hasHousehold || (myAccounts?.length ?? 0) === 0)
    ? accounts
    : myAccounts;

  // Re-sync when active tab changes or when the add form opens
  useEffect(() => {
    setDesktopFormAccountId(activeAccountId !== 'combined' ? activeAccountId : accounts?.[0]?.id);
  }, [activeAccountId, accounts, isAdding]);

  // If the form's selected account got filtered out, switch to the first visible one
  useEffect(() => {
    if (!addPickerAccounts || addPickerAccounts.length === 0) return;
    if (!addPickerAccounts.find((a) => a.id === desktopFormAccountId)) {
      setDesktopFormAccountId(addPickerAccounts[0].id);
    }
  }, [addPickerAccounts, desktopFormAccountId]);

  const create = useOfflineCreate(desktopFormAccountId);

  const { todayBalance, monthIncome, monthExpense, monthNet } = useMonthStats(
    balances, dayTransactions, visibleMonth,
  );
  const { limit: budgetLimit, setLimit: setBudgetLimit } = useBudgetLimit(visibleMonth);
  const { impact, notification } = useHaptics();
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();
  useLocalNotifications({
    transactions: txData?.transactions ?? [],
    monthExpense,
    budgetLimit: budgetLimit ?? null,
  });
  const budgetProgress = budgetLimit ? monthExpense / budgetLimit : undefined;
  const clampedBudgetPct = budgetProgress !== undefined ? Math.min(budgetProgress, 1) * 100 : undefined;
  const budgetDanger = budgetProgress !== undefined && budgetProgress >= 0.85;

  // Onboarding tour: 0=tap day, 1=tap add, 2-7=spotlight tour (6 steps), done=finished
  // New users start at step 2 immediately so Adjust Balance is the very first thing they see
  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'done'>(() => {
    try {
      const saved = localStorage.getItem('bt_onboarding');
      if (saved === 'done') return 'done';
      return 2;
    } catch { return 2; }
  });

  const advanceTour = useCallback(() => {
    setOnboardingStep((s) => {
      if (typeof s === 'number' && s >= 2 && s <= 6) return (s + 1) as 3 | 4 | 5 | 6 | 7;
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

  const handleDateClick = useCallback((date: string) => { impact('light'); setSelectedDate(date); setIsAdding(false); }, [impact]);
  const handleClose = useCallback(() => { setSelectedDate(null); setIsAdding(false); }, []);
  const [desktopDuplicateValues, setDesktopDuplicateValues] = useState<Partial<Transaction> | null>(null);
  const handleAddNew = useCallback(() => { impact('medium'); setIsAdding(true); }, [impact]);
  const handleCancelAdd = useCallback(() => { setIsAdding(false); setDesktopDuplicateValues(null); }, []);
  const handleDesktopDuplicate = useCallback((tx: DayTransaction) => {
    setDesktopDuplicateValues({ name: tx.name, amount: tx.amount, category: tx.category, type: tx.type, tag: tx.tag ?? undefined, frequency: tx.frequency ?? undefined });
  }, []);
  const handleOnboardingAdd = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setSelectedDate(today);
    setIsAdding(true);
  }, []);

  const selectedBalance = selectedDate ? (balances.get(selectedDate) ?? 0) : 0;
  const selectedTransactions: DayTransaction[] = selectedDate ? (dayTransactions.get(selectedDate) ?? []) : [];

  return (
    <AppLayout>
    <div className="min-h-screen bg-[#F4FDFB] dark:bg-[#0A1F1E]">

      {/* Ambient glow */}
      <div className="fixed top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#D9DDF0]/40 to-transparent dark:from-[#0F3332]/20 dark:to-transparent pointer-events-none -z-10" />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20
        bg-white/95 dark:bg-[#0A1F1E]/95
        backdrop-blur-2xl
        border-b border-[#D9DDF0]/70 dark:border-[#0D9488]/[0.08]
        shadow-[0_1px_0_rgba(25,27,47,0.06),0_4px_16px_rgba(25,27,47,0.04)]
        dark:shadow-[0_1px_0_rgba(59,122,120,0.06)]">
        {/* Accent line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0D9488]/40 to-transparent" />

        <div className="px-4 sm:px-6 h-16 sm:h-14 flex items-center gap-3">

          {/* Hamburger — mobile only */}
          <NavMenuButton />
          <MobileLogo />

          {/* Page title — desktop only */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <h1 className="text-[1.35rem] text-[#042F2E] dark:text-white tracking-tight" style={{ fontFamily: '"Instrument Serif", serif' }}>{t('title')}</h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {/* Offline / syncing badge */}
            {!isOnline && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-200 dark:border-amber-700/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {tc('offline')}{pendingCount > 0 ? ` · ${pendingCount}` : ''}
              </span>
            )}
            {isOnline && isSyncing && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-primary/10 dark:bg-brand-primary/15 text-brand-primary text-[10px] font-semibold border border-brand-primary/20">
                <span className="w-3 h-3 rounded-full border border-brand-primary/30 border-t-brand-primary animate-spin flex-shrink-0" />
                {tc('syncing')}
              </span>
            )}
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
      {/* Mobile: fixed full-height between header (3rem) and bottom nav (4rem), equal top/bottom padding */}
      <div className="flex gap-4 px-3 sm:px-5 py-3 sm:py-4 items-stretch sm:items-start
        h-[calc(100dvh-4rem-4rem)] sm:h-auto">

        {/* Left: stats + calendar */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-3">

          {/* Pending household invitations */}
          <InvitationsBanner />

          {/* Stats bar — typographic headline style */}
          <div id="tour-stats"
            className="flex-shrink-0 bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] overflow-hidden shadow-[0_1px_6px_rgba(25,27,47,0.05)] dark:shadow-none">

            {/* Desktop: single horizontal row */}
            <div className="hidden sm:flex divide-x divide-brand-primary/[0.08] dark:divide-brand-primary/[0.06]">

              {/* Balance Today — hero, wider */}
              <div className="flex-[1.6] px-5 py-3.5 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  {searchOpen ? (
                    /* ── Search input (desktop) ── */
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        autoFocus
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="flex-1 min-w-0 h-5 bg-transparent text-[11px] text-brand-text dark:text-white placeholder:text-brand-text/30 dark:placeholder:text-white/25 outline-none"
                      />
                      <button
                        onClick={() => setShowAmountFilter((v) => !v)}
                        title={t('filterByAmount')}
                        className={cn(
                          'flex-shrink-0 h-4 w-4 flex items-center justify-center rounded transition-colors',
                          showAmountFilter ? 'text-amber-500' : 'text-brand-text/30 dark:text-white/25 hover:text-brand-primary',
                        )}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2M13 16h-2" />
                        </svg>
                      </button>
                      <button onClick={closeSearch} className="flex-shrink-0 text-brand-text/30 dark:text-white/25 hover:text-brand-danger transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18">{t('balanceToday')}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSearchOpen(true)}
                          aria-label={t('searchAriaLabel')}
                          className="w-5 h-5 flex items-center justify-center rounded-lg text-brand-text/50 dark:text-white/40 hover:text-brand-primary hover:bg-brand-primary/8 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => calendarNavRef.current?.today()}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-brand-primary/20 dark:border-brand-primary/25 bg-brand-primary/8 dark:bg-brand-primary/10 text-brand-primary text-[9px] font-bold transition-all hover:bg-brand-primary/15"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {tc('today')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {/* Amount range inputs — desktop, shown when filter icon is toggled */}
                {searchOpen && showAmountFilter && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <input
                      type="number"
                      value={searchAmountMin}
                      onChange={(e) => setSearchAmountMin(e.target.value)}
                      placeholder={tf('minAmount')}
                      className="w-16 h-5 bg-transparent text-[10px] text-brand-text dark:text-white placeholder:text-brand-text/25 outline-none border-b border-brand-primary/20"
                    />
                    <span className="text-[9px] text-brand-text/25">–</span>
                    <input
                      type="number"
                      value={searchAmountMax}
                      onChange={(e) => setSearchAmountMax(e.target.value)}
                      placeholder={tf('maxAmount')}
                      className="w-16 h-5 bg-transparent text-[10px] text-brand-text dark:text-white placeholder:text-brand-text/25 outline-none border-b border-brand-primary/20"
                    />
                  </div>
                )}
                <span className={cn(
                  'text-[1.75rem] font-black tabular-nums leading-none tracking-tight truncate block',
                  todayBalance > 0 ? 'text-brand-positive' : todayBalance < 0 ? 'text-brand-danger' : 'text-brand-text dark:text-white',
                )}>
                  {formatAmount(todayBalance)}
                </span>
                {searchOpen && matchingDates && (
                  <p className="text-[9px] text-amber-500 font-semibold mt-1 leading-none">
                    {t('daysMatched', { count: matchingDates.size })}
                  </p>
                )}
              </div>

              {/* Income */}
              <div className="flex-1 px-4 py-3.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">{t('monthIncome', { month: shortMonths[visibleMonth.getMonth()] })}</span>
                <span className="text-xl font-black tabular-nums leading-none tracking-tight text-brand-positive truncate block">
                  {formatAmount(monthIncome)}
                </span>
              </div>

              {/* Expenses */}
              <div className="flex-1 px-4 py-3.5 min-w-0 relative">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">
                  {t('monthExpense', { month: shortMonths[visibleMonth.getMonth()] })}
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
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">{t('monthNet', { month: shortMonths[visibleMonth.getMonth()] })}</span>
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
                  {searchOpen ? (
                    /* ── Search input (mobile) ── */
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        autoFocus
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="flex-1 min-w-0 h-5 bg-transparent text-[11px] text-brand-text dark:text-white placeholder:text-brand-text/30 dark:placeholder:text-white/25 outline-none"
                      />
                      <button
                        onClick={() => setShowAmountFilter((v) => !v)}
                        className={cn(
                          'flex-shrink-0 h-5 w-5 flex items-center justify-center rounded transition-colors',
                          showAmountFilter ? 'text-amber-500' : 'text-brand-text/30 dark:text-white/25',
                        )}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2M13 16h-2" />
                        </svg>
                      </button>
                      <button onClick={closeSearch} className="flex-shrink-0 text-brand-text/30 dark:text-white/25 hover:text-brand-danger">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18">{t('balanceToday')}</span>
                      <div className="flex items-center gap-1.5">
                        {/* Search icon */}
                        <button
                          onClick={() => setSearchOpen(true)}
                          aria-label={t('searchAriaLabel')}
                          className={cn(
                            'h-5 w-5 flex items-center justify-center rounded-lg transition-colors',
                            matchingDates ? 'text-amber-500' : 'text-brand-text/50 dark:text-white/40 hover:text-brand-primary hover:bg-brand-primary/8',
                          )}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                        {/* Stats toggle */}
                        <button
                          onClick={() => setShowMobileStats((v) => !v)}
                          className={cn(
                            'flex items-center gap-1 h-5 px-2 rounded-lg border text-[9px] font-bold transition-all active:scale-95',
                            showMobileStats
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-primary/20 dark:border-brand-primary/25 bg-brand-primary/8 dark:bg-brand-primary/10 text-brand-primary',
                          )}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          {t('stats')}
                        </button>
                        <button
                          onClick={() => calendarNavRef.current?.today()}
                          className="flex items-center gap-1 h-5 px-2 rounded-lg border border-brand-primary/20 dark:border-brand-primary/25 bg-brand-primary/8 dark:bg-brand-primary/10 text-brand-primary text-[9px] font-bold transition-all active:bg-brand-primary/20"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {tc('today')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {/* Amount range filter — mobile */}
                {searchOpen && showAmountFilter && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <input
                      type="number"
                      value={searchAmountMin}
                      onChange={(e) => setSearchAmountMin(e.target.value)}
                      placeholder={tf('minAmount')}
                      className="w-14 h-5 bg-transparent text-[10px] text-brand-text dark:text-white placeholder:text-brand-text/25 outline-none border-b border-brand-primary/20"
                    />
                    <span className="text-[9px] text-brand-text/25">–</span>
                    <input
                      type="number"
                      value={searchAmountMax}
                      onChange={(e) => setSearchAmountMax(e.target.value)}
                      placeholder={tf('maxAmount')}
                      className="w-14 h-5 bg-transparent text-[10px] text-brand-text dark:text-white placeholder:text-brand-text/25 outline-none border-b border-brand-primary/20"
                    />
                  </div>
                )}
                <span className={cn(
                  'text-[1.35rem] font-black tabular-nums leading-none tracking-tight block',
                  todayBalance > 0 ? 'text-brand-positive' : todayBalance < 0 ? 'text-brand-danger' : 'text-brand-text dark:text-white',
                )}>
                  {formatAmount(todayBalance)}
                </span>
                {searchOpen && matchingDates && (
                  <p className="text-[9px] text-amber-500 font-semibold mt-0.5 leading-none">
                    {t('daysMatched', { count: matchingDates.size })}
                  </p>
                )}
              </div>
              <div className="flex divide-x divide-brand-primary/[0.08] dark:divide-brand-primary/[0.06]">
                <div className="flex-1 px-2.5 py-2 min-w-0">
                  <span className="text-[7px] font-bold uppercase tracking-[0.10em] text-brand-text/25 dark:text-white/16 block mb-0.5">{t('monthIncome', { month: shortMonths[visibleMonth.getMonth()] })}</span>
                  <span className="text-sm font-black tabular-nums text-brand-positive truncate block">{formatAmount(monthIncome)}</span>
                </div>
                <div className="flex-1 px-2.5 py-2 min-w-0 relative">
                  <span className="text-[7px] font-bold uppercase tracking-[0.10em] text-brand-text/25 dark:text-white/16 block mb-0.5">{t('monthExpense', { month: shortMonths[visibleMonth.getMonth()] })}</span>
                  <span className="text-sm font-black tabular-nums text-brand-danger truncate block">{formatAmount(monthExpense)}</span>
                  {clampedBudgetPct !== undefined && (
                    <div className="absolute bottom-0 inset-x-0 h-[2px] bg-brand-primary/8">
                      <div className={cn('h-full', budgetDanger ? 'bg-brand-danger' : 'bg-brand-positive')} style={{ width: `${clampedBudgetPct}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 px-2.5 py-2 min-w-0">
                  <span className="text-[7px] font-bold uppercase tracking-[0.10em] text-brand-text/25 dark:text-white/16 block mb-0.5">{t('monthNet', { month: shortMonths[visibleMonth.getMonth()] })}</span>
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

          {/* Mobile stats panel — shown instead of calendar when toggle is active */}
          {showMobileStats && (
            <div className="sm:hidden flex-1 min-h-0 overflow-y-auto rounded-3xl
              bg-white border border-[#D9DDF0]/60 shadow-[0_2px_20px_rgba(25,27,47,0.08)]
              dark:bg-[#042F2E] dark:border-[#0D9488]/[0.08] dark:shadow-[0_4px_30px_rgba(12,31,30,0.5)]">
              <MonthSummary month={visibleMonth} dayTransactions={dayTransactions} formatAmount={formatAmount} />
            </div>
          )}

          {/* Calendar — hidden on mobile when stats panel is active */}
          {/* flex-1 min-h-0 lets it fill remaining height on mobile; sm:flex-initial resets on desktop */}
          <div className={cn('flex-1 min-h-0 sm:flex-initial', showMobileStats && 'hidden sm:block')}>
          {isLoading && balances.size === 0 ? (
            <div className="animate-pulse rounded-3xl bg-white dark:bg-[#042F2E] p-5 space-y-3 border border-[#D9DDF0]/60 dark:border-[#042F2E]/30">
              <div className="h-5 bg-[#D9DDF0]/60 dark:bg-[#042F2E]/30 rounded-lg w-36" />
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-[90px] sm:h-[110px] bg-[#D9DDF0]/40 dark:bg-[#042F2E]/20 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="relative h-full">
              <div className="h-full rounded-3xl overflow-hidden
                bg-white border border-[#D9DDF0]/60 shadow-[0_2px_20px_rgba(25,27,47,0.08)]
                dark:bg-[#042F2E] dark:border-[#0D9488]/[0.08] dark:shadow-[0_4px_30px_rgba(12,31,30,0.5)]">
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
                  calendarHeight={calendarHeight}
                  matchingDates={matchingDates}
                  myUserId={myUserId}
                  members={householdMembers}
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
          </div>{/* end calendar hide wrapper */}

          {/* Month summary — desktop right panel only */}
        </div>

        {/* Right panel — desktop */}
        <aside className={cn(
          'hidden lg:flex flex-col w-[340px] xl:w-[400px] 2xl:w-[460px] flex-shrink-0',
          'sticky top-[56px] max-h-[calc(100vh-56px-16px)] self-start',
          'rounded-3xl overflow-hidden',
          'bg-white border border-[#D9DDF0]/60 shadow-[0_2px_20px_rgba(25,27,47,0.08)]',
          'dark:bg-[#042F2E] dark:border-[#0D9488]/[0.08] dark:shadow-[0_4px_30px_rgba(12,31,30,0.5)]',
        )}>
          {selectedDate ? (
            <>
              {/* Day panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#D9DDF0]/50 dark:border-[#0D9488]/[0.08] flex-shrink-0
                bg-gradient-to-r from-white to-[#D9DDF0]/10 dark:from-[#042F2E] dark:to-[#042F2E]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#042F2E]/40 dark:text-[#D9DDF0]/30 mb-0.5">
                    Selected day
                  </p>
                  <h2 className="text-base font-bold text-[#042F2E] dark:text-white tracking-tight">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-[#D9DDF0]/40 dark:hover:bg-[#042F2E]/40 text-[#042F2E]/40 dark:text-[#D9DDF0]/30 hover:text-[#042F2E] dark:hover:text-white transition-all"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {create.isError && (
                <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 text-sm text-rose-700 dark:text-rose-400 flex-shrink-0">
                  {tt('failedToSave', { message: (create.error as Error)?.message ?? 'Unknown error' })}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {(isAdding || desktopDuplicateValues !== null) ? (
                  <>
                    {/* Account picker — desktop, only when 2+ accounts */}
                    {(accounts?.length ?? 0) >= 2 && (
                      <div className="mb-2 pb-2 border-b border-slate-100 dark:border-white/[0.07]">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">{tt('addToAccount')}</p>
                          {hasHousehold && hasOtherAccounts && (
                            <button
                              type="button"
                              onClick={() => setShowAllAddAccounts((v) => !v)}
                              className="text-[9px] font-bold uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 transition-colors"
                            >
                              {showAllAddAccounts ? tt('showMineOnly') : tt('showAll')}
                            </button>
                          )}
                        </div>
                        {showAllAddAccounts && hasHousehold ? (
                          // Grouped view — cleaner when there are many accounts across members
                          <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto overscroll-contain pr-1">
                            {groupAccountsByOwner(addPickerAccounts ?? [], myUserId, householdMembers).map((group) => (
                              <div key={group.userId || 'mine'} className="flex flex-col gap-0.5">
                                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/25 px-0.5">
                                  {group.isMine ? tt('showMineOnly') : memberShortName(group.userId, householdMembers) ?? '—'}
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                  {group.items.map((acct) => (
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
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Flat pills — fine for "mine only" or solo household
                          <div className="flex gap-1 flex-wrap">
                            {(addPickerAccounts ?? []).map((acct) => (
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
                                {accountDisplayName(acct, myUserId, householdMembers)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <TransactionForm
                      defaultDate={selectedDate}
                      symbol={symbol}
                      compact
                      isDuplicate={desktopDuplicateValues !== null}
                      initialValues={desktopDuplicateValues ?? undefined}
                      onCancel={handleCancelAdd}
                      isLoading={create.isPending}
                      isCreditAccount={accounts?.find(a => a.id === desktopFormAccountId)?.type === 'credit'}
                      creditLimit={accounts?.find(a => a.id === desktopFormAccountId)?.credit_limit}
                      onTransfer={(accounts?.length ?? 0) >= 2 ? () => { handleCancelAdd(); setTransferDefaultToId(desktopFormAccountId); setShowTransferModal(true); } : undefined}
                      onSubmit={(values: TransactionFormValues) => {
                        // Close and notify immediately — optimistic update already shows the entry
                        handleCancelAdd();
                        notification('success');
                        create.submit(values, {});
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
                    onDuplicate={handleDesktopDuplicate}
                    onTransfer={() => { setTransferDefaultToId(undefined); setShowTransferModal(true); }}
                    showTip={isEmpty && onboardingStep === 1}
                    accounts={accounts}
                    members={householdMembers}
                    myUserId={myUserId}
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
        <TourSpotlight step={onboardingStep as 2 | 3 | 4 | 5 | 6 | 7} onNext={advanceTour} onDone={finishTour} />
      )}

      {/* Transfer modal */}
      {showTransferModal && (accounts?.length ?? 0) >= 2 && (
        <TransferModal
          accounts={accounts!}
          defaultDate={selectedDate}
          symbol={symbol}
          defaultToId={transferDefaultToId}
          onClose={() => { setShowTransferModal(false); setTransferDefaultToId(undefined); }}
          myUserId={myUserId}
          members={householdMembers}
        />
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
        onTransfer={(toId) => { setTransferDefaultToId(toId); setShowTransferModal(true); }}
        showTip={isEmpty && onboardingStep === 1}
        accountId={activeAccountId !== 'combined' ? activeAccountId : undefined}
        accounts={accounts}
        members={householdMembers}
        myUserId={myUserId}
      />
    </div>
    </AppLayout>
  );
}
