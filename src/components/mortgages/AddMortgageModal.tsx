'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateMortgage } from '@/hooks/useMortgages';
import { useSettingsStore } from '@/store/settingsStore';

interface Props {
  symbol: string;
  onClose: () => void;
  onCreated?: () => void;
}

export function AddMortgageModal({ symbol, onClose, onCreated }: Props) {
  const t = useTranslations('mortgages');
  const tc = useTranslations('common');
  const addCustomTag = useSettingsStore((s) => s.addCustomTag);
  const createMortgage = useCreateMortgage();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [error, setError] = useState('');

  const canSubmit =
    name.trim().length > 0 &&
    Number(principal) > 0 &&
    Number(rate) >= 0 &&
    Number(rate) < 100 &&
    Number(years) > 0 &&
    Number(years) <= 50 &&
    !!startDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');

    const tagId = crypto.randomUUID();
    const trimmedName = name.trim();

    // Auto-create the custom tag for this mortgage
    addCustomTag({
      id: tagId,
      label: `Mortgage - ${trimmedName}`,
      color: '#8b5cf6',
      category: 'expense',
    });

    try {
      await createMortgage.mutateAsync({
        name: trimmedName,
        principal: Number(principal),
        interest_rate: Number(rate) / 100, // convert % → decimal
        term_months: Math.round(Number(years) * 12),
        start_date: startDate,
        tag_id: tagId,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const inputCls =
    'w-full h-10 rounded-2xl border border-[#D9DDF0]/60 dark:border-white/10 bg-[#D9DDF0]/10 dark:bg-[#042F2E] px-3 text-sm font-medium text-[#042F2E] dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] placeholder:text-slate-400 dark:placeholder:text-white/30';
  const labelCls =
    'text-[9px] font-bold uppercase tracking-[0.16em] text-[#042F2E]/40 dark:text-white/30 mb-1.5 block';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 native-backdrop" onClick={onClose} />

      <div
        className={cn(
          'relative w-full max-w-sm rounded-3xl overflow-hidden',
          'bg-white dark:bg-[#042F2E]',
          'border border-black/[0.06] dark:border-white/[0.1]',
          'shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-5 py-4',
            'border-b border-[#D9DDF0]/40 dark:border-white/[0.07]',
            'bg-gradient-to-r from-white to-[#D9DDF0]/10 dark:from-[#042F2E] dark:to-[#042F2E]',
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold text-[#042F2E] dark:text-white tracking-tight">{t('addMortgage')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tc('close')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.95] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>{t('name')}</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              maxLength={100}
              className={inputCls}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>{t('principal')} ({symbol})</label>
              <input
                type="number"
                inputMode="decimal"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="200000"
                min={0}
                step={1}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>{t('interestRate')}</label>
              <input
                type="number"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="4.5"
                min={0}
                max={99}
                step={0.01}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>{t('termYears')}</label>
              <input
                type="number"
                inputMode="numeric"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="25"
                min={1}
                max={50}
                step={1}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>{t('startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-2xl text-sm font-semibold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || createMortgage.isPending}
              className="flex-1 h-10 rounded-2xl text-sm font-semibold bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {createMortgage.isPending ? '…' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
