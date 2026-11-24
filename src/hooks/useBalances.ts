'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { useTransactions } from './useTransactions';
import { computeBalancesCached } from '@/engine/balanceCache';
import { computeBalancesShared } from '@/engine/balanceWorkerClient';
import { getEarliestComputeStart, findEarliestAffectedDate } from '@/engine/balanceDiff';
import { SEVEN_YEARS_DAYS, EAGER_HORIZON_DAYS } from '@/lib/constants';
import type { BalanceMap } from '@/engine/balanceEngine';
import type { TransactionsData } from './useTransactions';
import type { DayTransaction } from '@/types';

async function fetchResetDate(accountId: string): Promise<string | null> {
  if (accountId === 'combined') return null;
  const res = await fetch(`/api/balance-reset?accountId=${accountId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.reset?.reset_date ?? null;
}

export interface BalancesResult {
  balances: Map<string, number>;
  dayTransactions: Map<string, DayTransaction[]>;
  isLoading: boolean;
  error: Error | null;
}

const EMPTY: BalanceMap = { balances: new Map(), dayTransactions: new Map() };

// A stable id per distinct transactions payload. React Query keeps the same
// object when a refetch returns identical data (structural sharing) and hands
// out a new one for real changes and optimistic writes, so object identity is
// exactly "did the data change?".
const dataIds = new WeakMap<object, number>();
let nextDataId = 1;

function dataIdOf(data: object | undefined): number {
  if (!data) return 0;
  let id = dataIds.get(data);
  if (id === undefined) {
    id = nextDataId++;
    dataIds.set(data, id);
  }
  return id;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param accountId  'combined' = all accounts summed; specific uuid = filter to that account.
 *
 * Two horizons are produced from the same pure engine:
 *   • an eager ~18-month window, computed synchronously so an edit repaints the
 *     visible calendar and forecast instantly, and
 *   • the full 7-year horizon, computed in a Web Worker and swapped in when ready.
 * Overlapping dates are identical between the two (same inputs, same engine), so
 * the swap never changes a visible number — it only extends the range.
 */
export function useBalances(accountId: string = 'combined'): BalancesResult {
  const { data: txData, isLoading: txLoading, error: txError } = useTransactions();

  const { data: resetDate } = useQuery<string | null>({
    queryKey: ['balance-reset', accountId],
    queryFn: () => fetchResetDate(accountId),
    staleTime: 60_000,
    // Combined view never uses a reset date
    enabled: accountId !== 'combined',
  });

  // Filter transactions to the selected account (or keep all for 'combined')
  const filteredTxData = useMemo<TransactionsData | undefined>(() => {
    if (!txData) return undefined;
    if (accountId === 'combined') return txData;
    return {
      transactions: txData.transactions.filter((t) => t.account_id === accountId),
      exceptions: txData.exceptions,
    };
  }, [txData, accountId]);

  const effectiveResetDate = accountId === 'combined' ? undefined : resetDate;

  // A key that changes whenever the inputs that drive a recompute change. It is
  // identical across every hook consumer of the same data, so they share one
  // worker compute.
  //
  // It is keyed on the identity of the data, not on when it was last fetched:
  // the transactions query polls every 30s, and keying on the fetch time made
  // every poll throw away the full-horizon result, fall back to the eager
  // window, recompute seven years in the worker and re-render everything
  // twice, even though nothing had changed.
  const version = `${accountId}|${dataIdOf(txData)}|${effectiveResetDate ?? ''}`;

  // ── Eager window: synchronous, instant ────────────────────────────────────
  const eager = useMemo(() => {
    if (!filteredTxData) return EMPTY;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');
    const eagerToDate = format(addDays(today, EAGER_HORIZON_DAYS), 'yyyy-MM-dd');
    return computeBalancesCached(`${accountId}::eager`, {
      transactions: filteredTxData.transactions,
      exceptions: filteredTxData.exceptions,
      resetDate: effectiveResetDate,
      toDate: eagerToDate,
      fullFromDate: getEarliestComputeStart(filteredTxData.transactions, effectiveResetDate, today),
      deltaFromDate: (prev) => findEarliestAffectedDate(prev, filteredTxData, effectiveResetDate, todayStr),
    });
  }, [filteredTxData, effectiveResetDate, accountId]);

  // ── Full horizon: off the main thread, swapped in when ready ──────────────
  const [full, setFull] = useState<{ version: string; map: BalanceMap } | null>(null);

  useEffect(() => {
    if (!filteredTxData) return;
    let cancelled = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fullToDate = format(addDays(today, SEVEN_YEARS_DAYS), 'yyyy-MM-dd');
    computeBalancesShared(version, {
      transactions: filteredTxData.transactions,
      exceptions: filteredTxData.exceptions,
      resetDate: effectiveResetDate ?? null,
      fromDate: getEarliestComputeStart(filteredTxData.transactions, effectiveResetDate, today),
      toDate: fullToDate,
    }).then((map) => {
      if (!cancelled) setFull({ version, map });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, filteredTxData]);

  // Use the full result only when it matches the current inputs; otherwise the
  // eager window (which is always freshly recomputed for the current inputs).
  const active = full && full.version === version ? full.map : eager;

  return {
    balances: active.balances,
    dayTransactions: active.dayTransactions,
    isLoading: txLoading,
    error: txError as Error | null,
  };
}
