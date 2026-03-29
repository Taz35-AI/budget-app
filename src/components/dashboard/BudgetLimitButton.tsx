'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Props {
  limit: number | null;
  monthExpense: number;
  formatAmount: (n: number) => string;
  symbol: string;
  onSetLimit: (value: number | null) => void;
}

export function BudgetLimitButton({ limit, monthExpense, formatAmount, symbol, onSetLimit }: Props) {
  const t = useTranslations('budgetLimit');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(limit ? limit.toFixed(2) : '');
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open, limit]);

  const handleSet = () => {
    const parsed = parseFloat(value);
    onSetLimit(!value || isNaN(parsed) || parsed <= 0 ? null : parsed);
    setOpen(false);
  };

  const pct = limit ? Math.min(monthExpense / limit, 1) : null;
  const isWarning = pct !== null && pct >= 0.85;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium transition-all border',
          limit
            ? isWarning
              ? 'bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/30'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10',
        )}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {limit ? (
          <span className="hidden sm:inline tabular-nums">
            {formatAmount(monthExpense)} / {formatAmount(limit)}
          </span>
        ) : (
          <span className="hidden sm:inline">{t('setButton')}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-x-4 top-24 z-50 bg-white dark:bg-[#122928] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t('title')}</p>
                {limit && (
                  <p className="text-xs text-slate-400 dark:text-white/40">{t('spentOf', { spent: formatAmount(monthExpense), limit: formatAmount(limit) })}</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/8 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/8 border border-slate-200 dark:border-white/12 rounded-xl px-3 py-2.5 mb-3">
              <span className="text-slate-400 dark:text-white/40 text-sm flex-shrink-0">{symbol}</span>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSet(); if (e.key === 'Escape') setOpen(false); }}
                className="flex-1 min-w-0 bg-transparent text-slate-800 dark:text-white text-base font-mono outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-2">
              {limit && (
                <button
                  onClick={() => { onSetLimit(null); setOpen(false); }}
                  className="h-9 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold transition-all"
                >
                  {tc('clear')}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-white/60 text-sm font-semibold border border-slate-200 dark:border-white/10 transition-all">
                {tc('cancel')}
              </button>
              <button onClick={handleSet} className="flex-1 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold transition-all">
                {tc('set')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
