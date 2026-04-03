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

      // Start at least 3 months back so past-month rows have data
      const threeMonthsAgo = format(startOfMonth(addMonths(today, -3)), 'yyyy-MM-dd');
      let fromDate = threeMonthsAgo;
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

      // 3 past months + current + 8 future = 12 rows total
      const PAST_MONTHS = 3;
      const monthlySummaries: MonthSummary[] = Array.from({ length: 12 }, (_, i) => {
        const month = addMonths(today, i - PAST_MONTHS);
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

        // End-of-month balance: use last known balance at or before end of month
        let endBalance = 0;
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

// ─── Account type icon ────────────────────────────────────────────────────────

function AccountTypeIcon({ type, className }: { type: import('@/types').AccountType; className?: string }) {
  if (type === 'savings') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === 'credit') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" />
      </svg>
    );
  }
  // checking (default)
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
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
  const isCredit = account.type === 'credit';
  const isPositive = isCredit ? todayBalance >= 0 : todayBalance >= 0;
  // For credit: positive balance means credit, negative means debt
  // Red header when in debt (balance < 0) for credit, or negative for others
  const isHeaderRed = todayBalance < 0;
  const t = useTranslations('accounts');
  const tMonths = useTranslations('months');
  const shortMonths = tMonths.raw('short') as string[];

  // Credit card: check if any projected end-of-month exceeds the credit limit
  const isOverLimit = isCredit && account.credit_limit != null &&
    monthlySummaries.some(s => s.endBalance < -(account.credit_limit!));

  const availableCredit = isCredit && account.credit_limit != null
    ? account.credit_limit + todayBalance // credit_limit - |debt|
    : null;

  return (
    <div className="bg-white dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
      {/* Account header */}
      <div className={cn(
        'px-3 py-2.5 flex items-center justify-between gap-2',
        'border-b border-slate-100 dark:border-white/[0.06]',
        'bg-gradient-to-r',
        isHeaderRed
          ? 'from-brand-danger/[0.04] to-transparent dark:from-brand-danger/[0.06] dark:to-transparent'
          : 'from-brand-primary/[0.04] to-transparent dark:from-brand-primary/[0.06] dark:to-transparent',
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
            isHeaderRed ? 'bg-brand-danger/10 dark:bg-brand-danger/15' : 'bg-brand-primary/10 dark:bg-brand-primary/15',
          )}>
            <AccountTypeIcon
              type={account.type ?? 'checking'}
              className={cn('w-4 h-4', isHeaderRed ? 'text-brand-danger' : 'text-brand-primary')}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{account.name}</p>
              <span className={cn(
                'text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md flex-shrink-0',
                account.type === 'credit'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
                  : account.type === 'savings'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-white/40',
              )}>
                {t(`type${((account.type ?? 'checking').charAt(0).toUpperCase() + (account.type ?? 'checking').slice(1))}` as 'typeChecking')}
              </span>
              {isOverLimit && (
                <span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex-shrink-0">
                  {t('overLimitWarning')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-white/35">
              {isCredit ? t('debtBalance') : t('todayBalance')}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={cn(
            'text-xl font-black tabular-nums tracking-tight',
            isHeaderRed ? 'text-brand-danger' : 'text-brand-positive',
          )}>
            {formatAmount(todayBalance)}
          </p>
          {availableCredit != null && (
            <p className="text-[10px] text-slate-400 dark:text-white/40 mt-0.5">
              {t('availableCredit')}: {formatAmount(Math.max(0, availableCredit))}
            </p>
          )}
        </div>
      </div>

      {/* Credit limit info bar */}
      {isCredit && account.credit_limit != null && (
        <div className="px-3 py-2 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[9px] font-semibold text-slate-400 dark:text-white/30 mb-1">
              <span>{t('used')}</span>
              <span>{t('creditLimit')}: {formatAmount(account.credit_limit)}</span>
            </div>
            {/* Usage bar */}
            <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', isOverLimit ? 'bg-red-500' : 'bg-brand-primary')}
                style={{ width: `${Math.min(100, (Math.abs(Math.min(0, todayBalance)) / account.credit_limit) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

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
            const isCurrentMonth = i === 3; // index 3 = current month (after 3 past months)
            return (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-4 gap-1 px-1 py-1 native-row rounded-2xl transition-colors',
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
  const hasCredit = summaries.some(s => s.account.type === 'credit');

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F4FDFB] dark:bg-[#011817]">
        <div className="fixed top-0 inset-x-0 h-[400px] bg-gradient-to-b from-cyan-100/40 via-teal-50/20 to-transparent dark:from-[#042F2E]/20 dark:to-transparent pointer-events-none -z-10" />

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#011817]/85 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/[0.05]">
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
            'rounded-3xl p-5 text-white',
            'bg-gradient-to-br from-[#042F2E] via-[#1a3d3b] to-[#0f2928]',
            'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]',
          )}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 mb-1">{hasCredit ? t('netWorth') : t('totalBalance')}</p>
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
                <div key={i} className="rounded-3xl bg-white dark:bg-[#042F2E] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
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
