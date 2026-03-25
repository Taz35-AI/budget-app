'use client';

import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import type { DayTransaction } from '@/types';

interface Props {
  date: Date;
  balance: number | undefined;
  transactions: DayTransaction[];
  formatAmount: (n: number, opts?: { compact?: boolean }) => string;
  isSelected: boolean;
}

export function DayCellContent({ date, balance, transactions, formatAmount, isSelected }: Props) {
  const today = isToday(date);
  const hasBalance = balance !== undefined;
  const isPositive = hasBalance && balance! > 0;
  const isNegative = hasBalance && balance! < 0;
  const isZero = hasBalance && balance === 0;
  const count = transactions.length;
  const visible = transactions.slice(0, 3);
  const overflow = count - visible.length;

  return (
    <div
      className={cn(
        'relative flex flex-col h-full w-full cursor-pointer rounded-[0.75rem] p-1.5 transition-all duration-150',
        'active:scale-[0.96]',
        // Background states
        hasBalance && isPositive && 'bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/20',
        hasBalance && isNegative && 'bg-gradient-to-br from-red-50 to-rose-50/60 dark:from-red-950/40 dark:to-rose-950/20',
        hasBalance && isZero && 'bg-slate-50 dark:bg-slate-800/30',
        !hasBalance && 'bg-white dark:bg-[#141e33]',
        // Hover brightness
        !isSelected && 'hover:brightness-[0.97] dark:hover:brightness-110',
        // Today ring
        today && !isSelected && 'ring-2 ring-slate-900/80 dark:ring-white/60 shadow-sm',
        // Selected
        isSelected && 'ring-2 ring-indigo-500 bg-indigo-50/80 dark:ring-indigo-400 dark:bg-indigo-900/30 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]',
      )}
    >
      {/* Top row: day number + transaction count badge */}
      <div className="flex items-start justify-between gap-0.5">
        <span
          className={cn(
            'text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 leading-none',
            today
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : isSelected
              ? 'text-indigo-600 dark:text-indigo-300'
              : 'text-slate-500 dark:text-slate-400',
          )}
        >
          {format(date, 'd')}
        </span>
        {count > 0 && (
          <span className={cn(
            'text-[9px] font-bold leading-none px-1 py-0.5 rounded-md flex-shrink-0 tabular-nums',
            isPositive
              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
              : isNegative
              ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
              : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400',
          )}>
            {count}
          </span>
        )}
      </div>

      {/* Transaction names */}
      {count > 0 && (
        <div className="mt-0.5 flex flex-col gap-[3px] flex-1 overflow-hidden">
          {visible.map((tx) => (
            <div key={tx.id} className="flex items-center gap-0.5 min-w-0">
              <div className={cn(
                'w-[3px] h-[3px] rounded-full flex-shrink-0',
                tx.category === 'income' ? 'bg-emerald-400' : 'bg-red-400',
              )} />
              <span className="text-[8px] sm:text-[9px] leading-tight text-slate-600 dark:text-slate-400 truncate font-medium">
                {tx.name}
              </span>
            </div>
          ))}
          {overflow > 0 && (
            <span className="text-[7px] sm:text-[8px] text-slate-400 dark:text-slate-500 leading-tight pl-1.5">
              +{overflow} more
            </span>
          )}
        </div>
      )}

      {/* Balance */}
      {hasBalance && (
        <span
          className={cn(
            'text-[9px] sm:text-[10px] font-extrabold leading-none tabular-nums text-right mt-auto pt-0.5',
            isPositive && 'text-emerald-700 dark:text-emerald-400',
            isNegative && 'text-red-600 dark:text-red-400',
            isZero && 'text-slate-400 dark:text-slate-500',
          )}
        >
          {formatAmount(balance!, { compact: true })}
        </span>
      )}

      {/* Subtle bottom accent for cells with balance */}
      {hasBalance && !isSelected && (
        <div className={cn(
          'absolute bottom-0 inset-x-0 h-[2px] rounded-b-[0.75rem]',
          isPositive && 'bg-gradient-to-r from-emerald-400/60 to-teal-400/60',
          isNegative && 'bg-gradient-to-r from-red-400/60 to-rose-400/60',
          isZero && 'bg-slate-200/80 dark:bg-white/10',
        )} />
      )}
    </div>
  );
}
