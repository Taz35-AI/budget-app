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

/**
 * Day cell — dense, flat. No card fill, no shadow, no border. The cell IS the
 * grid; emphasis comes from typography weight, the today/selected chip behind
 * the day number, and tiny dots below for transactions.
 */
export function DayCellContent({ date, balance, transactions, formatAmount, isSelected, isSearchMatch }: Props) {
  const tc = useTranslations('common');
  const today = isToday(date);
  const hasBalance = balance !== undefined;
  const isPositive = hasBalance && balance! > 0;
  const isNegative = hasBalance && balance! < 0;
  const count = transactions.length;

  return (
    <div
      className={cn(
        'relative flex flex-col h-full w-full overflow-hidden cursor-pointer px-2 py-1.5',
        'transition-colors duration-150',
        isSelected && 'bg-brand-primary/[0.06] dark:bg-brand-primary/[0.10]',
        isSearchMatch && !isSelected && 'bg-amber-400/[0.08]',
        !isSelected && 'hover:bg-brand-primary/[0.03] dark:hover:bg-white/[0.02]',
      )}
    >
      {/* Day number — chip when today/selected, plain otherwise */}
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            'inline-flex items-center justify-center font-display tabular-nums leading-none transition-colors',
            'text-[12px] font-semibold',
            today
              ? 'h-5 min-w-5 px-1 rounded-md bg-brand-primary text-white'
              : isSelected
              ? 'h-5 min-w-5 px-1 rounded-md ring-1 ring-brand-primary/40 text-brand-primary dark:text-teal-300'
              : 'text-brand-text/55 dark:text-white/40',
          )}
        >
          {format(date, 'd')}
        </span>

        {/* Transaction count — small numeric badge, top-right */}
        {count > 0 && (
          <span
            aria-label={tc('transactionsCount', { count })}
            className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-brand-primary/12 dark:bg-brand-primary/22 text-[9px] font-bold tabular-nums leading-none text-brand-primary dark:text-teal-300 ring-1 ring-brand-primary/15 dark:ring-brand-primary/30"
          >
            {count}
          </span>
        )}
      </div>

      {/* Balance — bottom-left. This is the number people scan the grid for, so
          it is set at full strength rather than dimmed: running balances were
          previously unreadable, especially zeros and adjacent-month days. */}
      {hasBalance && (
        <span
          className={cn(
            'mt-auto block max-w-full truncate text-[11px] font-bold tabular-nums leading-none font-display tracking-tight',
            isPositive && 'text-emerald-700 dark:text-emerald-300',
            isNegative && 'text-red-600 dark:text-red-400',
            !isPositive && !isNegative && 'text-brand-text/65 dark:text-white/70',
          )}
        >
          {formatAmount(balance!, { compact: true })}
        </span>
      )}

      {/* Search match — single dot top-right */}
      {isSearchMatch && !isSelected && (
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </div>
  );
}
