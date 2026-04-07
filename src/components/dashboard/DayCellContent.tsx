'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import type { DayTransaction } from '@/types';

interface Props {
  date: Date;
  balance: number | undefined;
  transactions: DayTransaction[];
  formatAmount: (n: number, opts?: { compact?: boolean }) => string;
  isSelected: boolean;
  isSearchMatch?: boolean;
}

export function DayCellContent({ date, balance, transactions, formatAmount, isSelected, isSearchMatch }: Props) {
  const tc = useTranslations('common');
  const today = isToday(date);
  const hasBalance = balance !== undefined;
  const isPositive = hasBalance && balance! > 0;
  const isNegative = hasBalance && balance! < 0;
  const isZero = hasBalance && balance === 0;
  const count = transactions.length;

  return (
    <div
      className={cn(
        'relative flex flex-col h-full w-full overflow-hidden cursor-pointer transition-all duration-200',
        'p-1.5 sm:p-2 rounded-xl sm:rounded-2xl',
        'border',
        // State backgrounds — VISIBLE color fills
        isPositive && !isSelected && 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30',
        isNegative && !isSelected && 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/30',
        isZero && !isSelected && 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/40 dark:border-white/[0.04]',
        !hasBalance && !isSelected && 'bg-white dark:bg-white/[0.01] border-transparent',
        // Today — bold ring + teal tint
        today && !isSelected && 'bg-teal-50 dark:bg-teal-950/40 !border-brand-primary/40 dark:!border-brand-primary/30 shadow-[0_0_0_1px_rgba(13,148,136,0.15),0_2px_8px_rgba(13,148,136,0.1)]',
        // Search match
        isSearchMatch && !isSelected && '!border-amber-400/70 dark:!border-amber-400/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)]',
        // Selected — bold brand fill
        isSelected && 'bg-brand-primary/[0.10] dark:bg-brand-primary/[0.15] border-brand-primary/60 shadow-[0_0_12px_rgba(13,148,136,0.2)]',
        // Hover
        !isSelected && 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
        'active:scale-[0.96]',
      )}
    >
      {/* Top row: day number + tx count */}
      <div className="flex items-start justify-between gap-0.5">
        <span className={cn(
          'text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full leading-none flex-shrink-0 font-display',
          today
            ? 'bg-gradient-to-br from-brand-primary to-teal-400 text-white shadow-[0_2px_8px_rgba(13,148,136,0.35)] text-[10px] sm:text-[11px]'
            : isSelected
            ? 'text-brand-primary font-extrabold'
            : 'text-brand-text/50 dark:text-white/35',
        )}>
          {format(date, 'd')}
        </span>

        {count > 0 && (
          <span className={cn(
            'text-[8px] font-bold leading-none px-1.5 py-[3px] rounded-full tabular-nums flex-shrink-0 font-display',
            isPositive
              ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
              : isNegative
              ? 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400'
              : 'bg-slate-200/60 text-slate-500 dark:bg-white/[0.06] dark:text-white/30',
          )}>
            {count}
          </span>
        )}
      </div>

      {/* Transaction names (desktop only) */}
      {count > 0 && (
        <div className="hidden sm:flex flex-col gap-[3px] mt-1 flex-1 overflow-hidden min-h-0">
          {transactions.slice(0, 2).map((tx) => (
            <div key={tx.id} className="flex items-center gap-[5px] min-w-0">
              <div className={cn(
                'w-1 h-1 rounded-full flex-shrink-0',
                tx.category === 'income' ? 'bg-emerald-500' : 'bg-red-500',
              )} />
              <span className="text-[8px] leading-snug text-brand-text/50 dark:text-white/30 truncate">
                {tx.name === 'Balance Adjustment' ? tc('balanceAdjustment') : tx.name}
              </span>
            </div>
          ))}
          {count > 2 && (
            <span className="text-[7px] text-brand-text/30 dark:text-white/40 pl-2 leading-none">
              +{count - 2}
            </span>
          )}
        </div>
      )}

      {/* Balance — BOLD */}
      {hasBalance && (
        <span className={cn(
          'mt-auto text-[9px] sm:text-[10px] font-extrabold tabular-nums leading-none font-display',
          isPositive && 'text-emerald-600 dark:text-emerald-400',
          isNegative && 'text-red-600 dark:text-red-400',
          isZero && 'text-slate-400 dark:text-white/30',
        )}>
          {formatAmount(balance!, { compact: true })}
        </span>
      )}

      {/* Search match dot */}
      {isSearchMatch && !isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
      )}

      {/* Bottom accent strip — thicker, more visible */}
      {hasBalance && !isSelected && (
        <div className={cn(
          'absolute bottom-0 inset-x-0 h-[3px]',
          isPositive && 'bg-gradient-to-r from-emerald-500/50 via-emerald-400/30 to-transparent',
          isNegative && 'bg-gradient-to-r from-red-500/50 via-red-400/30 to-transparent',
          isZero && 'bg-slate-300/30 dark:bg-white/[0.06]',
        )} />
      )}
    </div>
  );
}
