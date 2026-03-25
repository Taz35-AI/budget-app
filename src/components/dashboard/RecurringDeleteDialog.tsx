'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { FREQUENCIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DeleteMode } from '@/hooks/useTransactions';
import type { DayTransaction } from '@/types';

const SCOPE_OPTIONS = [
  {
    value: 'this_only' as DeleteMode,
    label: 'This occurrence only',
    description: 'Only removed on this date. Continues before and after.',
    color: 'amber',
  },
  {
    value: 'all_future' as DeleteMode,
    label: 'This and all future',
    description: 'Removed from this date onwards. Past occurrences kept.',
    color: 'orange',
  },
  {
    value: 'all' as DeleteMode,
    label: 'Entire series',
    description: 'All occurrences deleted permanently — including past.',
    color: 'red',
  },
] as const;

interface Props {
  tx: DayTransaction;
  occurrenceDate: string;
  onConfirm: (deleteMode: DeleteMode) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RecurringDeleteDialog({ tx, occurrenceDate, onConfirm, onCancel, isLoading }: Props) {
  const [selected, setSelected] = useState<DeleteMode>('all_future');
  const displayDate = format(new Date(occurrenceDate + 'T12:00:00'), 'd MMM yyyy');

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
        <p className="text-xs text-red-500 font-medium uppercase tracking-wider mb-0.5">Deleting</p>
        <p className="text-sm font-semibold text-slate-800">{tx.name}</p>
        {tx.frequency && (
          <p className="text-xs text-slate-400 mt-0.5">
            {FREQUENCIES[tx.frequency]} · occurrence on {displayDate}
          </p>
        )}
      </div>

      {/* Scope options */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-700">What do you want to delete?</p>
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border text-left transition-all w-full',
              selected === opt.value
                ? opt.color === 'red'
                  ? 'border-red-500 bg-red-500 text-white'
                  : opt.color === 'orange'
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-amber-500 bg-amber-500 text-white'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
              selected === opt.value ? 'border-white' : 'border-slate-300',
            )}>
              {selected === opt.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div>
              <p className={cn(
                'text-sm font-medium',
                selected === opt.value ? 'text-white' : 'text-slate-800',
              )}>
                {opt.label}
              </p>
              <p className={cn(
                'text-xs mt-0.5',
                selected === opt.value ? 'text-white/70' : 'text-slate-400',
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
          Delete
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
