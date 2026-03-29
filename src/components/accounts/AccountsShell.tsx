'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { computeBalances } from '@/engine/balanceEngine';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton, MobileLogo } from '@/components/layout/NavSidebar';
import { cn } from '@/lib/utils';
import type { BudgetAccount } from '@/types';

// ─── Per-account summary computation ─────────────────────────────────────────

interface MonthSummary {
  month: Date;
  income: number;
  expense: number;
  endBalance: number;
}

interface AccountSummary {
  account: BudgetAccount;
  todayBalance: number;
  monthlySummaries: MonthSummary[];
}

function useAccountSummaries(): { summaries: AccountSummary[]; isLoading: boolean } {
  const { data: accounts, isLoading: acctLoading } = useAccounts();
  const { data: txData, isLoading: txLoading } = useTransactions();

  const summaries = useMemo<AccountSummary[]>(() => {
    if (!accounts || !txData) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');
    const toDate = format(endOfMonth(addMonths(today, 11)), 'yyyy-MM-dd');

    return accounts.map((acct) => {
      const acctTxs = txData.transactions.filter((t) => t.account_id === acct.id);

      // Find earliest relevant date
      let fromDate = todayStr;
      for (const tx of acctTxs) {
        const d = tx.type === 'one_off' ? (tx.date ?? todayStr) : (tx.start_date ?? todayStr);
        if (d < fromDate) fromDate = d;
      }

      const { balances, dayTransactions } = computeBalances({
        transactions: acctTxs,
        exceptions: txData.exceptions,
        resetDate: null,
        fromDate,
        toDate,
      });

      const todayBalance = balances.get(todayStr) ?? 0;

      // Current month + next 3 months
      const monthlySummaries: MonthSummary[] = Array.from({ length: 12 }, (_, i) => {
        const month = addMonths(today, i);
        const start = format(startOfMonth(month), 'yyyy-MM-dd');
        const end = format(endOfMonth(month), 'yyyy-MM-dd');

        let income = 0;
        let expense = 0;
        dayTransactions.forEach((txs, date) => {
          if (date < start || date > end) return;
          for (const tx of txs) {
            if (tx.category === 'income') income += tx.amount;
            else expense += tx.amount;
          }
        });

        // End-of-month projected balance: use last known balance at or before end of month
        let endBalance = todayBalance;
        for (const [date, bal] of balances) {
          if (date <= end) endBalance = bal;
        }

        return { month, income, expense, endBalance };
      });

      return { account: acct, todayBalance, monthlySummaries };
    });
  }, [accounts, txData]);

  return { summaries, isLoading: acctLoading || txLoading };
}

// ─── Account card ─────────────────────────────────────────────────────────────

function AccountCard({
  summary,
  formatAmount,
}: {
  summary: AccountSummary;
  formatAmount: (n: number) => string;
}) {
  const { account, todayBalance, monthlySummaries } = summary;
  const isPositive = todayBalance >= 0;
  const t = useTranslations('accounts');
  const tMonths = useTranslations('months');
  const shortMonths = tMonths.raw('short') as string[];

  return (
    <div className="bg-white dark:bg-[#122928] rounded-2xl border border-slate-100 dark:border-white/[0.06] overflow-hidden shadow-[0_2px_16px_rgba(22,48,47,0.06)] dark:shadow-none">
      {/* Account header */}
      <div className={cn(
        'px-3 py-2.5 flex items-center justify-between gap-2',
        'border-b border-slate-100 dark:border-white/[0.06]',
        'bg-gradient-to-r',
        isPositive
          ? 'from-brand-primary/[0.04] to-transparent dark:from-brand-primary/[0.06] dark:to-transparent'
          : 'from-brand-danger/[0.04] to-transparent dark:from-brand-danger/[0.06] dark:to-transparent',
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
            isPositive ? 'bg-brand-primary/10 dark:bg-brand-primary/15' : 'bg-brand-danger/10 dark:bg-brand-danger/15',
          )}>
            <svg className={cn('w-4 h-4', isPositive ? 'text-brand-primary' : 'text-brand-danger')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{account.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-white/35">{t('todayBalance')}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={cn(
            'text-xl font-black tabular-nums tracking-tight',
            isPositive ? 'text-brand-positive' : 'text-brand-danger',
          )}>
            {formatAmount(todayBalance)}
          </p>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="px-3 pb-2 pt-2.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-1.5">{t('monthlyProjection')}</p>

        <div className="flex flex-col gap-0">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-1 mb-0.5 px-1">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/25">Mo</p>
            <p className="text-[8px] font-bold uppercase tracking-wider text-brand-positive/70 text-right">In</p>
            <p className="text-[8px] font-bold uppercase tracking-wider text-brand-danger/70 text-right">Out</p>
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/25 text-right">Bal</p>
          </div>

          {monthlySummaries.map(({ month, income, expense, endBalance }, i) => {
            const isCurrentMonth = i === 0;
            return (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-4 gap-1 px-1 py-1 rounded-md transition-colors',
                  isCurrentMonth
                    ? 'bg-brand-primary/[0.05] dark:bg-brand-primary/[0.07]'
                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]',
                )}
              >
                <div className="flex items-center gap-1">
                  {isCurrentMonth && (
                    <div className="w-1 h-1 rounded-full bg-brand-primary flex-shrink-0" />
                  )}
                  <p className={cn(
                    'text-[10px] font-semibold truncate',
                    isCurrentMonth ? 'text-brand-primary' : 'text-slate-600 dark:text-white/60',
                  )}>
                    {shortMonths[month.getMonth()]}
                  </p>
                </div>
                <p className="text-[10px] font-semibold tabular-nums text-brand-positive text-right">
                  {income > 0 ? `+${formatAmount(income)}` : '—'}
                </p>
                <p className="text-[10px] font-semibold tabular-nums text-brand-danger text-right">
                  {expense > 0 ? `−${formatAmount(expense)}` : '—'}
                </p>
                <p className={cn(
                  'text-[10px] font-bold tabular-nums text-right',
                  endBalance > 0 ? 'text-slate-700 dark:text-white/80' : 'text-brand-danger',
                )}>
                  {formatAmount(endBalance)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function AccountsShell() {
  const { summaries, isLoading } = useAccountSummaries();
  const { formatAmount } = useCurrency();
  const t = useTranslations('accounts');
  const tc = useTranslations('common');

  const totalBalance = summaries.reduce((sum, s) => sum + s.todayBalance, 0);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F7FAF9] dark:bg-[#0C1F1E]">
        <div className="fixed top-0 inset-x-0 h-[400px] bg-gradient-to-b from-cyan-100/40 via-teal-50/20 to-transparent dark:from-[#16302F]/20 dark:to-transparent pointer-events-none -z-10" />

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#0C1F1E]/85 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/[0.05]">
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
          <div className="px-4 sm:px-6 h-16 sm:h-14 flex items-center gap-3">
            <NavMenuButton />
            <MobileLogo />
            <h1 className="hidden lg:block text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
          </div>
        </header>

        <div className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-4">

          {/* Total balance hero */}
          <div className={cn(
            'rounded-2xl p-5 text-white',
            'bg-gradient-to-br from-[#16302F] via-[#1a3d3b] to-[#0f2928]',
            'shadow-[0_4px_24px_rgba(22,48,47,0.3)]',
          )}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 mb-1">{t('totalBalance')}</p>
            <p className={cn('text-3xl sm:text-4xl font-black tracking-tight tabular-nums', totalBalance < 0 ? 'text-red-300' : 'text-white')}>
              {formatAmount(totalBalance)}
            </p>
            <p className="text-xs text-white/35 mt-1.5">
              {summaries.length === 0
                ? t('noAccounts')
                : t('acrossAccounts', { count: summaries.length })}
            </p>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-[#122928] border border-slate-100 dark:border-white/[0.06] overflow-hidden animate-pulse">
                  <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5" />
                      <div>
                        <div className="h-3.5 w-28 rounded bg-slate-100 dark:bg-white/5 mb-1" />
                        <div className="h-2.5 w-16 rounded bg-slate-100 dark:bg-white/5" />
                      </div>
                    </div>
                    <div className="h-6 w-20 rounded bg-slate-100 dark:bg-white/5" />
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-7 rounded-lg bg-slate-50 dark:bg-white/[0.03]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && summaries.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-white/60">{t('noAccounts')}</p>
              <p className="text-xs text-slate-400 dark:text-white/30">Add accounts in Settings to see your balance breakdown here</p>
            </div>
          )}

          {/* Account cards */}
          {!isLoading && summaries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {summaries.map((summary) => (
                <AccountCard key={summary.account.id} summary={summary} formatAmount={formatAmount} />
              ))}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
