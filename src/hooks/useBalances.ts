'use client';

import { useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { useTransactions } from './useTransactions';
import { computeBalances, applyDelta } from '@/engine/balanceEngine';
import { SEVEN_YEARS_DAYS } from '@/lib/constants';
import type { BalanceMap } from '@/engine/balanceEngine';
import type { TransactionsData } from './useTransactions';
import type { DayTransaction, Transaction, TransactionException } from '@/types';

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

/**
 * Find the earliest date we need to start computing from.
 * We must start from the earliest transaction so that historical
 * transactions compound into today's running balance.
 */
function getEarliestComputeStart(
  transactions: Transaction[],
  resetDate: string | null | undefined,
  today: Date,
): string {
  const todayStr = format(today, 'yyyy-MM-dd');
  if (resetDate) return resetDate;
  let earliest = todayStr;
  for (const tx of transactions) {
    const d = tx.type === 'one_off' ? (tx.date ?? todayStr) : (tx.start_date ?? todayStr);
    if (d < earliest) earliest = d;
  }
  return earliest;
}

/**
 * Diffs two TransactionsData snapshots and returns the earliest date
 * that could possibly be affected by the change.
 */
function findEarliestAffectedDate(
  prev: TransactionsData,
  next: TransactionsData,
  resetDate: string | null | undefined,
  todayStr: string,
): string {
  let earliest = todayStr;

  const touch = (date: string | null | undefined) => {
    const d = date ?? todayStr;
    if (d < earliest) earliest = d;
  };

  const prevTxMap = new Map<string, Transaction>(prev.transactions.map((t) => [t.id, t]));
  const nextTxMap = new Map<string, Transaction>(next.transactions.map((t) => [t.id, t]));
  const prevExcMap = new Map<string, TransactionException>(prev.exceptions.map((e) => [e.id, e]));
  const nextExcMap = new Map<string, TransactionException>(next.exceptions.map((e) => [e.id, e]));

  for (const tx of next.transactions) {
    if (!prevTxMap.has(tx.id)) touch(tx.date ?? tx.start_date);
  }
  for (const tx of prev.transactions) {
    if (!nextTxMap.has(tx.id)) touch(tx.date ?? tx.start_date);
  }
  for (const tx of next.transactions) {
    const p = prevTxMap.get(tx.id);
    if (p && !txEqual(p, tx)) {
      touch(p.date ?? p.start_date);
      touch(tx.date ?? tx.start_date);
    }
  }

  for (const exc of next.exceptions) {
    if (!prevExcMap.has(exc.id)) touch(exc.effective_from);
  }
  for (const exc of prev.exceptions) {
    if (!nextExcMap.has(exc.id)) touch(exc.effective_from);
  }
  for (const exc of next.exceptions) {
    const p = prevExcMap.get(exc.id);
    if (p && p.effective_from !== exc.effective_from) {
      touch(p.effective_from);
      touch(exc.effective_from);
    }
  }

  if (resetDate && earliest < resetDate) earliest = resetDate;

  return earliest;
}

function txEqual(a: Transaction, b: Transaction): boolean {
  return (
    a.amount === b.amount &&
    a.category === b.category &&
    a.date === b.date &&
    a.start_date === b.start_date &&
    a.end_date === b.end_date &&
    a.frequency === b.frequency &&
    a.name === b.name &&
    a.tag === b.tag &&
    a.account_id === b.account_id
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param accountId  'combined' = all accounts summed; specific uuid = filter to that account.
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

  // Cache the last computed result so applyDelta can reuse it
  const cacheRef = useRef<{
    txData: TransactionsData;
    resetDate: string | null | undefined;
    accountId: string;
    result: BalanceMap;
  } | null>(null);

  const result = useMemo(() => {
    if (!filteredTxData) {
      return {
        balances: new Map<string, number>(),
        dayTransactions: new Map<string, DayTransaction[]>(),
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toDate = format(addDays(today, SEVEN_YEARS_DAYS), 'yyyy-MM-dd');
    const cache = cacheRef.current;

    let newResult: BalanceMap;

    const effectiveResetDate = accountId === 'combined' ? undefined : resetDate;

    if (cache && cache.resetDate === effectiveResetDate && cache.accountId === accountId) {
      // ── Incremental path: recompute only from the earliest affected date ──
      const todayStr = format(today, 'yyyy-MM-dd');
      const fromDate = findEarliestAffectedDate(cache.txData, filteredTxData, effectiveResetDate, todayStr);
      newResult = applyDelta(cache.result, {
        transactions: filteredTxData.transactions,
        exceptions: filteredTxData.exceptions,
        resetDate: effectiveResetDate ?? null,
        fromDate,
        toDate,
      });
    } else {
      // ── Full path: first load, accountId changed, or resetDate changed ──
      const fromDate = getEarliestComputeStart(filteredTxData.transactions, effectiveResetDate, today);
      newResult = computeBalances({
        transactions: filteredTxData.transactions,
        exceptions: filteredTxData.exceptions,
        resetDate: effectiveResetDate ?? null,
        fromDate,
        toDate,
      });
    }

    cacheRef.current = { txData: filteredTxData, resetDate: effectiveResetDate, accountId, result: newResult };
    return newResult;
  }, [filteredTxData, resetDate, accountId]);

  return {
    balances: result.balances,
    dayTransactions: result.dayTransactions,
    isLoading: txLoading,
    error: txError as Error | null,
  };
}
