import { describe, it, expect } from 'vitest';
import { addOptimisticDemoRows, removeDemoRows, OPTIMISTIC_DEMO_PREFIX } from './demoData';
import type { DemoPayloadRow, TransactionsSnapshot } from './demoData';
import type { Transaction, TransactionException } from '@/types';
import { computeBalances } from '@/engine/balanceEngine';

const tx = (over: Partial<Transaction>): Transaction => ({
  id: 'real-1',
  user_id: 'u',
  name: 'Existing',
  amount: 10,
  category: 'expense',
  type: 'one_off',
  date: '2026-11-10',
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  ...over,
});

const ROWS: DemoPayloadRow[] = [
  { name: 'Opening', amount: 1800, category: 'income', tag: 'savings', account_id: 'a1', type: 'one_off', date: '2026-11-01' },
  { name: 'Rent', amount: 950, category: 'expense', tag: 'housing', account_id: 'a1', type: 'recurring', start_date: '2026-11-01', frequency: 'monthly' },
];

describe('addOptimisticDemoRows', () => {
  it('appends placeholders without touching existing rows', () => {
    const data: TransactionsSnapshot = { transactions: [tx({})], exceptions: [] };
    const next = addOptimisticDemoRows(data, ROWS, '2026-11-24T00:00:00Z');

    expect(next.transactions).toHaveLength(3);
    expect(next.transactions[0]).toBe(data.transactions[0]);
    expect(data.transactions).toHaveLength(1); // input not mutated
    expect(next.transactions.slice(1).every((t) => t.id.startsWith(OPTIMISTIC_DEMO_PREFIX))).toBe(true);
  });

  it('gives one-off rows a date and recurring rows a start date and frequency', () => {
    const { transactions } = addOptimisticDemoRows({ transactions: [], exceptions: [] }, ROWS);
    const [opening, rent] = transactions;

    expect(opening).toMatchObject({ type: 'one_off', date: '2026-11-01', start_date: null, frequency: null });
    expect(rent).toMatchObject({ type: 'recurring', date: null, start_date: '2026-11-01', frequency: 'monthly' });
  });

  it('produces rows the balance engine computes exactly as it would the saved ones', () => {
    // The point of the placeholders is that nothing visibly changes when the
    // server's rows replace them.
    const optimistic = addOptimisticDemoRows({ transactions: [], exceptions: [] }, ROWS);
    const saved = optimistic.transactions.map((t, i) => ({ ...t, id: `saved-${i}`, user_id: 'u', import_batch_id: 'b1' }));
    const range = { exceptions: [], fromDate: '2026-11-01', toDate: '2027-02-01' };

    const a = computeBalances({ transactions: optimistic.transactions, ...range });
    const b = computeBalances({ transactions: saved, ...range });

    expect([...a.balances.entries()]).toEqual([...b.balances.entries()]);
    expect(a.balances.get('2026-11-01')).toBe(850); // 1800 in, 950 rent out
  });
});

describe('removeDemoRows', () => {
  const exception = (transaction_id: string): TransactionException =>
    ({ id: `e-${transaction_id}`, transaction_id, effective_from: '2026-12-01', is_deleted: false }) as TransactionException;

  it('removes the confirmed rows of the given batch and keeps everything else', () => {
    const data: TransactionsSnapshot = {
      transactions: [
        tx({ id: 'mine' }),
        tx({ id: 'demo-1', import_batch_id: 'b1' }),
        tx({ id: 'demo-2', import_batch_id: 'b1' }),
        tx({ id: 'other-import', import_batch_id: 'b2' }),
      ],
      exceptions: [exception('mine'), exception('demo-1')],
    };

    const next = removeDemoRows(data, 'b1');

    expect(next.transactions.map((t) => t.id)).toEqual(['mine', 'other-import']);
    expect(next.exceptions.map((e) => e.transaction_id)).toEqual(['mine']);
  });

  it('removes unconfirmed placeholders even without a batch id', () => {
    const seeded = addOptimisticDemoRows({ transactions: [tx({ id: 'mine' })], exceptions: [] }, ROWS);
    const next = removeDemoRows(seeded, null);
    expect(next.transactions.map((t) => t.id)).toEqual(['mine']);
  });

  it('removes placeholders and confirmed rows together', () => {
    // Clear pressed after the server confirmed but before the refetch landed.
    const seeded = addOptimisticDemoRows({ transactions: [tx({ id: 'd', import_batch_id: 'b1' })], exceptions: [] }, ROWS);
    expect(removeDemoRows(seeded, 'b1').transactions).toHaveLength(0);
  });

  it('returns the same object when there is nothing to remove', () => {
    const data: TransactionsSnapshot = { transactions: [tx({ id: 'mine' })], exceptions: [] };
    expect(removeDemoRows(data, 'b1')).toBe(data);
    expect(removeDemoRows(data, null)).toBe(data);
  });

  it('never matches rows that simply have no batch id', () => {
    const data: TransactionsSnapshot = {
      transactions: [tx({ id: 'manual', import_batch_id: null }), tx({ id: 'legacy' })],
      exceptions: [],
    };
    expect(removeDemoRows(data, null).transactions).toHaveLength(2);
  });
});
