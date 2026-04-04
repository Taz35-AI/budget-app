'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMortgages, useDeleteMortgage } from '@/hooks/useMortgages';
import { useHouseholdMembers } from '@/hooks/useHousehold';
import { useSettings } from '@/hooks/useSettings';
import { computeMortgageState } from '@/engine/mortgageEngine';
import type { Mortgage, HouseholdMember } from '@/types';

function ownerLabel(
  userId: string,
  myUserId: string | null | undefined,
  members: HouseholdMember[] | undefined,
): string | null {
  if (!myUserId || !members || members.length <= 1) return null;
  if (userId === myUserId) return null;
  const m = members.find((m) => m.user_id === userId);
  return m?.display_name ?? m?.email?.split('@')[0] ?? null;
}

function MortgageCard({
  mortgage,
  formatAmount,
  myUserId,
  members,
  tagLabel,
  onDelete,
  isDeleting,
}: {
  mortgage: Mortgage;
  formatAmount: (n: number) => string;
  myUserId: string | null | undefined;
  members: HouseholdMember[] | undefined;
  tagLabel: string | undefined;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const t = useTranslations('mortgages');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const state = useMemo(() => computeMortgageState(mortgage), [mortgage]);
  const isMine = mortgage.user_id === myUserId;
  const owner = ownerLabel(mortgage.user_id, myUserId, members);
  const monthsRemaining = state.totalPayments - state.paymentsMade;
  const progressPct = state.principalPaidToDate / mortgage.principal;

  return (
    <div className="rounded-3xl bg-white dark:bg-[#042F2E] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-purple-50/60 to-transparent dark:from-purple-500/[0.04] dark:to-transparent flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{mortgage.name}</p>
          </div>
          {owner && (
            <p className="text-[10px] text-slate-400 dark:text-white/35 mt-0.5 ml-9">{owner}</p>
          )}
        </div>
        {isMine && (
          confirmDelete ? (
            <div className="flex gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-7 px-2 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-[0.96] transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="h-7 px-2 rounded-lg text-[10px] font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.96] transition-all disabled:opacity-50"
              >
                {t('deleteMortgage')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label={t('deleteMortgage')}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.95] transition-all flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )
        )}
      </div>

      {/* Balance owed + progress */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-white/30 mb-1">{t('balanceOwed')}</p>
        <p className="text-2xl font-black tabular-nums text-brand-danger tracking-tight">
          {formatAmount(state.balanceRemaining)}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5">
          {t('principalPaid')}: {formatAmount(state.principalPaidToDate)} / {formatAmount(mortgage.principal)}
        </p>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400 dark:text-white/30 mb-1">
            <span>{t('progressLabel')}</span>
            <span>{Math.round(progressPct * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-brand-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPct * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 py-3 grid grid-cols-2 gap-y-2.5 gap-x-3">
        <Stat label={t('monthlyPayment')} value={formatAmount(state.monthlyPayment)} />
        <Stat
          label={t('monthsRemaining', { count: monthsRemaining })}
          value={state.payoffDate}
          sub={t('payoffDate')}
        />
        <Stat label={t('interestPaid')} value={formatAmount(state.interestPaidToDate)} />
        <Stat label={t('totalInterestLifetime')} value={formatAmount(state.totalInterestLifetime)} />
      </div>

      {/* Next payment breakdown */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-white/30 mb-1.5">{t('nextPayment')}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-semibold mb-1">
              <span className="text-brand-danger">{t('interestPortion')}</span>
              <span className="text-brand-primary">{t('principalPortion')}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-brand-danger"
                style={{ width: `${(state.nextInterestPortion / state.monthlyPayment) * 100}%` }}
              />
              <div
                className="h-full bg-brand-primary"
                style={{ width: `${(state.nextPrincipalPortion / state.monthlyPayment) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-600 dark:text-white/60 mt-1 tabular-nums">
              <span>{formatAmount(state.nextInterestPortion)}</span>
              <span>{formatAmount(state.nextPrincipalPortion)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tag hint */}
      {tagLabel && (
        <div className="px-4 py-2 bg-purple-50/50 dark:bg-purple-500/[0.04] border-t border-purple-100 dark:border-purple-500/10">
          <p className="text-[10px] text-slate-500 dark:text-white/50">
            {t('paymentsTagHint', { tag: tagLabel })}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">{value}</p>
      {sub && <p className="text-[9px] text-slate-400 dark:text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

export function MortgagesTab({
  formatAmount,
  myUserId,
}: {
  formatAmount: (n: number) => string;
  myUserId: string | null | undefined;
}) {
  const t = useTranslations('mortgages');
  const { data: mortgages, isLoading } = useMortgages();
  const { data: hhData } = useHouseholdMembers();
  const members = hhData?.members;
  const { allTags } = useSettings();
  const deleteMortgage = useDeleteMortgage();

  const totalDebt = (mortgages ?? []).reduce((sum, m) => {
    const s = computeMortgageState(m);
    return sum + s.balanceRemaining;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl h-48 bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!mortgages || mortgages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-white/60">{t('noMortgages')}</p>
        <p className="text-xs text-slate-400 dark:text-white/30">{t('subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Total debt hero */}
      {mortgages.length > 1 && (
        <div className={cn(
          'rounded-3xl p-4 text-white',
          'bg-gradient-to-br from-purple-700 via-purple-800 to-[#0f2928]',
          'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]',
        )}>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 mb-1">{t('totalDebt')}</p>
          <p className="text-3xl font-black tracking-tight tabular-nums text-white">
            {formatAmount(totalDebt)}
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {mortgages.map((m) => (
          <MortgageCard
            key={m.id}
            mortgage={m}
            formatAmount={formatAmount}
            myUserId={myUserId}
            members={members}
            tagLabel={allTags[m.tag_id]?.label}
            onDelete={() => deleteMortgage.mutate(m.id)}
            isDeleting={deleteMortgage.isPending}
          />
        ))}
      </div>
    </div>
  );
}
