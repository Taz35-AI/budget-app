import type {
  Transaction,
  TransactionException,
  BudgetAccount,
  HouseholdMember,
  HouseholdInvite,
} from '@/types';

/**
 * Client side of `/api/bootstrap`: one request that feeds the first load of
 * several queries, instead of each query making its own.
 *
 * How it fits with React Query: nothing about the queries changes except the
 * first line of their fetch function, which asks here for "its" slice. If a
 * slice is available it is returned; otherwise the query fetches from its own
 * endpoint exactly as before. So this can only ever save requests: any
 * failure, an old deployment without the endpoint, or a refetch all fall
 * through to the original behaviour.
 *
 * Rules:
 *  - The request is made at most once per page lifetime (until reset).
 *  - Each slice can be taken once. A refetch (the 30s poll, invalidation after
 *    a mutation) must hit the real endpoint to get current data.
 *  - A slice is only handed out for a short while after the request started,
 *    so a query that first mounts minutes later doesn't get stale data.
 */

export interface BootstrapSlices {
  transactions: { transactions: Transaction[]; exceptions: TransactionException[] };
  accounts: BudgetAccount[];
  settings: { settings: unknown };
  members: { members: HouseholdMember[]; householdId: string };
  pendingInvites: (HouseholdInvite & { inviter_name?: string })[];
}

const FRESH_MS = 10_000;

let request: Promise<Partial<BootstrapSlices>> | null = null;
let startedAt = 0;
const taken = new Set<keyof BootstrapSlices>();

function start(): void {
  startedAt = Date.now();
  taken.clear();
  request = fetch('/api/bootstrap')
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => (body?.slices ?? {}) as Partial<BootstrapSlices>)
    .catch(() => ({}));
}

interface TakeOptions {
  /**
   * Whether asking for this slice may trigger the request. True for the data
   * that only signed-in app pages load (transactions, accounts). False for
   * things mounted on every page (settings, household): they join a bootstrap
   * that is already under way but don't cause one, so a signed-in visitor on
   * the landing page or blog doesn't download their whole ledger.
   */
  start: boolean;
}

/**
 * Resolves to the slice, or `undefined` when the caller should fetch from its
 * own endpoint instead.
 */
export async function takeBootstrapSlice<K extends keyof BootstrapSlices>(
  key: K,
  options: TakeOptions,
): Promise<BootstrapSlices[K] | undefined> {
  if (typeof window === 'undefined') return undefined;

  if (options.start) {
    // Synchronous on purpose: every query that mounts in the same render pass
    // must see the request as already started.
    if (!request) start();
  } else {
    // Queries start in mount order, and the page-level ones (which can start
    // the request) mount after the app-wide ones (which can't). Yield once so
    // the whole pass has run before deciding there is nothing to join.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  if (!request || taken.has(key) || Date.now() - startedAt > FRESH_MS) return undefined;
  taken.add(key);

  const slices = await request;
  return slices[key];
}

/**
 * Forget the current bootstrap. Call on sign-out: the module outlives the
 * session, and the next person to sign in on this tab must never be handed
 * the previous user's data, nor be denied a bootstrap of their own.
 */
export function resetBootstrap(): void {
  request = null;
  startedAt = 0;
  taken.clear();
}
