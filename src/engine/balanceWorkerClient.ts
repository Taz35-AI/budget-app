import { computeBalances } from './balanceEngine';
import type { ComputeOptions, BalanceMap } from './balanceEngine';
import type { BalanceWorkerResponse } from './balance.worker';

/**
 * Runs the full-horizon balance compute off the main thread.
 *
 * The engine is heavy over a 7-year daily horizon, so running it synchronously
 * on every edit freezes the UI. This client hands the work to a Web Worker and
 * resolves a promise with the result, keeping the main thread free to paint the
 * eager near-term window first.
 *
 * When no Worker is available (server render, unit tests, the odd WebView), it
 * falls back to computing on the main thread after a macrotask yield — correct,
 * just not off-thread.
 */

let worker: Worker | null = null;
let workerBroken = false;
let nextToken = 1;
const pending = new Map<number, (result: BalanceMap) => void>();

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./balance.worker.ts', import.meta.url));
    worker.onmessage = (e: MessageEvent<BalanceWorkerResponse>) => {
      const { token, balances, dayTransactions } = e.data;
      const resolve = pending.get(token);
      if (resolve) {
        pending.delete(token);
        resolve({ balances, dayTransactions });
      }
    };
    worker.onerror = () => {
      // If the worker fails to load, don't keep retrying it — fall back to the
      // main-thread path for the rest of the session so results still arrive.
      workerBroken = true;
      worker?.terminate();
      worker = null;
      // Drop any promises waiting on the now-dead worker; callers recompute via
      // the main-thread fallback on their next request.
      pending.clear();
    };
    return worker;
  } catch {
    workerBroken = true;
    worker = null;
    return null;
  }
}

function computeOffThread(options: ComputeOptions): Promise<BalanceMap> {
  const w = getWorker();
  if (!w) {
    // Yield a macrotask so the eager render paints before this runs.
    return new Promise((resolve) => {
      setTimeout(() => resolve(computeBalances(options)), 0);
    });
  }
  const token = nextToken++;
  return new Promise((resolve) => {
    pending.set(token, resolve);
    w.postMessage({ token, options });
  });
}

// Share one in-flight compute across every hook consumer of the same data
// version, so N components subscribing to the same account don't each queue a
// full recompute on the single worker.
const inflight = new Map<string, Promise<BalanceMap>>();

export function computeBalancesShared(dedupeKey: string, options: ComputeOptions): Promise<BalanceMap> {
  const existing = inflight.get(dedupeKey);
  if (existing) return existing;

  const promise = computeOffThread(options).finally(() => {
    inflight.delete(dedupeKey);
  });
  inflight.set(dedupeKey, promise);
  return promise;
}

/** Test seam. */
export function _resetWorkerClient(): void {
  pending.clear();
  inflight.clear();
  worker?.terminate();
  worker = null;
  workerBroken = false;
  nextToken = 1;
}
