import { describe, it, expect } from 'vitest';
import { computeBalances } from './balanceEngine';
import type { Transaction } from '@/types';

/**
 * Not an assertion of speed — this exists to record the cost of a full 7-year
 * recompute against a heavy-but-realistic dataset, so the decision to drop the
 * incremental applyDelta path in useBalances can be revisited with numbers.
 */
describe('computeBalances performance', () => {
  it('computes 7 years for a heavy dataset', () => {
    const transactions: Transaction[] = [];
    const freqs = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual'] as const;

    // 80 recurring series + 2000 one-offs — well beyond a typical household.
    for (let i = 0; i < 80; i++) {
      transactions.push({
        id: `rec-${i}`,
        user_id: 'u',
        name: `Recurring ${i}`,
        amount: 10 + i,
        category: i % 3 === 0 ? 'income' : 'expense',
        type: 'recurring',
        start_date: '2020-01-01',
        frequency: freqs[i % freqs.length],
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      });
    }
    for (let i = 0; i < 2000; i++) {
      const d = new Date(2020, 0, 1 + i);
      transactions.push({
        id: `one-${i}`,
        user_id: 'u',
        name: `One off ${i}`,
        amount: 5,
        category: 'expense',
        type: 'one_off',
        date: d.toISOString().slice(0, 10),
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      });
    }

    const started = performance.now();
    const { balances } = computeBalances({
      transactions,
      exceptions: [],
      fromDate: '2020-01-01',
      toDate: '2032-01-01',
    });
    const elapsed = performance.now() - started;

    console.log(
      `[bench] ${transactions.length} transactions over ${balances.size} days: ${elapsed.toFixed(1)}ms`,
    );

    expect(balances.size).toBeGreaterThan(4000);
  });
});
