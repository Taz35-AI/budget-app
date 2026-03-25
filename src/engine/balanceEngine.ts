import { addDays, format } from 'date-fns';
import type { Transaction, TransactionException, DayTransaction } from '@/types';
import { SEVEN_YEARS_DAYS } from '@/lib/constants';
import { firesOnDate } from './recurringResolver';
import { resolveTransactionOnDate } from './exceptionResolver';

export interface BalanceMap {
  /** date string YYYY-MM-DD → running balance */
  balances: Map<string, number>;
  /** date string → array of transactions that fire that day */
  dayTransactions: Map<string, DayTransaction[]>;
}

export interface ComputeOptions {
  transactions: Transaction[];
  exceptions: TransactionException[];
  /** If set, balance resets to 0 on this date (forward from here) */
  resetDate?: string | null;
  /** Start computing from this date (default: today) */
  fromDate?: string;
  /** Compute up to this date (default: today + 7 years) */
  toDate?: string;
}

/**
 * Core balance engine.
 * Pure function — no side effects, no I/O.
 * Iterates day by day, resolves all transactions, accumulates running balance.
 */
export function computeBalances(options: ComputeOptions): BalanceMap {
  const {
    transactions,
    exceptions,
    resetDate,
    fromDate,
    toDate,
  } = options;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = fromDate ? new Date(fromDate) : today;
  const endDate = toDate
    ? new Date(toDate)
    : addDays(today, SEVEN_YEARS_DAYS);

  // Pre-group exceptions by transaction_id for O(1) lookup
  const exceptionsByTxId = new Map<string, TransactionException[]>();
  for (const exc of exceptions) {
    const arr = exceptionsByTxId.get(exc.transaction_id) ?? [];
    arr.push(exc);
    exceptionsByTxId.set(exc.transaction_id, arr);
  }

  // Split transactions by type for efficient iteration
  const recurringTx = transactions.filter((t) => t.type === 'recurring');
  const oneOffTx = transactions.filter((t) => t.type === 'one_off');

  // Index one-off transactions by date for O(1) lookup
  const oneOffByDate = new Map<string, Transaction[]>();
  for (const tx of oneOffTx) {
    if (!tx.date) continue;
    const arr = oneOffByDate.get(tx.date) ?? [];
    arr.push(tx);
    oneOffByDate.set(tx.date, arr);
  }

  const balances = new Map<string, number>();
  const dayTransactions = new Map<string, DayTransaction[]>();

  let runningBalance = 0;
  let cursor = new Date(startDate);

  while (cursor <= endDate) {
    const dateStr = format(cursor, 'yyyy-MM-dd');

    // Apply reset marker
    if (resetDate && dateStr === resetDate) {
      runningBalance = 0;
    }

    let dayNet = 0;
    const txsToday: DayTransaction[] = [];

    // ── One-off transactions ──────────────────────────────────────────────
    const oneOffs = oneOffByDate.get(dateStr);
    if (oneOffs) {
      for (const tx of oneOffs) {
        const sign = tx.category === 'income' ? 1 : -1;
        dayNet += sign * tx.amount;
        txsToday.push({
          id: `${tx.id}_${dateStr}`,
          transaction_id: tx.id,
          name: tx.name,
          amount: tx.amount,
          category: tx.category,
          type: tx.type,
          tag: tx.tag ?? null,
          frequency: null,
          is_exception: false,
        });
      }
    }

    // ── Recurring transactions ────────────────────────────────────────────
    for (const tx of recurringTx) {
      const txStart = tx.start_date;
      if (!txStart || dateStr < txStart) continue;

      const excList = exceptionsByTxId.get(tx.id) ?? [];
      const resolved = resolveTransactionOnDate(tx, excList, dateStr);

      if (!resolved.active) continue;
      if (resolved.end_date && dateStr > resolved.end_date) continue;
      if (!resolved.frequency) continue;

      if (!firesOnDate(txStart, resolved.frequency, dateStr)) continue;

      const sign = resolved.category === 'income' ? 1 : -1;
      dayNet += sign * resolved.amount;

      // Check if this day uses an exception override
      const hasException = excList.some((e) => e.effective_from <= dateStr);

      txsToday.push({
        id: `${tx.id}_${dateStr}`,
        transaction_id: tx.id,
        name: resolved.name,
        amount: resolved.amount,
        category: resolved.category,
        type: resolved.type,
        tag: tx.tag ?? null,
        frequency: resolved.frequency,
        is_exception: hasException,
        start_date: resolved.start_date,
        end_date: resolved.end_date,
      });
    }

    runningBalance += dayNet;
    balances.set(dateStr, runningBalance);
    if (txsToday.length > 0) {
      dayTransactions.set(dateStr, txsToday);
    }

    cursor = addDays(cursor, 1);
  }

  return { balances, dayTransactions };
}

/**
 * Returns the earliest date that could be affected by a transaction change.
 * Used for incremental cache invalidation.
 */
export function getEarliestAffectedDate(transaction: Transaction): string {
  return (
    transaction.date ??
    transaction.start_date ??
    format(new Date(), 'yyyy-MM-dd')
  );
}
