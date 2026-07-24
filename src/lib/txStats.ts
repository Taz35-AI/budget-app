import type { DayTransaction } from '@/types';

/**
 * Shared aggregation rules for income/expense summaries.
 *
 * The one rule that matters: a transfer between your own accounts is not
 * income and not spending. It has two legs — an expense on the source account
 * and an income on the destination — so counting them inflates BOTH totals by
 * the transfer amount while leaving net unchanged. Moving £500 to savings
 * should not read as "£500 spent" or push you over a budget limit.
 *
 * `BudgetsShell` has always applied this rule; these helpers exist so the
 * dashboard, month summary and reports apply it the same way.
 */

/** True when a transaction represents real money entering or leaving your finances. */
export function isRealCashflow(tx: DayTransaction): boolean {
  return !tx.transfer_id;
}

export interface IncomeExpenseTotals {
  income: number;
  expense: number;
  net: number;
  /** Count of the transactions that were actually counted. */
  count: number;
}

/** Sums income and expense, skipping transfer legs. Amounts are rounded to cents. */
export function sumIncomeExpense(transactions: Iterable<DayTransaction>): IncomeExpenseTotals {
  let income = 0;
  let expense = 0;
  let count = 0;

  for (const tx of transactions) {
    if (!isRealCashflow(tx)) continue;
    count += 1;
    if (tx.category === 'income') income += tx.amount;
    else expense += tx.amount;
  }

  income = round2(income);
  expense = round2(expense);
  return { income, expense, net: round2(income - expense), count };
}

/** Sums expenses per tag, skipping transfer legs. Untagged rolls into `untaggedKey`. */
export function sumExpenseByTag(
  transactions: Iterable<DayTransaction>,
  untaggedKey = '__untagged__',
  isKnownTag?: (tag: string) => boolean,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const tx of transactions) {
    if (!isRealCashflow(tx)) continue;
    if (tx.category !== 'expense') continue;
    const tag = tx.tag;
    const known = tag != null && (isKnownTag ? isKnownTag(tag) : true);
    const key = known ? tag! : untaggedKey;
    out[key] = round2((out[key] ?? 0) + tx.amount);
  }
  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
