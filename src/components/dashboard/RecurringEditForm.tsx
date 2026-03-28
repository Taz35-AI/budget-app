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
import { computeEndDateFromRecurrences, computeRecurrencesFromEndDate } from '@/engine/recurringResolver';
import { cn } from '@/lib/utils';
import type { EditMode } from '@/hooks/useTransactions';
import type { DayTransaction, Frequency } from '@/types';

const schema = z.object({
  editMode: z.enum(['this_only', 'all_future', 'all']),
  name: z.string().min(1, 'Required'),
  amount: z.string().min(1, 'Required').refine((v) => Number(v) > 0, 'Must be > 0'),
  category: z.enum(['income', 'expense']),
  tag: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual']).optional(),
  recurrences: z.string().optional().refine(
    (v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 1),
    'Must be a whole number ≥ 1',
  ),
});

type FormFields = z.infer<typeof schema>;

// What the parent receives — end_date is computed from recurrences before calling onSubmit
type SubmitValues = {
  editMode: EditMode;
  name: string;
  amount: string;
  category: 'income' | 'expense';
  tag?: string;
  frequency?: Frequency;
  end_date?: string;
};

interface Props {
  tx: DayTransaction;
  occurrenceDate: string;   // the specific date this occurrence fired
  onSubmit: (values: SubmitValues) => void;
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
        const { recurrences: _rec, ...rest } = v;
        onSubmit({ ...rest, editMode: rest.editMode as EditMode, end_date });
      })}
      className="flex flex-col gap-1.5"
    >

      {/* Occurrence label */}
      <div className="rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1.5 flex items-center gap-3">
        <div>
          <p className="text-[9px] text-slate-400 dark:text-white/35 font-medium uppercase tracking-wider">Editing</p>
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
        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">What do you want to change?</p>
        {SCOPE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex items-start gap-2 p-1.5 rounded-lg border cursor-pointer transition-all',
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

      {/* Fields */}
      <Input
        id="name"
        label="Description"
        error={errors.name?.message}
        className="h-8 text-xs"
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          id="amount"
          label="Amount"
          type="number"
          step="0.01"
          min="0.01"
          error={errors.amount?.message}
          className="h-7 text-[11px]"
          {...register('amount')}
        />

        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">Type</p>
          <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 h-7">
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
        </div>
      </div>

      {editMode === 'all' && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300">Category (optional)</p>
          <div className="flex flex-wrap gap-1">
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
                      'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium transition-all border',
                      isSelected
                        ? 'text-white border-transparent'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20',
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
      )}

      {canEditSeries && (
        <>
          <Select
            id="frequency"
            label="Frequency"
            options={Object.entries(FREQUENCIES).map(([value, label]) => ({ value, label }))}
            {...register('frequency')}
          />
          <div className="flex flex-col gap-0.5">
            <Input
              id="recurrences"
              label="Occurrences (optional)"
              type="number"
              min="1"
              step="1"
              placeholder="Leave blank to repeat forever"
              error={errors.recurrences?.message}
              className="h-7 text-[11px]"
              {...register('recurrences')}
            />
            {computedEndDate && (
              <p className="text-[10px] text-slate-400 dark:text-white/40 pl-1">
                Last: {format(new Date(computedEndDate + 'T12:00:00'), 'd MMM yyyy')}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" loading={isLoading} className="flex-1">
          Save changes
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
