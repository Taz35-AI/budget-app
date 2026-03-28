'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export function ResetAllButton() {
  const [step, setStep] = useState<'idle' | 'confirm1' | 'confirm2'>('idle');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reset-all', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to reset');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['balance-reset'] });
      setStep('idle');
    },
  });

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm1')}
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-brand-danger/6 dark:bg-brand-danger/10 hover:bg-brand-danger/12 dark:hover:bg-brand-danger/18 text-brand-danger/70 dark:text-brand-danger/80 hover:text-brand-danger text-sm font-medium transition-all border border-brand-danger/15 dark:border-brand-danger/20 hover:border-brand-danger/30"
        title="Reset all data"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span className="hidden sm:inline">Reset All</span>
      </button>
    );
  }

  if (step === 'confirm1') {
    return (
      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl px-3 py-1.5">
        <span className="text-red-600 dark:text-red-400 text-xs font-medium">Delete all data?</span>
        <button
          onClick={() => setStep('confirm2')}
          className="h-6 px-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all"
        >
          Yes
        </button>
        <button onClick={() => setStep('idle')} className="text-brand-text/30 dark:text-white/30 hover:text-brand-text dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/40 rounded-xl px-3 py-1.5">
      <span className="text-red-600 dark:text-red-300 text-xs font-semibold">⚠ Cannot be undone</span>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className={cn(
          'h-6 px-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all',
          mutation.isPending && 'opacity-60',
        )}
      >
        {mutation.isPending ? 'Deleting…' : 'CONFIRM DELETE'}
      </button>
      <button onClick={() => setStep('idle')} className="text-brand-text/30 dark:text-white/30 hover:text-brand-text dark:hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
