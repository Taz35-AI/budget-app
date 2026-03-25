'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Props {
  todayBalance: number;
  formatAmount: (n: number) => string;
  symbol: string;
}

export function AdjustBalanceButton({ todayBalance, formatAmount, symbol }: Props) {
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
      if (isNaN(desired)) throw new Error('Invalid amount');
      const res = await fetch('/api/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desiredBalance: desired, currentBalance: todayBalance }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-sm font-medium transition-all border border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-white/30"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="hidden sm:inline">Adjust Balance</span>
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
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') mutation.mutate(); if (e.key === 'Escape') setOpen(false); }}
        className="w-28 bg-transparent text-slate-800 dark:text-white text-sm font-mono outline-none placeholder:text-slate-400 dark:placeholder:text-white/40"
        placeholder="0.00"
      />
      {hasDelta && (
        <span className={cn(
          'text-xs font-medium flex-shrink-0',
          delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
        )}>
          {delta > 0 ? '+' : ''}{formatAmount(delta)}
        </span>
      )}
      {error && <span className="text-red-500 dark:text-red-400 text-xs">{error}</span>}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !hasDelta}
        className="flex-shrink-0 h-6 px-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-white/90 disabled:opacity-40 transition-all"
      >
        {mutation.isPending ? '…' : 'Set'}
      </button>
      <button onClick={() => setOpen(false)} className="text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white transition-colors flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
