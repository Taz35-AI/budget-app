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
        'relative flex flex-col h-full w-full overflow-hidden cursor-pointer transition-all duration-150',
        'p-1.5 sm:p-2 rounded-xl sm:rounded-2xl',
        // Base card
        'bg-brand-card dark:bg-[#15152E]/80',
        'border border-transparent',
        // State backgrounds
        isPositive && !isSelected && 'bg-gradient-to-br from-brand-primary/[0.06] to-brand-positive/[0.03] dark:from-brand-primary/[0.08] dark:to-brand-positive/[0.04]',
        isNegative && !isSelected && 'bg-gradient-to-br from-brand-danger/[0.06] to-brand-danger/[0.03] dark:from-brand-danger/[0.10] dark:to-brand-danger/[0.05]',
        isZero && !isSelected && 'bg-brand-bg/60 dark:bg-[#0C0C1A]/40',
        !hasBalance && 'bg-white/70 dark:bg-[#15152E]/40',
        // Today
        today && !isSelected && 'border-brand-primary/25 dark:border-brand-primary/30 shadow-[inset_0_0_0_1px_rgba(59,122,120,0.15)]',
        // Search match
        isSearchMatch && !isSelected && 'border-amber-400/70 dark:border-amber-400/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)] dark:shadow-[0_0_0_2px_rgba(251,191,36,0.15)]',
        // Selected
        isSelected && 'bg-brand-primary/10 dark:bg-brand-primary/[0.12] border-brand-primary/60 shadow-[0_0_0_2px_rgba(59,122,120,0.15)]',
        // Hover
        !isSelected && 'hover:border-brand-primary/20 dark:hover:border-brand-primary/20 hover:shadow-sm',
        'active:scale-[0.97]',
      )}
    >
      {/* ── Top row: day number + tx count ── */}
      <div className="flex items-start justify-between gap-0.5">
        <span className={cn(
          'text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full leading-none flex-shrink-0',
          today
            ? 'bg-brand-primary text-white shadow-sm text-[10px] sm:text-[11px]'
            : isSelected
            ? 'text-brand-primary font-extrabold'
            : 'text-brand-text/45 dark:text-white/30',
        )}>
          {format(date, 'd')}
        </span>

        {count > 0 && (
          <span className={cn(
            'text-[8px] font-bold leading-none px-1 py-[3px] rounded-md tabular-nums flex-shrink-0',
            isPositive
              ? 'bg-brand-primary/12 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-positive'
              : isNegative
              ? 'bg-brand-danger/12 text-brand-danger dark:bg-brand-danger/20'
              : 'bg-brand-text/6 text-brand-text/40 dark:bg-white/8 dark:text-white/25',
          )}>
            {count}
          </span>
        )}
      </div>

      {/* ── Transaction names (desktop only) ── */}
      {count > 0 && (
        <div className="hidden sm:flex flex-col gap-[3px] mt-1 flex-1 overflow-hidden min-h-0">
          {transactions.slice(0, 2).map((tx) => (
            <div key={tx.id} className="flex items-center gap-[5px] min-w-0">
              <div className={cn(
                'w-[3px] h-[3px] rounded-full flex-shrink-0 mt-px',
                tx.category === 'income' ? 'bg-brand-positive' : 'bg-brand-danger',
              )} />
              <span className="text-[8px] leading-snug text-brand-text/55 dark:text-white/30 truncate">
                {tx.name === 'Balance Adjustment' ? tc('balanceAdjustment') : tx.name}
              </span>
            </div>
          ))}
          {count > 2 && (
            <span className="text-[7px] text-brand-text/30 dark:text-white/20 pl-2 leading-none">
              +{count - 2}
            </span>
          )}
        </div>
      )}

      {/* ── Balance ── */}
      {hasBalance && (
        <span className={cn(
          'mt-auto text-[9px] sm:text-[10px] font-extrabold tabular-nums leading-none',
          isPositive && 'text-brand-primary dark:text-brand-positive',
          isNegative && 'text-brand-danger',
          isZero && 'text-brand-text/25 dark:text-white/20',
        )}>
          {formatAmount(balance!, { compact: true })}
        </span>
      )}

      {/* ── Search match indicator ── */}
      {isSearchMatch && !isSelected && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
      )}

      {/* ── Bottom accent strip ── */}
      {hasBalance && !isSelected && (
        <div className={cn(
          'absolute bottom-0 inset-x-0 h-[2px] rounded-b-xl',
          isPositive && 'bg-gradient-to-r from-brand-primary/35 via-brand-positive/30 to-transparent',
          isNegative && 'bg-gradient-to-r from-brand-danger/40 to-transparent',
          isZero && 'bg-brand-text/8 dark:bg-white/8',
        )} />
      )}
    </div>
  );
}
