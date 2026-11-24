import type { Transaction, TransactionException } from '@/types';

/**
 * Cache transforms that let the first-run example data appear and disappear
 * immediately, instead of after two server round trips (write, then refetch).
 *
 * Pure functions over the transactions query data, so they can be unit tested
 * without React. The server stays the source of truth: these only decide what
 * is on screen until its answer arrives.
 */

export interface TransactionsSnapshot {
  transactions: Transaction[];
  exceptions: TransactionException[];
}

/** One row of the import payload sent to /api/import/bulk. */
export interface DemoPayloadRow {
  name: string;
  amount: number;
  category: 'income' | 'expense';
  tag: string;
  account_id: string | null;
  type: 'one_off' | 'recurring';
  date?: string;
  start_date?: string;
  frequency?: 'monthly' | 'weekly';
}

/** Marks rows that exist only on screen, not yet on the server. */
export const OPTIMISTIC_DEMO_PREFIX = 'optimistic-demo-';

/**
 * Adds placeholder rows for an import that has been sent but not confirmed.
 * They are replaced by the real rows when the query refetches.
 */
export function addOptimisticDemoRows(
  data: TransactionsSnapshot,
  rows: DemoPayloadRow[],
  nowIso: string = new Date().toISOString(),
): TransactionsSnapshot {
  const placeholders: Transaction[] = rows.map((row, i) => ({
    id: `${OPTIMISTIC_DEMO_PREFIX}${i}`,
    user_id: '',
    account_id: row.account_id,
    name: row.name,
    amount: row.amount,
    category: row.category,
    type: row.type,
    tag: row.tag,
    date: row.type === 'one_off' ? (row.date ?? null) : null,
    start_date: row.type === 'recurring' ? (row.start_date ?? null) : null,
    end_date: null,
    frequency: row.type === 'recurring' ? (row.frequency ?? null) : null,
    created_at: nowIso,
    updated_at: nowIso,
  }));
  return { ...data, transactions: [...data.transactions, ...placeholders] };
}

/**
 * Removes example rows: any unconfirmed placeholders, plus (when `batchId` is
 * given) the confirmed rows of that import batch. Exceptions belonging to the
 * removed rows go with them, as they would on the server.
 */
export function removeDemoRows(data: TransactionsSnapshot, batchId: string | null): TransactionsSnapshot {
  const removed = new Set<string>();
  const transactions = data.transactions.filter((tx) => {
    const isPlaceholder = tx.id.startsWith(OPTIMISTIC_DEMO_PREFIX);
    const isBatch = batchId !== null && tx.import_batch_id === batchId;
    if (isPlaceholder || isBatch) {
      removed.add(tx.id);
      return false;
    }
    return true;
  });
  if (removed.size === 0) return data;
  return {
    transactions,
    exceptions: data.exceptions.filter((exc) => !removed.has(exc.transaction_id)),
  };
}
