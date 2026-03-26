'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FREQUENCIES } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import type { EditMode } from '@/hooks/useTransactions';
import type { DayTransaction } from '@/types';

const schema = z.object({
  editMode: z.enum(['this_only', 'all_future', 'all']),
  name: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required').refine((v) => Number(v) > 0, 'Must be > 0'),
  category: z.enum(['income', 'expense']),
  tag: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual']).optional(),
  end_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  tx: DayTransaction;
  occurrenceDate: string;   // the specific date this occurrence fired
  onSubmit: (values: FormValues & { editMode: EditMode }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SCOPE_OPTIONS = [
  {
    value: 'this_only',
    label: 'This occurrence only',
    description: 'Only this date changes. Before and after stay the same.',
  },
  {
    value: 'all_future',
    label: 'This and all future',
    description: 'From this date forward. Past occurrences are unchanged.',
  },
  {
    value: 'all',
    label: 'Entire series',
    description: 'Every occurrence — past and future — is updated.',
  },
] as const;

export function RecurringEditForm({ tx, occurrenceDate, onSubmit, onCancel, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      editMode: 'all_future',
      name: tx.name,
      amount: String(tx.amount),
      category: tx.category,
      tag: tx.tag ?? '',
      frequency: tx.frequency ?? 'monthly',
      end_date: tx.end_date ?? '',
    },
  });

  const editMode = watch('editMode');
  const tag = watch('tag');
  const category = watch('category');
  const canEditSeries = editMode === 'all_future' || editMode === 'all';

  const { allTags } = useSettings();

  const displayDate = format(new Date(occurrenceDate + 'T12:00:00'), 'd MMM yyyy');

  return (
    <form onSubmit={handleSubmit((v) => onSubmit({ ...v, editMode: v.editMode as EditMode }))} className="flex flex-col gap-4">

      {/* Occurrence label */}
      <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3">
        <p className="text-xs text-slate-500 dark:text-white/40 font-medium uppercase tracking-wider mb-0.5">Editing occurrence on</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-white">{displayDate}</p>
        {tx.frequency && (
          <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
            {FREQUENCIES[tx.frequency]} · {tx.category === 'income' ? 'Income' : 'Expense'}
          </p>
        )}
      </div>

      {/* Scope selector */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">What do you want to change?</p>
        {SCOPE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
              editMode === opt.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20',
            )}
          >
            <input
              type="radio"
              value={opt.value}
              {...register('editMode')}
              className="sr-only"
            />
            <div className={cn(
              'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
              editMode === opt.value ? 'border-white' : 'border-slate-300',
            )}>
              {editMode === opt.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div>
              <p className={cn('text-sm font-medium', editMode === opt.value ? 'text-white' : 'text-slate-800 dark:text-white/90')}>
                {opt.label}
              </p>
              <p className={cn('text-xs mt-0.5', editMode === opt.value ? 'text-slate-300' : 'text-slate-400')}>
                {opt.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-white/[0.08]" />

      {/* Fields */}
      <Input
        id="name"
        label="Description"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="amount"
          label="Amount"
          type="number"
          step="0.01"
          min="0.01"
          error={errors.amount?.message}
          {...register('amount')}
        />

        {/* Category toggle — compact */}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</p>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 h-10">
            {(['income', 'expense'] as const).map((cat) => (
              <label
                key={cat}
                className={cn(
                  'flex-1 flex items-center justify-center text-xs font-medium cursor-pointer transition-all',
                  watch('category') === cat
                    ? cat === 'income' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
                )}
              >
                <input type="radio" value={cat} {...register('category')} className="sr-only" />
                {cat === 'income' ? '+ In' : '− Out'}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Tag — only editable when changing entire series, filtered by income/expense */}
      {editMode === 'all' && (
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
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20',
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
      )}

      {/* Frequency + end date only for series-level edits */}
      {canEditSeries && (
        <>
          <Select
            id="frequency"
            label="Frequency"
            options={Object.entries(FREQUENCIES).map(([value, label]) => ({ value, label }))}
            {...register('frequency')}
          />
          <Input
            id="end_date"
            label="End date (optional)"
            type="date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={isLoading} className="flex-1">
          Save changes
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
