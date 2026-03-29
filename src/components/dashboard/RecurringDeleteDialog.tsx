'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { FREQUENCIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DeleteMode } from '@/hooks/useTransactions';
import type { DayTransaction } from '@/types';

interface Props {
  tx: DayTransaction;
  occurrenceDate: string;
  onConfirm: (deleteMode: DeleteMode) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RecurringDeleteDialog({ tx, occurrenceDate, onConfirm, onCancel, isLoading }: Props) {
  const t = useTranslations('recurring');
  const tc = useTranslations('common');
  const [selected, setSelected] = useState<DeleteMode>('all_future');
  const displayDate = format(new Date(occurrenceDate + 'T12:00:00'), 'd MMM yyyy');

  const SCOPE_OPTIONS = [
    {
      value: 'this_only' as DeleteMode,
      label: t('justThisOne'),
      description: t('justThisOneDeleteDesc'),
      danger: false,
    },
    {
      value: 'all_future' as DeleteMode,
      label: t('thisAndAllFuture'),
      description: t('thisAndAllFutureDeleteDesc'),
      danger: false,
    },
    {
      value: 'all' as DeleteMode,
      label: t('allOccurrences'),
      description: t('allOccurrencesDeleteDesc'),
      danger: true,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-xl bg-brand-danger/8 dark:bg-brand-danger/12 border border-brand-danger/20 dark:border-brand-danger/25 px-4 py-3">
        <p className="text-xs text-brand-danger font-medium uppercase tracking-wider mb-0.5">{t('deleteTitle')}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-white">{tx.name}</p>
        {tx.frequency && (
          <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">
            {t('occurrenceOn', { frequency: FREQUENCIES[tx.frequency], date: displayDate })}
          </p>
        )}
      </div>

      {/* Scope options */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-700 dark:text-white/80">{t('deleteQuestion')}</p>
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border text-left transition-all w-full',
              selected === opt.value
                ? opt.danger
                  ? 'border-brand-danger bg-brand-danger text-white'
                  : 'border-brand-primary bg-brand-primary text-white'
                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20',
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
              selected === opt.value ? 'border-white' : 'border-slate-300 dark:border-white/30',
            )}>
              {selected === opt.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div>
              <p className={cn(
                'text-sm font-medium',
                selected === opt.value ? 'text-white' : 'text-slate-800 dark:text-white/90',
              )}>
                {opt.label}
              </p>
              <p className={cn(
                'text-xs mt-0.5',
                selected === opt.value ? 'text-white/70' : 'text-slate-400 dark:text-white/40',
              )}>
                {opt.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="danger"
          loading={isLoading}
          onClick={() => onConfirm(selected)}
          className="flex-1"
        >
          {tc('delete')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {tc('cancel')}
        </Button>
      </div>
    </div>
  );
}
