'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { BudgetAccount } from '@/types';

interface Props {
  accounts: BudgetAccount[];
  defaultDate: string | null;
  symbol: string;
  onClose: () => void;
}

export function TransferModal({ accounts, defaultDate, symbol, onClose }: Props) {
  const t = useTranslations('transfer');
  const tc = useTranslations('common');
  const qc = useQueryClient();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '');
  const [toId, setToId] = useState(accounts[1]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate ?? today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);

  const sameAccount = fromId === toId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sameAccount) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: fromId,
          toAccountId: toId,
          amount: Number(amount),
          date,
          expenseName: t('toName', { name: toAccount?.name ?? '' }),
          incomeName: t('fromName', { name: fromAccount?.name ?? '' }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Transfer failed');
        setLoading(false);
        return;
      }
      await qc.invalidateQueries({ queryKey: ['transactions'] });
      onClose();
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl
        bg-white dark:bg-[#122928]
        border border-[#B2CFCE]/60 dark:border-[#3B7A78]/20">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
          border-b border-[#B2CFCE]/40 dark:border-white/[0.07]
          bg-gradient-to-r from-white to-[#B2CFCE]/10 dark:from-[#122928] dark:to-[#122928]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-[#16302F] dark:text-white tracking-tight">
              {t('title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#B2CFCE]/30 dark:hover:bg-white/[0.08] text-[#16302F]/40 dark:text-white/30 hover:text-[#16302F] dark:hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* From → To */}
          <div className="flex items-center gap-2">
            {/* From */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#16302F]/40 dark:text-white/30">
                {t('from')}
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="h-9 rounded-xl border border-[#B2CFCE]/60 dark:border-white/10 bg-[#B2CFCE]/10 dark:bg-white/[0.04] px-2.5 text-sm font-medium text-[#16302F] dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40 transition-all appearance-none cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 mt-5">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                sameAccount
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-400'
                  : 'bg-brand-primary/10 dark:bg-brand-primary/15 text-brand-primary',
              )}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>

            {/* To */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#16302F]/40 dark:text-white/30">
                {t('to')}
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="h-9 rounded-xl border border-[#B2CFCE]/60 dark:border-white/10 bg-[#B2CFCE]/10 dark:bg-white/[0.04] px-2.5 text-sm font-medium text-[#16302F] dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40 transition-all appearance-none cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {sameAccount && (
            <p className="text-xs text-red-500 dark:text-red-400 -mt-2">{t('sameAccount')}</p>
          )}

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#16302F]/40 dark:text-white/30">
              {t('amount')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#16302F]/50 dark:text-white/40 pointer-events-none">
                {symbol}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#B2CFCE]/60 dark:border-white/10 bg-[#B2CFCE]/10 dark:bg-white/[0.04] text-sm font-semibold text-[#16302F] dark:text-white placeholder:text-[#16302F]/25 dark:placeholder:text-white/20 outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40 transition-all"
              />
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#16302F]/40 dark:text-white/30">
              {t('date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-10 px-3 rounded-xl border border-[#B2CFCE]/60 dark:border-white/10 bg-[#B2CFCE]/10 dark:bg-white/[0.04] text-sm font-medium text-[#16302F] dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[#B2CFCE]/60 dark:border-white/10 bg-transparent text-sm font-semibold text-[#16302F]/60 dark:text-white/50 hover:bg-[#B2CFCE]/20 dark:hover:bg-white/[0.06] transition-all"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || sameAccount || !amount}
              className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('transferring')}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  {t('submit')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
