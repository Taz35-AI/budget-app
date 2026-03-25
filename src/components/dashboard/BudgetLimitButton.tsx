'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  limit: number | null;
  monthExpense: number;
  formatAmount: (n: number) => string;
  symbol: string;
  onSetLimit: (value: number | null) => void;
}

export function BudgetLimitButton({ limit, monthExpense, formatAmount, symbol, onSetLimit }: Props) {
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
    if (!value || isNaN(parsed) || parsed <= 0) {
      onSetLimit(null);
    } else {
      onSetLimit(parsed);
    }
    setOpen(false);
  };

  if (!open) {
    const pct = limit ? Math.min(monthExpense / limit, 1) : null;
    const isWarning = pct !== null && pct >= 0.85;

    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium transition-all border',
          limit
            ? isWarning
              ? 'bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/30'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white/80',
        )}
        title={limit ? `Budget: ${formatAmount(limit)}` : 'Set monthly budget limit'}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {limit ? (
          <span className="hidden sm:inline tabular-nums">
            {formatAmount(monthExpense)} / {formatAmount(limit)}
          </span>
        ) : (
          <span className="hidden sm:inline">Set Budget</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5">
      <span className="text-slate-500 dark:text-white/60 text-sm flex-shrink-0">{symbol}</span>
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSet(); if (e.key === 'Escape') setOpen(false); }}
        className="w-24 bg-transparent text-slate-800 dark:text-white text-sm font-mono outline-none placeholder:text-slate-400 dark:placeholder:text-white/40"
        placeholder="0.00"
      />
      <button
        onClick={handleSet}
        className="flex-shrink-0 h-6 px-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-white/90 transition-all"
      >
        Set
      </button>
      {limit && (
        <button
          onClick={() => { onSetLimit(null); setOpen(false); }}
          className="flex-shrink-0 h-6 px-2 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60 text-xs font-medium hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
        >
          Clear
        </button>
      )}
      <button onClick={() => setOpen(false)} className="text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white transition-colors flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
