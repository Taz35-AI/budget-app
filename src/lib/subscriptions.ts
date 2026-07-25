import type { Transaction, TransactionException, Frequency } from '@/types';
import { resolveTransactionOnDate } from '@/engine/exceptionResolver';

/**
 * Multiplier that converts a per-occurrence amount at a given frequency into an
 * equivalent monthly cost. Weekly/daily use average-length months so the annual
 * figure (monthlyCost × 12) stays accurate.
 */
export const MONTHLY_FACTOR: Record<Frequency, number> = {
  daily: 30.44, weekly: 4.35, biweekly: 2.17,
  monthly: 1, quarterly: 1 / 3, semiannual: 1 / 6, annual: 1 / 12,
};

export interface ResolvedSubscription extends Transaction {
  freq: Frequency;
  /** Amount per occurrence, with any exception override applied as of today. */
  amount: number;
  monthlyCost: number;
}

/**
 * Active recurring transactions with their *current* effective amount.
 *
 * A "this & all future" amount edit is stored as an exception, not on the base
 * transaction row (see PATCH /api/transactions/[id], editMode 'all_future').
 * Reading `tx.amount` directly therefore shows the pre-edit price forever, so
 * every occurrence is resolved through the exception layer as of `todayStr`.
 * Series cancelled on or before today (a delete-all-future exception) drop out.
 */
export function resolveSubscriptions(
  transactions: Transaction[],
  exceptions: TransactionException[],
  todayStr: string,
): ResolvedSubscription[] {
  return transactions
    .filter((tx) => tx.type === 'recurring' && tx.frequency)
    .map((tx) => {
      const resolved = resolveTransactionOnDate(tx, exceptions, todayStr);
      const freq = tx.frequency as Frequency;
      return {
        ...tx,
        amount: resolved.amount,
        end_date: resolved.end_date,
        active: resolved.active,
        freq,
        monthlyCost: resolved.amount * (MONTHLY_FACTOR[freq] ?? 1),
      };
    })
    .filter((s) => s.active && (!s.end_date || s.end_date >= todayStr))
    .sort((a, b) => b.monthlyCost - a.monthlyCost);
}
