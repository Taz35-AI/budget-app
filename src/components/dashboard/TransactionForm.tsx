'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FREQUENCIES } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { computeEndDateFromRecurrences, computeRecurrencesFromEndDate } from '@/engine/recurringResolver';
import type { TransactionFormValues, Transaction, Frequency } from '@/types';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    amount: z.string().min(1, 'Amount is required').refine((v) => Number(v) > 0, 'Must be > 0'),
    category: z.enum(['income', 'expense']),
    type: z.enum(['recurring', 'one_off']),
    tag: z.string().optional(),
    date: z.string().optional(),
    start_date: z.string().optional(),
    frequency: z
      .enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'])
      .optional(),
    recurrences: z.string().optional().refine(
      (v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 1),
      'Must be a whole number ≥ 1',
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'one_off' && !data.date) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Date is required' });
    }
    if (data.type === 'recurring' && !data.start_date) {
      ctx.addIssue({ code: 'custom', path: ['start_date'], message: 'Start date is required' });
    }
    if (data.type === 'recurring' && !data.frequency) {
      ctx.addIssue({ code: 'custom', path: ['frequency'], message: 'Frequency is required' });
    }
  });

interface Props {
  defaultDate?: string;
  initialValues?: Partial<Transaction>;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  symbol: string;
  lockType?: boolean;
  compact?: boolean;
}

export function TransactionForm({ defaultDate, initialValues, onSubmit, onCancel, isLoading, symbol, lockType, compact }: Props) {
  // Back-compute recurrences from an existing end_date so the field pre-fills on edit
  const initialRecurrences = (() => {
    if (!initialValues?.end_date || !initialValues?.start_date || !initialValues?.frequency) return '';
    const n = computeRecurrencesFromEndDate(
      initialValues.start_date,
      initialValues.frequency as Frequency,
      initialValues.end_date,
    );
    return n != null ? String(n) : '';
  })();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? '',
      amount: initialValues?.amount?.toString() ?? '',
      category: (initialValues?.category ?? 'expense') as 'income' | 'expense',
      type: (initialValues?.type ?? 'one_off') as 'recurring' | 'one_off',
      tag: initialValues?.tag ?? '',
      date: initialValues?.date ?? defaultDate ?? '',
      start_date: initialValues?.start_date ?? defaultDate ?? '',
      frequency: (initialValues?.frequency ?? 'monthly') as Frequency,
      recurrences: initialRecurrences,
    },
  });

  const type = watch('type');
  const category = watch('category');
  const tag = watch('tag');
  const frequency = watch('frequency');
  const recurrences = watch('recurrences');
  const start_date = watch('start_date');

  // Live preview: compute the end date from recurrences
  const computedEndDate = React.useMemo(() => {
    if (!recurrences || !frequency || !start_date) return null;
    const n = parseInt(recurrences, 10);
    if (!Number.isFinite(n) || n < 1) return null;
    return computeEndDateFromRecurrences(start_date, frequency as Frequency, n);
  }, [recurrences, frequency, start_date]);

  const { allTags, templates } = useSettings();

  // Clear tag when switching income/expense if the current tag no longer applies
  const prevCategory = React.useRef(category);
  React.useEffect(() => {
    if (prevCategory.current === category) return;
    prevCategory.current = category;
    if (tag && allTags[tag]) {
      const tagCat = allTags[tag].category;
      if (tagCat !== 'both' && tagCat !== category) setValue('tag', '');
    }
  }, [category, tag, allTags, setValue]);

  return (
    <form
      onSubmit={handleSubmit((vals) => {
        // Convert recurrences → end_date before handing off to the parent
        const { recurrences: rec, ...rest } = vals;
        let end_date: string | undefined;
        if (rec && rest.frequency && rest.start_date) {
          const n = parseInt(rec, 10);
          if (Number.isFinite(n) && n >= 1) {
            end_date = computeEndDateFromRecurrences(rest.start_date, rest.frequency as Frequency, n);
          }
        }
        onSubmit({ ...rest, end_date } as TransactionFormValues);
      })}
      className={cn('flex flex-col', compact ? 'gap-1.5' : 'gap-4')}
    >
      {/* Template chips */}
      {templates.length > 0 && (
        <div className={cn('flex flex-col', compact ? 'gap-1' : 'gap-1.5')}>
          <p className={cn('font-bold uppercase tracking-widest text-brand-text/35 dark:text-white/25', compact ? 'text-[9px]' : 'text-[10px]')}>Quick fill</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setValue('name', tpl.name);
                  setValue('amount', tpl.amount.toString());
                  setValue('category', tpl.category);
                  setValue('type', tpl.type);
                  setValue('tag', tpl.tag ?? '');
                  if (tpl.frequency) setValue('frequency', tpl.frequency);
                }}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1 rounded-lg border border-brand-primary/15 dark:border-brand-primary/20 bg-white dark:bg-[#122928] font-medium text-brand-text/70 dark:text-white/60 hover:bg-brand-primary/6 dark:hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all',
                  compact ? 'h-6 px-2 text-[10px]' : 'h-7 px-2.5 text-xs',
                )}
              >
                {tpl.tag && allTags[tpl.tag] && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: allTags[tpl.tag].color }} />
                )}
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category toggle */}
      <div className="flex rounded-xl overflow-hidden border border-brand-primary/15 dark:border-brand-primary/20">
        {(['income', 'expense'] as const).map((cat) => (
          <label
            key={cat}
            className={cn(
              'flex-1 flex items-center justify-center font-semibold cursor-pointer transition-all',
              compact ? 'h-6 text-[10px]' : 'h-10 text-sm',
              category === cat
                ? cat === 'income'
                  ? 'bg-brand-positive text-white shadow-inner'
                  : 'bg-brand-danger text-white shadow-inner'
                : 'bg-white dark:bg-[#122928] text-brand-text/50 dark:text-white/35 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10',
            )}
          >
            <input type="radio" value={cat} {...register('category')} className="sr-only" />
            {cat === 'income' ? '+ Income' : '− Expense'}
          </label>
        ))}
      </div>

      {/* Type toggle — hidden when editing (type cannot change after creation) */}
      {lockType ? (
        <input type="hidden" {...register('type')} />
      ) : (
        <div className="flex rounded-xl overflow-hidden border border-brand-primary/15 dark:border-brand-primary/20">
          {(['one_off', 'recurring'] as const).map((t) => (
            <label
              key={t}
              className={cn(
                'flex-1 flex items-center justify-center font-semibold cursor-pointer transition-all',
                compact ? 'h-6 text-[10px]' : 'h-10 text-sm',
                type === t
                  ? 'bg-brand-primary text-white shadow-inner'
                  : 'bg-white dark:bg-[#122928] text-brand-text/50 dark:text-white/35 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10',
              )}
            >
              <input type="radio" value={t} {...register('type')} className="sr-only" />
              {t === 'one_off' ? 'One-off' : 'Recurring'}
            </label>
          ))}
        </div>
      )}

      <Input
        id="name"
        label="Description"
        placeholder="e.g. Monthly salary"
        error={errors.name?.message}
        className={compact ? 'h-7 text-[11px]' : undefined}
        {...register('name')}
      />

      <Input
        id="amount"
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        prefix={symbol}
        error={errors.amount?.message}
        className={compact ? 'h-7 text-[11px]' : undefined}
        {...register('amount')}
      />

      {/* Tag picker */}
      <div className={cn('flex flex-col', compact ? 'gap-1' : 'gap-2')}>
        <p className={cn('font-medium text-brand-text/80 dark:text-white/70', compact ? 'text-[10px]' : 'text-sm')}>Category (optional)</p>
        <div className={cn('flex flex-wrap', compact ? 'gap-1' : 'gap-1.5')}>
          {Object.entries(allTags)
            .filter(([, t]) => t.category === category || t.category === 'both')
            .map(([key, { label, color }]) => {
              const isSelected = tag === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setValue('tag', isSelected ? '' : key)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg font-medium transition-all border',
                    compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-xs',
                    isSelected
                      ? 'text-white border-transparent shadow-sm'
                      : 'border-brand-primary/15 dark:border-brand-primary/20 bg-white dark:bg-[#122928] text-brand-text/65 dark:text-white/55 hover:border-brand-primary/30 dark:hover:border-brand-primary/30 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10',
                  )}
                  style={isSelected ? { backgroundColor: color } : undefined}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  {label}
                </button>
              );
            })}
        </div>
      </div>

      {type === 'one_off' && (
        <Input
          id="date"
          label="Date"
          type="date"
          error={errors.date?.message}
          className={compact ? 'h-7 text-[11px]' : undefined}
          {...register('date')}
        />
      )}

      {type === 'recurring' && (
        <>
          <input type="hidden" {...register('start_date')} />
          <Select
            id="frequency"
            label="Frequency"
            error={errors.frequency?.message}
            options={Object.entries(FREQUENCIES).map(([value, label]) => ({ value, label }))}
            {...register('frequency')}
          />
          <div className="flex flex-col gap-1">
            <Input
              id="recurrences"
              label="Number of occurrences (optional)"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 12  — leave blank to repeat forever"
              error={errors.recurrences?.message}
              className={compact ? 'h-7 text-[11px]' : undefined}
              {...register('recurrences')}
            />
            {computedEndDate && (
              <p className={cn('text-brand-text/40 dark:text-white/35 pl-1', compact ? 'text-[10px]' : 'text-xs')}>
                Last occurrence: {format(new Date(computedEndDate + 'T12:00:00'), 'd MMM yyyy')}
              </p>
            )}
          </div>
        </>
      )}

      <div className={cn('flex gap-2', compact ? 'pt-1' : 'pt-2')}>
        <Button type="submit" size={compact ? 'sm' : 'md'} loading={isLoading} className="flex-1">
          {initialValues ? 'Save changes' : 'Add transaction'}
        </Button>
        <Button type="button" size={compact ? 'sm' : 'md'} variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
