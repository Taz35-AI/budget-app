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
  /** Seed the running balance instead of starting from 0 (used by applyDelta) */
  initialBalance?: number;
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

  let runningBalance = options.initialBalance ?? 0;
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
          account_id: tx.account_id ?? null,
          parent_id: tx.parent_id ?? null,
          transfer_id: tx.transfer_id ?? null,
          created_by: tx.created_by ?? tx.user_id,
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

      // Check if this day uses a non-deleted exception override
      const hasException = excList.some((e) => e.effective_from <= dateStr && !e.is_deleted);

      txsToday.push({
        id: `${tx.id}_${dateStr}`,
        transaction_id: tx.id,
        account_id: tx.account_id ?? null,
        parent_id: tx.parent_id ?? null,
        transfer_id: tx.transfer_id ?? null,
        created_by: tx.created_by ?? tx.user_id,
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
 * Incrementally recomputes balances from `fromDate` forward, reusing the
 * existing Maps for all dates before that point.
 *
 * Instead of iterating from the very first transaction, we:
 *   1. Copy all existing entries for dates < fromDate (O(k) copy, no computation)
 *   2. Seed the running balance from the entry at fromDate-1
 *   3. Run the loop only from fromDate → toDate
 *
 * This is O(toDate - fromDate) rather than O(toDate - firstEverTransaction).
 */
export function applyDelta(prev: BalanceMap, options: ComputeOptions & { fromDate: string }): BalanceMap {
  const { fromDate } = options;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const toDate = options.toDate ?? format(addDays(today, SEVEN_YEARS_DAYS), 'yyyy-MM-dd');

  // ── 1. Copy existing entries that are before the affected range ──────────
  const balances = new Map<string, number>();
  const dayTransactions = new Map<string, DayTransaction[]>();

  for (const [date, balance] of prev.balances) {
    if (date < fromDate) balances.set(date, balance);
  }
  for (const [date, txs] of prev.dayTransactions) {
    if (date < fromDate) dayTransactions.set(date, txs);
  }

  // ── 2. Seed running balance from the day before fromDate ─────────────────
  const prevDay = format(addDays(new Date(fromDate + 'T12:00:00'), -1), 'yyyy-MM-dd');
  const initialBalance = balances.get(prevDay) ?? 0;

  // ── 3. Run the loop from fromDate onward ──────────────────────────────────
  const delta = computeBalances({
    ...options,
    fromDate,
    toDate,
    initialBalance,
  });

  // ── 4. Merge: delta entries override anything from fromDate onward ────────
  for (const [date, balance] of delta.balances) {
    balances.set(date, balance);
  }
  for (const [date, txs] of delta.dayTransactions) {
    dayTransactions.set(date, txs);
  }
  // Remove stale dayTransaction entries that no longer exist in the recomputed range
  for (const [date] of prev.dayTransactions) {
    if (date >= fromDate && !delta.dayTransactions.has(date)) {
      dayTransactions.delete(date);
    }
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
