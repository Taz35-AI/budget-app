'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function ResetAllButton() {
  const t = useTranslations('resetAll');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
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
      setOpen(false);
      setConfirmed(false);
    },
  });

  const handleClose = () => { setOpen(false); setConfirmed(false); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-brand-danger/6 dark:bg-brand-danger/10 hover:bg-brand-danger/12 dark:hover:bg-brand-danger/18 text-brand-danger/70 dark:text-brand-danger/80 hover:text-brand-danger text-sm font-medium transition-all border border-brand-danger/15 dark:border-brand-danger/20 hover:border-brand-danger/30"
        title="Reset all data"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>{t('buttonLabel')}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div
            className="fixed inset-x-4 top-24 z-50 bg-white dark:bg-[#122928] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t('title')}</p>
                <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{t('desc')}</p>
              </div>
              <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/8 transition-all flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!confirmed ? (
              <div className="flex gap-2 mt-3">
                <button onClick={handleClose} className="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-white/60 text-sm font-semibold border border-slate-200 dark:border-white/10 transition-all">
                  {tc('cancel')}
                </button>
                <button
                  onClick={() => setConfirmed(true)}
                  className="flex-1 h-9 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all"
                >
                  {t('deleteAll')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 mb-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">{t('confirmWarning')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleClose} className="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-white/60 text-sm font-semibold border border-slate-200 dark:border-white/10 transition-all">
                    {tc('cancel')}
                  </button>
                  <button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className={cn(
                      'flex-1 h-9 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all',
                      mutation.isPending && 'opacity-60',
                    )}
                  >
                    {mutation.isPending ? t('deleting') : t('confirmDelete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
