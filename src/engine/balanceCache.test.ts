/**
 * The cache is only safe because the incremental path produces exactly the same
 * result as a full recompute. These tests hold that invariant in place — if
 * applyDelta ever diverges, the memo silently starts serving wrong balances.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { computeBalancesCached, clearBalanceCache } from './balanceCache';
import { findEarliestAffectedDate } from './balanceDiff';
import { computeBalances } from './balanceEngine';
import type { Transaction, TransactionException } from '@/types';

const FROM = '2026-01-01';
const TO = '2026-12-31';

// "Today" must sit AFTER the edits under test. findEarliestAffectedDate starts
// from today and walks backwards to the earliest change, so a today of FROM
// would make every delta recompute the whole range and the diff logic would
// never actually be under test.
const TODAY = '2026-11-01';

function recurring(id: string, over: Partial<Transaction> = {}): Transaction {
  return {
    id,
    user_id: 'u',
    name: id,
    amount: 100,
    category: 'expense',
    type: 'recurring',
    start_date: '2026-01-05',
    frequency: 'monthly',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function oneOff(id: string, date: string, amount = 50, over: Partial<Transaction> = {}): Transaction {
  return {
    id,
    user_id: 'u',
    name: id,
    amount,
    category: 'expense',
    type: 'one_off',
    date,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

/**
 * Runs the cached path using the REAL diff logic (so the incremental branch is
 * genuinely exercised), then asserts it equals an uncached full recompute.
 */
function expectMatchesFullCompute(
  key: string,
  transactions: Transaction[],
  exceptions: TransactionException[],
) {
  const cached = computeBalancesCached(key, {
    transactions,
    exceptions,
    resetDate: undefined,
    toDate: TO,
    fullFromDate: FROM,
    deltaFromDate: (prev) =>
      findEarliestAffectedDate(prev, { transactions, exceptions }, undefined, TODAY),
  });

  const full = computeBalances({ transactions, exceptions, resetDate: null, fromDate: FROM, toDate: TO });

  expect([...cached.balances.entries()]).toEqual([...full.balances.entries()]);
  return cached;
}

describe('computeBalancesCached', () => {
  beforeEach(() => clearBalanceCache());

  it('matches a full recompute across a sequence of edits', () => {
    const key = 'combined';
    const base = [recurring('rent'), oneOff('coffee', '2026-02-10')];

    expectMatchesFullCompute(key, base, []);

    // Add a transaction
    const added = [...base, oneOff('books', '2026-03-15', 30)];
    expectMatchesFullCompute(key, added, []);

    // Edit an amount
    const edited = added.map((t) => (t.id === 'coffee' ? { ...t, amount: 999 } : t));
    expectMatchesFullCompute(key, edited, []);

    // Remove one
    const removed = edited.filter((t) => t.id !== 'books');
    expectMatchesFullCompute(key, removed, []);
  });

  it('matches a full recompute when exceptions change in place', () => {
    const key = 'combined';
    const txs = [recurring('rent')];

    expectMatchesFullCompute(key, txs, []);

    const exc: TransactionException = {
      id: 'exc-1',
      transaction_id: 'rent',
      effective_from: '2026-04-05',
      amount: 20,
      is_deleted: false,
      created_at: '2026-01-01T00:00:00Z',
    } as TransactionException;

    expectMatchesFullCompute(key, txs, [exc]);

    // Same id and date, different amount — the in-place edit case.
    expectMatchesFullCompute(key, txs, [{ ...exc, amount: 75 }]);

    // Turned into a deletion.
    expectMatchesFullCompute(key, txs, [{ ...exc, amount: null, is_deleted: true }]);
  });

  it('keeps separate entries per account key', () => {
    const a = [oneOff('a1', '2026-02-01', 10)];
    const b = [oneOff('b1', '2026-02-01', 999)];

    const resultA = expectMatchesFullCompute('account-a', a, []);
    const resultB = expectMatchesFullCompute('account-b', b, []);

    expect(resultA.balances.get('2026-02-01')).toBe(-10);
    expect(resultB.balances.get('2026-02-01')).toBe(-999);
  });

  it('clearBalanceCache drops cached results', () => {
    const txs = [oneOff('x', '2026-02-01', 10)];
    expectMatchesFullCompute('combined', txs, []);
    clearBalanceCache();
    // After clearing, the next call takes the full path and must still be right.
    expectMatchesFullCompute('combined', txs, []);
  });
});
