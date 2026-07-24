import { describe, it, expect } from 'vitest';
import { sumIncomeExpense, sumExpenseByTag, isRealCashflow } from './txStats';
import type { DayTransaction } from '@/types';

function tx(over: Partial<DayTransaction> = {}): DayTransaction {
  return {
    id: 'd1',
    transaction_id: 't1',
    account_id: 'a1',
    parent_id: null,
    transfer_id: null,
    created_by: 'u1',
    name: 'Thing',
    amount: 100,
    category: 'expense',
    type: 'one_off',
    tag: null,
    frequency: null,
    is_exception: false,
    ...over,
  } as DayTransaction;
}

describe('sumIncomeExpense', () => {
  it('sums plain income and expense', () => {
    const totals = sumIncomeExpense([
      tx({ category: 'income', amount: 3000 }),
      tx({ category: 'expense', amount: 1200 }),
      tx({ category: 'expense', amount: 300 }),
    ]);
    expect(totals).toEqual({ income: 3000, expense: 1500, net: 1500, count: 3 });
  });

  it('excludes both legs of a transfer', () => {
    // £500 moved from current account to savings: an expense leg and an income
    // leg sharing a transfer_id. Neither is real income or real spending.
    const withTransfer = sumIncomeExpense([
      tx({ category: 'income', amount: 3000 }),
      tx({ category: 'expense', amount: 1200 }),
      tx({ category: 'expense', amount: 500, transfer_id: 'tr-1' }),
      tx({ category: 'income', amount: 500, transfer_id: 'tr-1' }),
    ]);

    expect(withTransfer.income).toBe(3000);
    expect(withTransfer.expense).toBe(1200);
    expect(withTransfer.net).toBe(1800);
    expect(withTransfer.count).toBe(2);
  });

  it('leaves net unchanged but fixes the inflated headline figures', () => {
    const legs = [
      tx({ category: 'income', amount: 2000 }),
      tx({ category: 'expense', amount: 800 }),
      tx({ category: 'expense', amount: 500, transfer_id: 'tr-1' }),
      tx({ category: 'income', amount: 500, transfer_id: 'tr-1' }),
    ];

    // Naive aggregation (what the dashboard used to do)
    let naiveIncome = 0;
    let naiveExpense = 0;
    for (const t of legs) {
      if (t.category === 'income') naiveIncome += t.amount;
      else naiveExpense += t.amount;
    }

    const fixed = sumIncomeExpense(legs);

    // Net agrees either way — which is why this stayed hidden.
    expect(naiveIncome - naiveExpense).toBe(fixed.net);
    // But the headline numbers were both overstated by the transfer amount.
    expect(naiveIncome - fixed.income).toBe(500);
    expect(naiveExpense - fixed.expense).toBe(500);
  });

  it('keeps cent precision', () => {
    const totals = sumIncomeExpense([
      tx({ category: 'expense', amount: 0.1 }),
      tx({ category: 'expense', amount: 0.2 }),
    ]);
    expect(totals.expense).toBe(0.3);
  });

  it('handles an empty list', () => {
    expect(sumIncomeExpense([])).toEqual({ income: 0, expense: 0, net: 0, count: 0 });
  });
});

describe('sumExpenseByTag', () => {
  it('groups expenses by tag and ignores income', () => {
    const byTag = sumExpenseByTag([
      tx({ category: 'expense', amount: 50, tag: 'food' }),
      tx({ category: 'expense', amount: 25, tag: 'food' }),
      tx({ category: 'expense', amount: 40, tag: 'transport' }),
      tx({ category: 'income', amount: 999, tag: 'salary' }),
    ]);
    expect(byTag).toEqual({ food: 75, transport: 40 });
  });

  it('excludes transfer legs', () => {
    const byTag = sumExpenseByTag([
      tx({ category: 'expense', amount: 50, tag: 'food' }),
      tx({ category: 'expense', amount: 500, tag: 'savings', transfer_id: 'tr-1' }),
    ]);
    expect(byTag).toEqual({ food: 50 });
  });

  it('rolls untagged and unknown tags into the untagged bucket', () => {
    const known = new Set(['food']);
    const byTag = sumExpenseByTag(
      [
        tx({ category: 'expense', amount: 10, tag: 'food' }),
        tx({ category: 'expense', amount: 20, tag: null }),
        // An orphaned tag id left behind after the tag was deleted
        tx({ category: 'expense', amount: 5, tag: 'deleted-tag-uuid' }),
      ],
      '__untagged__',
      (t) => known.has(t),
    );
    expect(byTag).toEqual({ food: 10, __untagged__: 25 });
  });
});

describe('isRealCashflow', () => {
  it('rejects transfer legs and accepts everything else', () => {
    expect(isRealCashflow(tx())).toBe(true);
    expect(isRealCashflow(tx({ transfer_id: 'tr-1' }))).toBe(false);
  });
});
