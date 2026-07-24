/**
 * Tests for the balance engine and the exception resolver.
 *
 * These cover the money maths: sign handling, recurrence accumulation,
 * exception overrides/deletions, reset markers, incremental recompute via
 * applyDelta, and the two bugs that motivated this suite — timezone-shifted
 * date parsing and float drift over long ranges.
 */

import { describe, it, expect } from 'vitest';
import { computeBalances, applyDelta } from './balanceEngine';
import { resolveTransactionOnDate } from './exceptionResolver';
import type { Transaction, TransactionException } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let idCounter = 0;

function oneOff(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `one-${++idCounter}`,
    user_id: 'user-1',
    name: 'Coffee',
    amount: 10,
    category: 'expense',
    type: 'one_off',
    date: '2026-03-10',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function recurring(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `rec-${++idCounter}`,
    user_id: 'user-1',
    name: 'Rent',
    amount: 100,
    category: 'expense',
    type: 'recurring',
    start_date: '2026-03-01',
    frequency: 'monthly',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function exception(overrides: Partial<TransactionException> & { transaction_id: string }): TransactionException {
  return {
    id: `exc-${++idCounter}`,
    effective_from: '2026-03-01',
    is_deleted: false,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as TransactionException;
}

// ─── computeBalances ─────────────────────────────────────────────────────────

describe('computeBalances — one-off transactions', () => {
  it('subtracts expenses and adds income', () => {
    const { balances } = computeBalances({
      transactions: [
        oneOff({ date: '2026-03-02', amount: 50, category: 'expense' }),
        oneOff({ date: '2026-03-03', amount: 200, category: 'income' }),
      ],
      exceptions: [],
      fromDate: '2026-03-01',
      toDate: '2026-03-04',
    });

    expect(balances.get('2026-03-01')).toBe(0);
    expect(balances.get('2026-03-02')).toBe(-50);
    expect(balances.get('2026-03-03')).toBe(150);
    expect(balances.get('2026-03-04')).toBe(150);
  });

  it('lands transactions on the requested calendar day regardless of timezone', () => {
    // Regression: `new Date('2026-03-10')` is UTC midnight, which formats as
    // March 9 for anyone west of UTC. The range must start exactly on the
    // requested day and the transaction must land on its own date.
    const { balances, dayTransactions } = computeBalances({
      transactions: [oneOff({ date: '2026-03-10', amount: 25 })],
      exceptions: [],
      fromDate: '2026-03-10',
      toDate: '2026-03-12',
    });

    expect([...balances.keys()]).toEqual(['2026-03-10', '2026-03-11', '2026-03-12']);
    expect(dayTransactions.has('2026-03-10')).toBe(true);
    expect(dayTransactions.has('2026-03-09')).toBe(false);
    expect(balances.get('2026-03-10')).toBe(-25);
  });

  it('emits day transactions only on days that have activity', () => {
    const { dayTransactions } = computeBalances({
      transactions: [oneOff({ date: '2026-03-02', name: 'Lunch' })],
      exceptions: [],
      fromDate: '2026-03-01',
      toDate: '2026-03-03',
    });

    expect(dayTransactions.get('2026-03-01')).toBeUndefined();
    expect(dayTransactions.get('2026-03-02')).toHaveLength(1);
    expect(dayTransactions.get('2026-03-02')![0].name).toBe('Lunch');
    expect(dayTransactions.get('2026-03-03')).toBeUndefined();
  });

  it('seeds the running balance from initialBalance', () => {
    const { balances } = computeBalances({
      transactions: [oneOff({ date: '2026-03-02', amount: 40 })],
      exceptions: [],
      fromDate: '2026-03-01',
      toDate: '2026-03-02',
      initialBalance: 100,
    });

    expect(balances.get('2026-03-01')).toBe(100);
    expect(balances.get('2026-03-02')).toBe(60);
  });
});

describe('computeBalances — recurring transactions', () => {
  it('accumulates a monthly series and respects end_date', () => {
    const { balances } = computeBalances({
      transactions: [recurring({ amount: 100, start_date: '2026-03-01', end_date: '2026-05-01' })],
      exceptions: [],
      fromDate: '2026-03-01',
      toDate: '2026-06-30',
    });

    expect(balances.get('2026-03-01')).toBe(-100);
    expect(balances.get('2026-04-01')).toBe(-200);
    expect(balances.get('2026-05-01')).toBe(-300);
    expect(balances.get('2026-06-01')).toBe(-300); // past end_date
  });

  it('does not fire before start_date', () => {
    const { balances } = computeBalances({
      transactions: [recurring({ start_date: '2026-03-15', amount: 100 })],
      exceptions: [],
      fromDate: '2026-03-01',
      toDate: '2026-03-20',
    });

    expect(balances.get('2026-03-14')).toBe(0);
    expect(balances.get('2026-03-15')).toBe(-100);
  });

  it('clamps a 31st monthly series into February without drifting', () => {
    const { dayTransactions } = computeBalances({
      transactions: [recurring({ start_date: '2026-01-31', amount: 10 })],
      exceptions: [],
      fromDate: '2026-01-31',
      toDate: '2026-03-31',
    });

    expect(dayTransactions.has('2026-01-31')).toBe(true);
    expect(dayTransactions.has('2026-02-28')).toBe(true);
    expect(dayTransactions.has('2026-02-27')).toBe(false);
    expect(dayTransactions.has('2026-03-31')).toBe(true); // anchor day restored
  });
});

describe('computeBalances — exceptions', () => {
  it('applies an amount override from its effective date forward', () => {
    const tx = recurring({ amount: 100, start_date: '2026-03-01', frequency: 'monthly' });
    const { balances } = computeBalances({
      transactions: [tx],
      exceptions: [exception({ transaction_id: tx.id, effective_from: '2026-04-01', amount: 50 })],
      fromDate: '2026-03-01',
      toDate: '2026-05-31',
    });

    expect(balances.get('2026-03-01')).toBe(-100); // original
    expect(balances.get('2026-04-01')).toBe(-150); // overridden to 50
    expect(balances.get('2026-05-01')).toBe(-200); // override persists
  });

  it('stops the series when an exception marks it deleted', () => {
    const tx = recurring({ amount: 100, start_date: '2026-03-01' });
    const { balances, dayTransactions } = computeBalances({
      transactions: [tx],
      exceptions: [exception({ transaction_id: tx.id, effective_from: '2026-04-01', is_deleted: true })],
      fromDate: '2026-03-01',
      toDate: '2026-05-31',
    });

    expect(balances.get('2026-03-01')).toBe(-100);
    expect(dayTransactions.has('2026-04-01')).toBe(false);
    expect(balances.get('2026-05-01')).toBe(-100);
  });

  it('lets a later restore exception re-enable a deleted occurrence', () => {
    // This is the delete-this-occurrence-only pattern: delete at D, restore
    // at the next occurrence.
    const tx = recurring({ amount: 100, start_date: '2026-03-01' });
    const { dayTransactions } = computeBalances({
      transactions: [tx],
      exceptions: [
        exception({ transaction_id: tx.id, effective_from: '2026-04-01', is_deleted: true }),
        exception({ transaction_id: tx.id, effective_from: '2026-05-01', is_deleted: false }),
      ],
      fromDate: '2026-03-01',
      toDate: '2026-05-31',
    });

    expect(dayTransactions.has('2026-03-01')).toBe(true);
    expect(dayTransactions.has('2026-04-01')).toBe(false);
    expect(dayTransactions.has('2026-05-01')).toBe(true);
  });

  it('flags overridden occurrences with is_exception', () => {
    const tx = recurring({ amount: 100, start_date: '2026-03-01' });
    const { dayTransactions } = computeBalances({
      transactions: [tx],
      exceptions: [exception({ transaction_id: tx.id, effective_from: '2026-04-01', amount: 50 })],
      fromDate: '2026-03-01',
      toDate: '2026-04-30',
    });

    expect(dayTransactions.get('2026-03-01')![0].is_exception).toBe(false);
    expect(dayTransactions.get('2026-04-01')![0].is_exception).toBe(true);
  });
});

describe('computeBalances — reset markers and precision', () => {
  it('zeroes the running balance on the reset date', () => {
    const { balances } = computeBalances({
      transactions: [
        oneOff({ date: '2026-03-01', amount: 500, category: 'income' }),
        oneOff({ date: '2026-03-05', amount: 20, category: 'expense' }),
      ],
      exceptions: [],
      resetDate: '2026-03-04',
      fromDate: '2026-03-01',
      toDate: '2026-03-05',
    });

    expect(balances.get('2026-03-03')).toBe(500);
    expect(balances.get('2026-03-04')).toBe(0);
    expect(balances.get('2026-03-05')).toBe(-20);
  });

  it('keeps cent precision across a long daily series', () => {
    // 0.1 + 0.2 style drift compounds over thousands of days without rounding.
    const { balances } = computeBalances({
      transactions: [recurring({ amount: 0.1, frequency: 'daily', start_date: '2026-01-01', category: 'expense' })],
      exceptions: [],
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
    });

    expect(balances.get('2026-01-03')).toBe(-0.3);
    expect(balances.get('2026-01-31')).toBe(-3.1);
  });
});

// ─── applyDelta ──────────────────────────────────────────────────────────────

describe('applyDelta', () => {
  const baseOptions = {
    exceptions: [],
    fromDate: '2026-03-01',
    toDate: '2026-03-10',
  };

  it('matches a full recompute after adding a transaction', () => {
    const original = [oneOff({ id: 'a', date: '2026-03-02', amount: 50 })];
    const prev = computeBalances({ ...baseOptions, transactions: original });

    const updated = [...original, oneOff({ id: 'b', date: '2026-03-06', amount: 30 })];
    const delta = applyDelta(prev, { ...baseOptions, transactions: updated, fromDate: '2026-03-06' });
    const full = computeBalances({ ...baseOptions, transactions: updated });

    expect([...delta.balances.entries()]).toEqual([...full.balances.entries()]);
  });

  it('preserves untouched days before fromDate', () => {
    const transactions = [oneOff({ date: '2026-03-02', amount: 50 })];
    const prev = computeBalances({ ...baseOptions, transactions });
    const delta = applyDelta(prev, { ...baseOptions, transactions, fromDate: '2026-03-05' });

    expect(delta.balances.get('2026-03-02')).toBe(prev.balances.get('2026-03-02'));
    expect(delta.balances.get('2026-03-10')).toBe(prev.balances.get('2026-03-10'));
  });

  it('drops day transactions that no longer exist in the recomputed range', () => {
    const removable = oneOff({ id: 'gone', date: '2026-03-06', amount: 30 });
    const prev = computeBalances({ ...baseOptions, transactions: [removable] });
    expect(prev.dayTransactions.has('2026-03-06')).toBe(true);

    const delta = applyDelta(prev, { ...baseOptions, transactions: [], fromDate: '2026-03-06' });
    expect(delta.dayTransactions.has('2026-03-06')).toBe(false);
    expect(delta.balances.get('2026-03-10')).toBe(0);
  });
});

// ─── exceptionResolver ───────────────────────────────────────────────────────

describe('resolveTransactionOnDate', () => {
  const tx = recurring({ id: 'tx-res', amount: 100, name: 'Rent', start_date: '2026-03-01' });

  it('returns the transaction unchanged when no exception applies', () => {
    const resolved = resolveTransactionOnDate(tx, [], '2026-03-01');
    expect(resolved.active).toBe(true);
    expect(resolved.amount).toBe(100);
    expect(resolved.name).toBe('Rent');
  });

  it('ignores exceptions dated after the target date', () => {
    const excs = [exception({ transaction_id: tx.id, effective_from: '2026-05-01', amount: 20 })];
    expect(resolveTransactionOnDate(tx, excs, '2026-04-01').amount).toBe(100);
  });

  it('applies the most recent applicable exception', () => {
    const excs = [
      exception({ transaction_id: tx.id, effective_from: '2026-03-01', amount: 50 }),
      exception({ transaction_id: tx.id, effective_from: '2026-04-01', amount: 70 }),
    ];
    expect(resolveTransactionOnDate(tx, excs, '2026-03-15').amount).toBe(50);
    expect(resolveTransactionOnDate(tx, excs, '2026-04-15').amount).toBe(70);
  });

  it('marks the transaction inactive when the winning exception is a deletion', () => {
    const excs = [exception({ transaction_id: tx.id, effective_from: '2026-04-01', is_deleted: true })];
    expect(resolveTransactionOnDate(tx, excs, '2026-04-01').active).toBe(false);
  });

  it('ignores exceptions belonging to a different transaction', () => {
    const excs = [exception({ transaction_id: 'someone-else', effective_from: '2026-03-01', amount: 1 })];
    expect(resolveTransactionOnDate(tx, excs, '2026-03-05').amount).toBe(100);
  });
});
