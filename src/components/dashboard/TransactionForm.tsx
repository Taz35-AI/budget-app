'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FREQUENCIES, TAGS } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { useTransactions } from '@/hooks/useTransactions';
import { computeEndDateFromRecurrences, computeRecurrencesFromEndDate } from '@/engine/recurringResolver';
import type { TransactionFormValues, Transaction, Frequency } from '@/types';
import { cn } from '@/lib/utils';

// ─── Tag dropdown ─────────────────────────────────────────────────────────────

interface TagDropdownProps {
  allTags: Record<string, { label: string; color: string; category: string }>;
  category: 'income' | 'expense';
  selected: string;
  onSelect: (key: string) => void;
  error?: string;
  compact?: boolean;
}

export function TagDropdown({ allTags, category, selected, onSelect, error, compact }: TagDropdownProps) {
  const t = useTranslations('transactionForm');
  const tTags = useTranslations('tags');
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  const allForCategory = Object.entries(allTags).filter(
    ([, tag]) => tag.category === category || tag.category === 'both',
  );
  const filteredTags = search
    ? allForCategory.filter(([key, tag]) => {
        const displayLabel = TAGS[key] ? tTags(key as never) : tag.label;
        return displayLabel.toLowerCase().includes(search.toLowerCase());
      })
    : allForCategory;
  const selectedTag = selected ? allTags[selected] : null;

  return (
    <div ref={ref} className={cn('flex flex-col', compact ? 'gap-1' : 'gap-1.5')}>
      <div className="flex items-center justify-between">
        <p className={cn('font-medium text-brand-text/80 dark:text-white/70', compact ? 'text-[10px]' : 'text-sm')}>
          {t('category')}
        </p>
        {error && (
          <p className={cn('text-brand-danger', compact ? 'text-[9px]' : 'text-xs')}>{error}</p>
        )}
      </div>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 rounded-xl border transition-all',
          compact ? 'h-7 px-2.5 text-[11px]' : 'h-10 px-3 text-sm',
          error
            ? 'border-brand-danger/40 bg-red-50 dark:bg-red-900/10'
            : open
            ? 'border-brand-primary/40 bg-brand-primary/5 dark:bg-brand-primary/10'
            : 'border-brand-primary/15 dark:border-brand-primary/20 bg-white dark:bg-[#042F2E]',
        )}
      >
        {selectedTag ? (
          <>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selectedTag.color }} />
            <span className="flex-1 text-left font-medium text-brand-text dark:text-white/90 truncate">{selected && TAGS[selected] ? tTags(selected as never) : selectedTag.label}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-brand-text/40 dark:text-white/35">{t('selectCategory')}</span>
        )}
        <svg
          className={cn('w-3.5 h-3.5 text-brand-text/30 dark:text-white/25 flex-shrink-0 transition-transform', open && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="rounded-xl border border-brand-primary/15 dark:border-brand-primary/20 bg-white dark:bg-[#042F2E] shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="px-2.5 py-2 border-b border-brand-primary/[0.06] dark:border-white/[0.04]">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-text/30 dark:text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className={cn(
                  'w-full pl-7 pr-2 rounded-lg bg-brand-primary/5 dark:bg-white/5 border border-transparent focus:border-brand-primary/25 text-brand-text dark:text-white/90 placeholder:text-brand-text/30 dark:placeholder:text-white/25 outline-none',
                  compact ? 'h-6 text-[10px]' : 'h-7 text-xs',
                )}
              />
            </div>
          </div>
          <ul className="max-h-40 overflow-y-auto divide-y divide-brand-primary/[0.06] dark:divide-white/[0.04]">
            {filteredTags.length === 0 && (
              <li className={cn('px-3 text-brand-text/35 dark:text-white/30 italic', compact ? 'py-2 text-[10px]' : 'py-2.5 text-xs')}>
                {t('noCategoriesMatch')}
              </li>
            )}
            {filteredTags.map(([key, { label, color }]) => {
              const isSelected = selected === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => { onSelect(key); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 transition-colors',
                      compact ? 'h-8 text-[11px]' : 'h-9 text-sm',
                      isSelected
                        ? 'bg-brand-primary/8 dark:bg-brand-primary/12'
                        : 'hover:bg-brand-primary/5 dark:hover:bg-brand-primary/8',
                    )}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className={cn('flex-1 text-left truncate', isSelected ? 'font-semibold text-brand-primary' : 'font-medium text-brand-text/80 dark:text-white/75')}>
                      {TAGS[key] ? tTags(key as never) : label}
                    </span>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────

function buildSchema(t: (key: string) => string, tc: (key: string) => string) {
  return z
    .object({
      name: z.string().min(1, t('nameRequired')),
      amount: z.string().min(1, t('amountRequired')).refine((v) => Number(v) > 0, tc('mustBePositive')),
      category: z.enum(['income', 'expense']),
      type: z.enum(['recurring', 'one_off']),
      tag: z.string().min(1, t('categoryRequired')),
      date: z.string().optional(),
      start_date: z.string().optional(),
      frequency: z
        .enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'])
        .optional(),
      recurrences: z.string().optional().refine(
        (v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 1),
        tc('mustBeWholeNumber'),
      ),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'one_off' && !data.date) {
        ctx.addIssue({ code: 'custom', path: ['date'], message: t('dateRequired') });
      }
      if (data.type === 'recurring' && !data.start_date) {
        ctx.addIssue({ code: 'custom', path: ['start_date'], message: t('startDateRequired') });
      }
      if (data.type === 'recurring' && !data.frequency) {
        ctx.addIssue({ code: 'custom', path: ['frequency'], message: t('frequencyRequired') });
      }
    });
}

interface Props {
  defaultDate?: string;
  initialValues?: Partial<Transaction>;
  isDuplicate?: boolean;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  symbol: string;
  lockType?: boolean;
  compact?: boolean;
  isCreditAccount?: boolean;
  creditLimit?: number | null;
  onTransfer?: () => void;
}

export function TransactionForm({ defaultDate, initialValues, isDuplicate, onSubmit, onCancel, isLoading, symbol, lockType, compact, isCreditAccount, creditLimit, onTransfer }: Props) {
  const t = useTranslations('transactionForm');
  const tc = useTranslations('common');
  const tt = useTranslations('transactions');

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

  const schema = React.useMemo(() => buildSchema(t, tc), [t, tc]);

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
  const nameValue = watch('name');
  const amountValue = watch('amount');

  const overCreditLimit =
    isCreditAccount && creditLimit != null && Number(amountValue) > creditLimit;

  // Credit card accounts can only have expenses — force it and keep it locked
  React.useEffect(() => {
    if (isCreditAccount && category !== 'expense') {
      setValue('category', 'expense');
    }
  }, [isCreditAccount, category, setValue]);
  const frequency = watch('frequency');
  const recurrences = watch('recurrences');
  const start_date = watch('start_date');

  // Smart name suggestions
  const { data: txData } = useTransactions();
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const suggestions = React.useMemo(() => {
    if (!nameValue || nameValue.length < 2 || !txData?.transactions) return [];
    const lower = nameValue.toLowerCase();
    const seen = new Set<string>();
    return txData.transactions
      .filter((t) => {
        const key = `${t.name}|${t.category}|${t.tag ?? ''}`;
        if (!t.name.toLowerCase().includes(lower) || t.name.toLowerCase() === lower) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  }, [nameValue, txData?.transactions]);

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
      {/* Context banner — shown when editing or duplicating */}
      {initialValues?.name && (
        <div className={cn(
          'rounded-lg border px-2.5 py-1.5 flex items-center gap-2',
          isDuplicate
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30'
            : 'bg-brand-primary/5 dark:bg-brand-primary/10 border-brand-primary/15 dark:border-brand-primary/20',
        )}>
          {isDuplicate ? (
            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-brand-primary/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          )}
          <div className="min-w-0">
            <p className={cn(
              'text-[9px] font-medium uppercase tracking-wider',
              isDuplicate ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-primary/60 dark:text-brand-primary/50',
            )}>
              {isDuplicate ? t('duplicatingLabel') : t('editingLabel')}
            </p>
            <p className="text-[11px] font-semibold text-brand-text dark:text-white/90 truncate">{initialValues.name}</p>
          </div>
        </div>
      )}
      {/* Template chips */}
      {templates.length > 0 && (
        <div className={cn('flex flex-col', compact ? 'gap-1' : 'gap-1.5')}>
          <p className={cn('font-bold uppercase tracking-widest text-brand-text/35 dark:text-white/25', compact ? 'text-[9px]' : 'text-[10px]')}>{t('quickFill')}</p>
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
                  'flex-shrink-0 flex items-center gap-1 rounded-lg border border-brand-primary/15 dark:border-brand-primary/20 bg-white dark:bg-[#042F2E] font-medium text-brand-text/70 dark:text-white/60 hover:bg-brand-primary/6 dark:hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all',
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

      {/* Category toggle — credit accounts only show expense */}
      {isCreditAccount ? (
        <div className="flex flex-col gap-2">
          <div className={cn(
            'flex items-center justify-center rounded-xl font-semibold',
            compact ? 'h-6 text-[10px]' : 'h-10 text-sm',
            'bg-brand-danger text-white',
          )}>
            <input type="hidden" {...register('category')} value="expense" />
            {t('expense')}
          </div>
          {onTransfer && (
            <button
              type="button"
              onClick={onTransfer}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl font-semibold border transition-all',
                compact ? 'h-6 text-[10px]' : 'h-10 text-sm',
                'border-brand-primary/30 dark:border-brand-primary/40 text-brand-primary dark:text-brand-positive',
                'hover:bg-brand-primary/8 dark:hover:bg-brand-primary/15',
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {t('payViaTransfer')}
            </button>
          )}
        </div>
      ) : (
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
                  : 'bg-white dark:bg-[#042F2E] text-brand-text/50 dark:text-white/35 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10',
              )}
            >
              <input type="radio" value={cat} {...register('category')} className="sr-only" />
              {cat === 'income' ? t('income') : t('expense')}
            </label>
          ))}
        </div>
      )}

      {/* Type toggle — hidden when editing (type cannot change after creation) */}
      {lockType ? (
        <input type="hidden" {...register('type')} />
      ) : (
        <div className="flex rounded-xl overflow-hidden border border-brand-primary/15 dark:border-brand-primary/20">
          {(['one_off', 'recurring'] as const).map((txType) => (
            <label
              key={txType}
              className={cn(
                'flex-1 flex items-center justify-center font-semibold cursor-pointer transition-all',
                compact ? 'h-6 text-[10px]' : 'h-10 text-sm',
                type === txType
                  ? 'bg-brand-primary text-white shadow-inner'
                  : 'bg-white dark:bg-[#042F2E] text-brand-text/50 dark:text-white/35 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10',
              )}
            >
              <input type="radio" value={txType} {...register('type')} className="sr-only" />
              {txType === 'one_off' ? t('oneOff') : t('recurring')}
            </label>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Input
          id="amount"
          label={t('amount')}
          type="number"
          step="0.01"
          min="0"
          placeholder={t('amountPlaceholder')}
          prefix={symbol}
          error={errors.amount?.message}
          className={compact ? 'h-7 text-[11px]' : undefined}
          {...register('amount')}
        />
        {overCreditLimit && (
          <p className={cn('text-amber-600 dark:text-amber-400 pl-1', compact ? 'text-[10px]' : 'text-xs')}>
            {t('overCreditLimit', { limit: `${symbol}${creditLimit}` })}
          </p>
        )}
      </div>

      <div className="relative">
        <Input
          id="name"
          label={t('description')}
          placeholder={t('descriptionPlaceholder')}
          error={errors.name?.message}
          className={compact ? 'h-7 text-[11px]' : undefined}
          {...register('name')}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-brand-primary/15 dark:border-brand-primary/20 bg-white dark:bg-[#042F2E] shadow-lg overflow-hidden">
            {suggestions.map((t) => (
              <li key={`${t.id}`}>
                <button
                  type="button"
                  onMouseDown={() => {
                    setValue('name', t.name);
                    setValue('amount', String(t.amount));
                    setValue('category', t.category as 'income' | 'expense');
                    if (t.tag) setValue('tag', t.tag);
                    setShowSuggestions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 transition-colors"
                >
                  <span className="flex-1 text-sm text-brand-text dark:text-white/80 truncate">{t.name}</span>
                  <span className={cn('text-xs font-semibold flex-shrink-0', t.category === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                    {t.category === 'income' ? '+' : '−'}{t.amount}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tag picker — scrollable dropdown */}
      <TagDropdown
        allTags={allTags}
        category={category}
        selected={tag ?? ''}
        onSelect={(key) => setValue('tag', key)}
        error={errors.tag?.message}
        compact={compact}
      />

      {type === 'one_off' && (
        <Input
          id="date"
          label={t('date')}
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
            label={t('frequency')}
            error={errors.frequency?.message}
            options={Object.entries(FREQUENCIES).map(([value, label]) => ({ value, label }))}
            {...register('frequency')}
          />
          <div className="flex flex-col gap-1">
            <Input
              id="recurrences"
              label={t('occurrences')}
              type="number"
              min="1"
              step="1"
              placeholder={t('occurrencesPlaceholder')}
              error={errors.recurrences?.message}
              className={compact ? 'h-7 text-[11px]' : undefined}
              {...register('recurrences')}
            />
            {computedEndDate && (
              <p className={cn('text-brand-text/40 dark:text-white/35 pl-1', compact ? 'text-[10px]' : 'text-xs')}>
                {t('lastOccurrence', { date: format(new Date(computedEndDate + 'T12:00:00'), 'd MMM yyyy') })}
              </p>
            )}
          </div>
        </>
      )}

      <div className={cn('flex gap-2', compact ? 'pt-1' : 'pt-2')}>
        <Button type="submit" size={compact ? 'sm' : 'md'} loading={isLoading} className="flex-1">
          {initialValues ? tt('saveChanges') : tt('addTransaction')}
        </Button>
        <Button type="button" size={compact ? 'sm' : 'md'} variant="ghost" onClick={onCancel}>
          {tc('cancel')}
        </Button>
      </div>
    </form>
  );
}
