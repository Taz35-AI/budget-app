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
}

export function TransactionForm({ defaultDate, initialValues, onSubmit, onCancel, isLoading, symbol, lockType }: Props) {
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
      className="flex flex-col gap-4"
    >
      {/* Template chips */}
      {templates.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">Quick fill</p>
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
                className="flex-shrink-0 flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all"
              >
                {tpl.tag && allTags[tpl.tag] && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: allTags[tpl.tag].color }} />
                )}
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Category toggle */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
        {(['income', 'expense'] as const).map((cat) => (
          <label
            key={cat}
            className={cn(
              'flex-1 flex items-center justify-center h-10 text-sm font-medium cursor-pointer transition-all',
              category === cat
                ? cat === 'income'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
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
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
          {(['one_off', 'recurring'] as const).map((t) => (
            <label
              key={t}
              className={cn(
                'flex-1 flex items-center justify-center h-10 text-sm font-medium cursor-pointer transition-all',
                type === t ? 'bg-slate-900 text-white' : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
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
        {...register('amount')}
      />

      {/* Tag picker — filtered to match the selected income/expense */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Category (optional)</p>
        <div className="flex flex-wrap gap-1.5">
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
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                    isSelected
                      ? 'text-white border-transparent'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10',
                  )}
                  style={isSelected ? { backgroundColor: color } : undefined}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
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
          {...register('date')}
        />
      )}

      {type === 'recurring' && (
        <>
          {/* start_date is silently set to the clicked day — no need to show it */}
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
              {...register('recurrences')}
            />
            {computedEndDate && (
              <p className="text-xs text-slate-400 dark:text-white/40 pl-1">
                Last occurrence: {format(new Date(computedEndDate + 'T12:00:00'), 'd MMM yyyy')}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={isLoading} className="flex-1">
          {initialValues ? 'Save changes' : 'Add transaction'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
