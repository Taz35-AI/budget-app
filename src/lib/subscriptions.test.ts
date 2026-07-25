import { describe, it, expect } from 'vitest';
import { resolveSubscriptions } from './subscriptions';
import type { Transaction, TransactionException } from '@/types';

function recurring(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 'netflix',
    user_id: 'u1',
    name: 'Netflix',
    amount: 12.99,
    category: 'expense',
    type: 'recurring',
    tag: 'entertainment',
    start_date: '2026-01-27',
    end_date: null,
    frequency: 'monthly',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function exception(over: Partial<TransactionException> = {}): TransactionException {
  return {
    id: crypto.randomUUID(),
    transaction_id: 'netflix',
    effective_from: '2026-01-27',
    name: null,
    amount: null,
    end_date: null,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

describe('resolveSubscriptions', () => {
  it('uses the base amount when there are no exceptions', () => {
    const [sub] = resolveSubscriptions([recurring()], [], '2026-09-01');
    expect(sub.amount).toBe(12.99);
    expect(sub.monthlyCost).toBeCloseTo(12.99, 5);
  });

  it('reflects a "this & all future" price change stored as an exception', () => {
    // Regression: a price hike via editMode 'all_future' writes a forward
    // exception and never touches transactions.amount. Reading tx.amount would
    // show 12.99 forever; the report must show the current 15.99.
    const excs = [exception({ effective_from: '2026-08-27', amount: 15.99 })];
    const [sub] = resolveSubscriptions([recurring()], excs, '2026-09-01');
    expect(sub.amount).toBe(15.99);
    expect(sub.monthlyCost).toBeCloseTo(15.99, 5);
    // Annual cost derived downstream as monthlyCost × 12.
    expect(sub.monthlyCost * 12).toBeCloseTo(191.88, 2);
  });

  it('still shows the old amount before the change takes effect', () => {
    const excs = [exception({ effective_from: '2026-08-27', amount: 15.99 })];
    const [sub] = resolveSubscriptions([recurring()], excs, '2026-08-01');
    expect(sub.amount).toBe(12.99);
  });

  it('ignores a one-off ("this occurrence only") override once it has reverted', () => {
    // £20 for the 2026-07-27 occurrence only, restored to base from 2026-08-27.
    const excs = [
      exception({ effective_from: '2026-07-27', amount: 20 }),
      exception({ effective_from: '2026-08-27', amount: null }),
    ];
    const [sub] = resolveSubscriptions([recurring()], excs, '2026-09-01');
    expect(sub.amount).toBe(12.99);
  });

  it('drops a series cancelled on or before today (delete all future)', () => {
    const excs = [exception({ effective_from: '2026-06-27', is_deleted: true })];
    expect(resolveSubscriptions([recurring()], excs, '2026-09-01')).toHaveLength(0);
  });

  it('converts non-monthly frequencies to a monthly cost', () => {
    const annual = recurring({ id: 'ins', frequency: 'annual', amount: 120 });
    const [sub] = resolveSubscriptions([annual], [], '2026-09-01');
    expect(sub.monthlyCost).toBeCloseTo(10, 5);
  });
});
