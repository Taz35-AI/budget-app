'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TagDropdown } from './TransactionForm';
import { FREQUENCIES } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { computeEndDateFromRecurrences, computeRecurrencesFromEndDate } from '@/engine/recurringResolver';
import { cn } from '@/lib/utils';
import type { EditMode } from '@/hooks/useTransactions';
import type { DayTransaction, Frequency } from '@/types';

function buildSchema(tc: (key: string) => string) {
  return z.object({
    editMode: z.enum(['this_only', 'all_future', 'all']),
    name: z.string().min(1, tc('required')),
    amount: z.string().min(1, tc('required')).refine((v) => Number(v) > 0, tc('mustBePositive')),
    category: z.enum(['income', 'expense']),
    tag: z.string().optional(),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual']).optional(),
    recurrences: z.string().optional().refine(
      (v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 1),
      tc('mustBeWholeNumber'),
    ),
    newDate: z.string().optional(),
  });
}

type FormFields = z.infer<ReturnType<typeof buildSchema>>;

// What the parent receives — end_date is computed from recurrences before calling onSubmit
type SubmitValues = {
  editMode: EditMode;
  name: string;
  amount: string;
  category: 'income' | 'expense';
  tag?: string;
  frequency?: Frequency;
  end_date?: string;
  newDate?: string;
};

interface Props {
  tx: DayTransaction;
  occurrenceDate: string;   // the specific date this occurrence fired
  onSubmit: (values: SubmitValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}


export function RecurringEditForm({ tx, occurrenceDate, onSubmit, onCancel, isLoading }: Props) {
  const t = useTranslations('recurring');
  const tc = useTranslations('common');
  const tt = useTranslations('transactions');
  const tf = useTranslations('transactionForm');

  const SCOPE_OPTIONS = [
    {
      value: 'this_only' as const,
      label: t('justThisOne'),
      description: t('justThisOneDesc'),
    },
    {
      value: 'all_future' as const,
      label: t('thisAndAllFuture'),
      description: t('thisAndAllFutureDesc'),
    },
    {
      value: 'all' as const,
      label: t('allOccurrences'),
      description: t('allOccurrencesDesc'),
    },
  ];

  const schema = useMemo(() => buildSchema(tc), [tc]);

  // Back-compute recurrences from an existing end_date.
  // For display/default purposes we always measure from the series' original start_date.
  const initialRecurrences = (() => {
    if (!tx.end_date || !tx.start_date || !tx.frequency) return '';
    const n = computeRecurrencesFromEndDate(tx.start_date, tx.frequency, tx.end_date);
    return n != null ? String(n) : '';
  })();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      editMode: 'all_future',
      name: tx.name,
      amount: String(tx.amount),
      category: tx.category,
      tag: tx.tag ?? '',
      frequency: tx.frequency ?? 'monthly',
      recurrences: initialRecurrences,
      newDate: occurrenceDate,
    },
  });

  const editMode = watch('editMode');
  const tag = watch('tag');
  const category = watch('category');
  const frequency = watch('frequency');
  const recurrences = watch('recurrences');
  const canEditSeries = editMode === 'all_future' || editMode === 'all';

  const { allTags } = useSettings();

  const displayDate = format(new Date(occurrenceDate + 'T12:00:00'), 'd MMM yyyy');

  // Live preview: for all_future, count from the current occurrence;
  // for all, count from the series start date.
  const previewBase = editMode === 'all' ? tx.start_date : occurrenceDate;
  const computedEndDate = (() => {
    if (!recurrences || !frequency || !previewBase) return null;
    const n = parseInt(recurrences, 10);
    if (!Number.isFinite(n) || n < 1) return null;
    return computeEndDateFromRecurrences(previewBase, frequency as Frequency, n);
  })();

  return (
    <form
      onSubmit={handleSubmit((v) => {
        const base = v.editMode === 'all' ? tx.start_date : occurrenceDate;
        let end_date: string | undefined;
        if (v.recurrences && v.frequency && base) {
          const n = parseInt(v.recurrences, 10);
          if (Number.isFinite(n) && n >= 1) {
            end_date = computeEndDateFromRecurrences(base, v.frequency as Frequency, n);
          }
        }
        const { recurrences: _rec, newDate, ...rest } = v;
        // Only include newDate if the user actually changed it from the default
        const changedDate = newDate && newDate !== occurrenceDate ? newDate : undefined;
        onSubmit({ ...rest, editMode: rest.editMode as EditMode, end_date, newDate: changedDate });
      })}
      className="flex flex-col gap-1.5"
    >

      {/* Occurrence label */}
      <div className="rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1.5 flex items-center gap-3">
        <div>
          <p className="text-[9px] text-slate-400 dark:text-white/35 font-medium uppercase tracking-wider">{t('editTitle')}</p>
          <p className="text-[11px] font-semibold text-slate-800 dark:text-white leading-tight">{displayDate}</p>
        </div>
        {tx.frequency && (
          <p className="text-[9px] text-slate-400 dark:text-white/35 ml-auto">
            {FREQUENCIES[tx.frequency]}
          </p>
        )}
      </div>

      {/* Scope selector */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{t('deleteQuestion')}</p>
        {SCOPE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex items-start gap-2 p-1.5 rounded-2xl border cursor-pointer transition-all duration-100 active:bg-black/[0.03] dark:active:bg-white/[0.04]',
              editMode === opt.value
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-brand-primary/30 dark:hover:border-white/20',
            )}
          >
            <input type="radio" value={opt.value} {...register('editMode')} className="sr-only" />
            <div className={cn(
              'w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
              editMode === opt.value ? 'border-white' : 'border-slate-300',
            )}>
              {editMode === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <p className={cn('text-[11px] font-medium leading-tight', editMode === opt.value ? 'text-white' : 'text-slate-800 dark:text-white/90')}>
                {opt.label}
              </p>
              <p className={cn('text-[9px] mt-0.5', editMode === opt.value ? 'text-slate-300' : 'text-slate-400')}>
                {opt.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-white/[0.08]" />

      {/* Date field — visible for all modes except 'all' (which changes start_date via separate field) */}
      {editMode !== 'all' && (
        <Input
          id="newDate"
          type="date"
          label={editMode === 'this_only' ? t('moveToDate') : t('newStartDate')}
          className="h-7 text-[11px]"
          {...register('newDate')}
        />
      )}

      {/* Fields */}
      <Input
        id="name"
        label={tf('description')}
        error={errors.name?.message}
        className="h-8 text-xs"
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          id="amount"
          label={tf('amount')}
          type="number"
          step="0.01"
          min="0.01"
          error={errors.amount?.message}
          className="h-7 text-[11px]"
          {...register('amount')}
        />

        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{tf('type')}</p>
          <div className={cn(
            'flex rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 h-7',
            editMode === 'this_only' && 'pointer-events-none opacity-50',
          )}>
            {(['income', 'expense'] as const).map((cat) => (
              <label
                key={cat}
                className={cn(
                  'flex-1 flex items-center justify-center text-[10px] font-medium cursor-pointer transition-all',
                  watch('category') === cat
                    ? cat === 'income' ? 'bg-brand-positive text-white' : 'bg-brand-danger text-white'
                    : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
                )}
              >
                <input type="radio" value={cat} {...register('category')} className="sr-only" />
                {cat === 'income' ? '+ In' : '− Out'}
              </label>
            ))}
          </div>
          {editMode === 'this_only' && (
            <p className="text-[8px] text-slate-400 dark:text-white/30 pl-0.5 leading-tight">Can&apos;t change for one occurrence</p>
          )}
        </div>
      </div>

      {editMode === 'all' && (
        <TagDropdown
          allTags={allTags}
          category={category}
          selected={tag ?? ''}
          onSelect={(key) => setValue('tag', key === tag ? '' : key)}
          compact
        />
      )}

      {canEditSeries && (
        <>
          <Select
            id="frequency"
            label={tf('frequency')}
            options={Object.entries(FREQUENCIES).map(([value, label]) => ({ value, label }))}
            {...register('frequency')}
          />
          <div className="flex flex-col gap-0.5">
            <Input
              id="recurrences"
              label={tf('occurrences')}
              type="number"
              min="1"
              step="1"
              placeholder={tf('occurrencesPlaceholder')}
              error={errors.recurrences?.message}
              className="h-7 text-[11px]"
              {...register('recurrences')}
            />
            {computedEndDate && (
              <p className="text-[10px] text-slate-400 dark:text-white/40 pl-1">
                {tf('lastOccurrence', { date: format(new Date(computedEndDate + 'T12:00:00'), 'd MMM yyyy') })}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" loading={isLoading} className="flex-1">
          {tt('saveChanges')}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {tc('cancel')}
        </Button>
      </div>
    </form>
  );
}
