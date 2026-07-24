import { format } from 'date-fns';
import type { Transaction, TransactionException } from '@/types';

/**
 * Snapshot diffing that drives the incremental balance recompute.
 *
 * Pure date/data logic with no React involvement, so it can be unit tested
 * directly — which matters because `computeBalancesCached` is only correct if
 * `findEarliestAffectedDate` never returns a date LATER than the earliest real
 * change. Miss a change and the cached days before that date silently keep
 * stale balances.
 */

export interface TransactionSnapshot {
  transactions: Transaction[];
  exceptions: TransactionException[];
}

/**
 * Earliest date we must start a full computation from.
 * Historical transactions compound into today's running balance, so we start
 * at the first one (or at the reset marker, which zeroes everything before it).
 */
export function getEarliestComputeStart(
  transactions: Transaction[],
  resetDate: string | null | undefined,
  today: Date,
): string {
  const todayStr = format(today, 'yyyy-MM-dd');
  if (resetDate) return resetDate;
  let earliest = todayStr;
  for (const tx of transactions) {
    const d = tx.type === 'one_off' ? (tx.date ?? todayStr) : (tx.start_date ?? todayStr);
    if (d < earliest) earliest = d;
  }
  return earliest;
}

/**
 * Diffs two snapshots and returns the earliest date the change could affect.
 * Additions, removals and edits all count — for an edit, both the old and new
 * dates matter, since moving a transaction later still changes the earlier day.
 */
export function findEarliestAffectedDate(
  prev: TransactionSnapshot,
  next: TransactionSnapshot,
  resetDate: string | null | undefined,
  todayStr: string,
): string {
  let earliest = todayStr;

  const touch = (date: string | null | undefined) => {
    const d = date ?? todayStr;
    if (d < earliest) earliest = d;
  };

  const prevTxMap = new Map<string, Transaction>(prev.transactions.map((t) => [t.id, t]));
  const nextTxMap = new Map<string, Transaction>(next.transactions.map((t) => [t.id, t]));
  const prevExcMap = new Map<string, TransactionException>(prev.exceptions.map((e) => [e.id, e]));
  const nextExcMap = new Map<string, TransactionException>(next.exceptions.map((e) => [e.id, e]));

  for (const tx of next.transactions) {
    if (!prevTxMap.has(tx.id)) touch(tx.date ?? tx.start_date);
  }
  for (const tx of prev.transactions) {
    if (!nextTxMap.has(tx.id)) touch(tx.date ?? tx.start_date);
  }
  for (const tx of next.transactions) {
    const p = prevTxMap.get(tx.id);
    if (p && !txEqual(p, tx)) {
      touch(p.date ?? p.start_date);
      touch(tx.date ?? tx.start_date);
    }
  }

  for (const exc of next.exceptions) {
    if (!prevExcMap.has(exc.id)) touch(exc.effective_from);
  }
  for (const exc of prev.exceptions) {
    if (!nextExcMap.has(exc.id)) touch(exc.effective_from);
  }
  for (const exc of next.exceptions) {
    const p = prevExcMap.get(exc.id);
    if (p && !excEqual(p, exc)) {
      touch(p.effective_from);
      touch(exc.effective_from);
    }
  }

  if (resetDate && earliest < resetDate) earliest = resetDate;

  return earliest;
}

// Content matters, not just the date: exceptions are upserted in place on
// (transaction_id, effective_from), so an edit can change amount/name/
// end_date/is_deleted while id and effective_from stay identical.
function excEqual(a: TransactionException, b: TransactionException): boolean {
  return (
    a.effective_from === b.effective_from &&
    a.amount === b.amount &&
    a.name === b.name &&
    a.end_date === b.end_date &&
    a.is_deleted === b.is_deleted
  );
}

function txEqual(a: Transaction, b: Transaction): boolean {
  return (
    a.amount === b.amount &&
    a.category === b.category &&
    a.date === b.date &&
    a.start_date === b.start_date &&
    a.end_date === b.end_date &&
    a.frequency === b.frequency &&
    a.name === b.name &&
    a.tag === b.tag &&
    a.account_id === b.account_id
  );
}
