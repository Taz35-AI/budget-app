import { describe, it, expect, beforeEach } from 'vitest';
import { computeBalancesShared, _resetWorkerClient } from './balanceWorkerClient';
import { computeBalances } from './balanceEngine';
import type { ComputeOptions } from './balanceEngine';
import type { Transaction } from '@/types';

function recurring(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 'rent', user_id: 'u1', name: 'Rent', amount: 100, category: 'expense',
    type: 'recurring', tag: 'housing', start_date: '2026-01-01', end_date: null,
    frequency: 'monthly', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

const OPTIONS: ComputeOptions = {
  transactions: [recurring(), { ...recurring({ id: 'pay', name: 'Pay', amount: 2000, category: 'income', tag: 'salary' }) }],
  exceptions: [],
  resetDate: null,
  fromDate: '2026-01-01',
  toDate: '2026-06-30',
};

describe('computeBalancesShared (main-thread fallback in node env)', () => {
  beforeEach(() => _resetWorkerClient());

  it('resolves to the same result as a direct computeBalances', async () => {
    const [expected, actual] = [computeBalances(OPTIONS), await computeBalancesShared('k1', OPTIONS)];
    expect(actual.balances.size).toBe(expected.balances.size);
    for (const [date, bal] of expected.balances) {
      expect(actual.balances.get(date)).toBe(bal);
    }
    // 2000 income - 100 rent on Jan 1, carried through months.
    expect(actual.balances.get('2026-01-01')).toBe(1900);
  });

  it('shares one in-flight promise for the same dedupe key', () => {
    const a = computeBalancesShared('same', OPTIONS);
    const b = computeBalancesShared('same', OPTIONS);
    expect(a).toBe(b);
  });

  it('does not share promises across different keys', () => {
    const a = computeBalancesShared('key-a', OPTIONS);
    const b = computeBalancesShared('key-b', OPTIONS);
    expect(a).not.toBe(b);
  });

  it('frees the dedupe key after settling so later edits recompute', async () => {
    const first = computeBalancesShared('reused', OPTIONS);
    await first;
    const second = computeBalancesShared('reused', OPTIONS);
    expect(second).not.toBe(first);
    await second;
  });
});
