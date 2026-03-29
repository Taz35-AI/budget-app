'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Props {
  todayBalance: number;
  formatAmount: (n: number) => string;
  symbol: string;
  accountId?: string;
}

export function AdjustBalanceButton({ todayBalance, formatAmount, symbol, accountId }: Props) {
  const t = useTranslations('adjustBalance');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setValue(todayBalance.toFixed(2));
      setError('');
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, todayBalance]);

  const mutation = useMutation({
    mutationFn: async () => {
      const desired = parseFloat(value);
      if (isNaN(desired)) throw new Error(t('invalidAmount'));
      const res = await fetch('/api/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desiredBalance: desired, currentBalance: todayBalance, accountId: accountId ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('failed'));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const delta = parseFloat(value) - todayBalance;
  const hasDelta = !isNaN(delta) && Math.abs(delta) >= 0.01;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-sm font-medium transition-all border border-slate-200 dark:border-white/20"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="hidden sm:inline">{t('buttonLabel')}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-24 z-50 bg-white dark:bg-[#122928] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t('title')}</p>
                <p className="text-xs text-slate-400 dark:text-white/40">{t('now', { amount: formatAmount(todayBalance) })}</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/8 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/8 border border-slate-200 dark:border-white/12 rounded-xl px-3 py-2.5 mb-2">
              <span className="text-slate-400 dark:text-white/40 text-sm flex-shrink-0">{symbol}</span>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') mutation.mutate(); if (e.key === 'Escape') setOpen(false); }}
                className="flex-1 min-w-0 bg-transparent text-slate-800 dark:text-white text-base font-mono outline-none"
                placeholder="0.00"
              />
              {hasDelta && (
                <span className={cn('text-xs font-semibold flex-shrink-0', delta > 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {delta > 0 ? '+' : ''}{formatAmount(delta)}
                </span>
              )}
            </div>

            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

            <div className="flex gap-2 mt-3">
              <button onClick={() => setOpen(false)} className="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-white/60 text-sm font-semibold transition-all border border-slate-200 dark:border-white/10">
                {tc('cancel')}
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !hasDelta}
                className="flex-1 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold disabled:opacity-40 transition-all"
              >
                {mutation.isPending ? tc('loading') : tc('set')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
