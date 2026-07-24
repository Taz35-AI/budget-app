import { computeBalances, applyDelta } from './balanceEngine';
import type { BalanceMap } from './balanceEngine';
import type { TransactionSnapshot } from './balanceDiff';
import type { Transaction, TransactionException } from '@/types';

/**
 * Memoization layer over the balance engine.
 *
 * A full 7-year recompute costs ~400ms for a heavy household (see
 * balanceEngine.bench.test.ts), which is too slow to run on every keystroke-level
 * data change. `applyDelta` recomputes only from the earliest affected date and
 * produces an identical result to a full `computeBalances` — that equivalence is
 * asserted in balanceEngine.test.ts and is what makes this cache safe: the
 * output is a pure function of the inputs, and the cache only affects how fast
 * we get there, never what we get.
 *
 * Because it's a pure memo (not component state), it lives outside React
 * instead of in a ref, so nothing is read or mutated during render.
 */

export interface BalanceInputs {
  transactions: Transaction[];
  exceptions: TransactionException[];
  resetDate: string | null | undefined;
  toDate: string;
  /** Full-compute start date, used when there's no reusable cache entry. */
  fullFromDate: string;
  /** Earliest date affected since the cached snapshot, used for the delta path. */
  deltaFromDate: (prev: TransactionSnapshot) => string;
}

interface CacheEntry extends TransactionSnapshot {
  resetDate: string | null | undefined;
  result: BalanceMap;
}

/** One entry per account view ('combined' or an account id). */
const cache = new Map<string, CacheEntry>();

export function computeBalancesCached(cacheKey: string, inputs: BalanceInputs): BalanceMap {
  const { transactions, exceptions, resetDate, toDate } = inputs;
  const prev = cache.get(cacheKey);

  const canReuse = prev !== undefined && prev.resetDate === resetDate;

  const result = canReuse
    ? applyDelta(prev.result, {
        transactions,
        exceptions,
        resetDate: resetDate ?? null,
        fromDate: inputs.deltaFromDate(prev),
        toDate,
      })
    : computeBalances({
        transactions,
        exceptions,
        resetDate: resetDate ?? null,
        fromDate: inputs.fullFromDate,
        toDate,
      });

  cache.set(cacheKey, { transactions, exceptions, resetDate, result });
  return result;
}

/** Test seam — drops all memoized results. */
export function clearBalanceCache(): void {
  cache.clear();
}
