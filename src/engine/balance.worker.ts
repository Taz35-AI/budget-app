/// <reference lib="webworker" />
import { computeBalances } from './balanceEngine';
import type { ComputeOptions, BalanceMap } from './balanceEngine';

export interface BalanceWorkerRequest {
  token: number;
  options: ComputeOptions;
}

export interface BalanceWorkerResponse {
  token: number;
  balances: BalanceMap['balances'];
  dayTransactions: BalanceMap['dayTransactions'];
}

// The engine is pure, so it runs identically here as on the main thread. Maps
// are transferred by the structured-clone algorithm, no manual serialisation.
self.onmessage = (e: MessageEvent<BalanceWorkerRequest>) => {
  const { token, options } = e.data;
  const { balances, dayTransactions } = computeBalances(options);
  const response: BalanceWorkerResponse = { token, balances, dayTransactions };
  (self as unknown as Worker).postMessage(response);
};
