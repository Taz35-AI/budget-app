import { describe, it, expect } from 'vitest';
import { applyOptimisticEdit, applyOptimisticDelete } from './optimisticTransactions';
import type { TxSnapshot } from './optimisticTransactions';
import { resolveTransactionOnDate } from '@/engine/exceptionResolver';
import type { Transaction } from '@/types';

function rent(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 'rent', user_id: 'u1', name: 'Rent', amount: 100, category: 'expense',
    type: 'recurring', tag: 'housing', start_date: '2026-01-15', end_date: null,
    frequency: 'monthly', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

const base: TxSnapshot = { transactions: [rent()], exceptions: [] };

/** Effective amount of the recurring series on a given date. */
function amountOn(snap: TxSnapshot, date: string, id = 'rent') {
  const tx = snap.transactions.find((t) => t.id === id)!;
  return resolveTransactionOnDate(tx, snap.exceptions, date).amount;
}
function activeOn(snap: TxSnapshot, date: string, id = 'rent') {
  const tx = snap.transactions.find((t) => t.id === id)!;
  return resolveTransactionOnDate(tx, snap.exceptions, date).active;
}

describe('applyOptimisticEdit', () => {
  it('this_only changes just that occurrence and leaves later ones alone', () => {
    const next = applyOptimisticEdit(base, {
      id: 'rent', editMode: 'this_only', effectiveFrom: '2026-03-15',
      values: { amount: 150 },
    })!;
    expect(amountOn(next, '2026-02-15')).toBe(100); // before
    expect(amountOn(next, '2026-03-15')).toBe(150); // edited occurrence
    expect(amountOn(next, '2026-04-15')).toBe(100); // restored
    expect(amountOn(next, '2026-09-15')).toBe(100); // still restored later
  });

  it('all_future carries the change forward but not backward', () => {
    const next = applyOptimisticEdit(base, {
      id: 'rent', editMode: 'all_future', effectiveFrom: '2026-03-15',
      values: { amount: 150 },
    })!;
    expect(amountOn(next, '2026-02-15')).toBe(100);
    expect(amountOn(next, '2026-03-15')).toBe(150);
    expect(amountOn(next, '2027-01-15')).toBe(150);
  });

  it('all_future clears later exceptions so an old override cannot resurface', () => {
    const withLater: TxSnapshot = {
      transactions: [rent()],
      exceptions: [
        { id: 'e1', transaction_id: 'rent', effective_from: '2026-06-15', name: null, amount: 999, end_date: null, is_deleted: false, created_at: '' },
      ],
    };
    const next = applyOptimisticEdit(withLater, {
      id: 'rent', editMode: 'all_future', effectiveFrom: '2026-03-15',
      values: { amount: 150 },
    })!;
    expect(amountOn(next, '2026-07-15')).toBe(150);
  });

  it('this_only restores to the previously effective override, not the base row', () => {
    const withPrior: TxSnapshot = {
      transactions: [rent()],
      exceptions: [
        { id: 'e1', transaction_id: 'rent', effective_from: '2026-02-15', name: null, amount: 120, end_date: null, is_deleted: false, created_at: '' },
      ],
    };
    const next = applyOptimisticEdit(withPrior, {
      id: 'rent', editMode: 'this_only', effectiveFrom: '2026-05-15',
      values: { amount: 150 },
    })!;
    expect(amountOn(next, '2026-05-15')).toBe(150);
    expect(amountOn(next, '2026-06-15')).toBe(120); // back to the prior override
  });

  it('editMode all updates the row and wipes exceptions', () => {
    const withExc: TxSnapshot = {
      transactions: [rent()],
      exceptions: [
        { id: 'e1', transaction_id: 'rent', effective_from: '2026-02-15', name: null, amount: 999, end_date: null, is_deleted: false, created_at: '' },
      ],
    };
    const next = applyOptimisticEdit(withExc, {
      id: 'rent', editMode: 'all', values: { amount: 200 },
    })!;
    expect(next.exceptions).toHaveLength(0);
    expect(amountOn(next, '2026-02-15')).toBe(200);
  });

  it('returns null for a date move so the caller waits for the server', () => {
    expect(applyOptimisticEdit(base, {
      id: 'rent', editMode: 'this_only', effectiveFrom: '2026-03-15',
      values: { amount: 150, newDate: '2026-03-20' },
    })).toBeNull();
  });

  it('mirrors the change onto the paired transfer leg', () => {
    const pair: TxSnapshot = {
      transactions: [
        rent({ id: 'out', transfer_id: 'tr1', category: 'expense' }),
        rent({ id: 'in', transfer_id: 'tr1', category: 'income' }),
      ],
      exceptions: [],
    };
    const next = applyOptimisticEdit(pair, {
      id: 'out', editMode: 'this_only', effectiveFrom: '2026-03-15', values: { amount: 150 },
    })!;
    expect(amountOn(next, '2026-03-15', 'out')).toBe(150);
    expect(amountOn(next, '2026-03-15', 'in')).toBe(150);
    expect(amountOn(next, '2026-04-15', 'in')).toBe(100);
  });
});

describe('applyOptimisticDelete', () => {
  it('this_only removes one occurrence without swallowing the rest', () => {
    const next = applyOptimisticDelete(base, {
      id: 'rent', deleteMode: 'this_only', effectiveFrom: '2026-03-15',
    })!;
    expect(activeOn(next, '2026-02-15')).toBe(true);
    expect(activeOn(next, '2026-03-15')).toBe(false); // deleted
    expect(activeOn(next, '2026-04-15')).toBe(true);  // regression guard
    expect(amountOn(next, '2026-04-15')).toBe(100);
  });

  it('all_future stops the series from that date on', () => {
    const next = applyOptimisticDelete(base, {
      id: 'rent', deleteMode: 'all_future', effectiveFrom: '2026-03-15',
    })!;
    expect(activeOn(next, '2026-02-15')).toBe(true);
    expect(activeOn(next, '2026-03-15')).toBe(false);
    expect(activeOn(next, '2027-01-15')).toBe(false);
  });

  it('deleting the whole series removes splits and spawns too', () => {
    const family: TxSnapshot = {
      transactions: [rent(), rent({ id: 'split', parent_id: 'rent' })],
      exceptions: [
        { id: 'e1', transaction_id: 'split', effective_from: '2026-02-15', name: null, amount: 1, end_date: null, is_deleted: false, created_at: '' },
      ],
    };
    const next = applyOptimisticDelete(family, { id: 'rent', deleteMode: 'all' })!;
    expect(next.transactions).toHaveLength(0);
    expect(next.exceptions).toHaveLength(0);
  });

  it('removes both legs of a transfer pair', () => {
    const pair: TxSnapshot = {
      transactions: [
        rent({ id: 'out', type: 'one_off', date: '2026-03-15', transfer_id: 'tr1' }),
        rent({ id: 'in', type: 'one_off', date: '2026-03-15', transfer_id: 'tr1' }),
      ],
      exceptions: [],
    };
    const next = applyOptimisticDelete(pair, { id: 'out', deleteMode: 'all' })!;
    expect(next.transactions).toHaveLength(0);
  });
});
