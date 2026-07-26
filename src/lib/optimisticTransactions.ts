import { nextOccurrenceAfter } from '@/engine/recurringResolver';
import type { Transaction, TransactionException, Frequency } from '@/types';

/**
 * Client-side mirrors of the mutations performed by
 * PATCH/DELETE /api/transactions/[id].
 *
 * These exist so an edit can be applied to the React Query cache the instant
 * the user submits, without waiting ~1s of sequential Supabase round trips.
 * The critical property is fidelity: whatever these produce must match what the
 * server will produce, because the follow-up refetch overwrites the cache. If
 * they diverge, the user sees the balances visibly jump when the real data
 * lands, which is exactly the flash this replaces.
 *
 * Recurring edits are stored as exceptions rather than on the transaction row
 * (see the route handler), so these helpers write exceptions the same way,
 * including the "restore" exception that stops a single-occurrence change from
 * leaking into every later occurrence.
 */

export interface TxSnapshot {
  transactions: Transaction[];
  exceptions: TransactionException[];
}

export type EditMode = 'all' | 'all_future' | 'this_only';
export type DeleteMode = 'all' | 'all_future' | 'this_only';

/** Values the edit form can send. Mirrors the PATCH body. */
export interface EditValues {
  name?: string;
  amount?: number | string;
  category?: string;
  tag?: string | null;
  frequency?: string | null;
  end_date?: string | null;
  account_id?: string | null;
  date?: string;
  start_date?: string;
  newDate?: string;
  type?: string;
}

const optimisticId = (txId: string, date: string) => `optimistic-${txId}-${date}`;

/** Replace by (transaction_id, effective_from) or append, matching the server upsert. */
function upsertException(list: TransactionException[], exc: TransactionException): TransactionException[] {
  const i = list.findIndex(
    (e) => e.transaction_id === exc.transaction_id && e.effective_from === exc.effective_from,
  );
  if (i === -1) return [...list, exc];
  const next = [...list];
  next[i] = { ...exc, id: list[i].id };
  return next;
}

/** Most recent non-deleted exception in effect strictly before `date`. */
function priorEffective(
  list: TransactionException[],
  txId: string,
  date: string,
): TransactionException | null {
  return (
    list
      .filter((e) => e.transaction_id === txId && e.effective_from < date && !e.is_deleted)
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0] ?? null
  );
}

/** Drop every exception for `txId` dated on or after `fromDate` (clearExceptionsFrom). */
function clearFrom(list: TransactionException[], txId: string, fromDate: string): TransactionException[] {
  return list.filter((e) => !(e.transaction_id === txId && e.effective_from >= fromDate));
}

function makeException(
  txId: string,
  effectiveFrom: string,
  fields: Partial<Pick<TransactionException, 'name' | 'amount' | 'end_date' | 'is_deleted'>>,
): TransactionException {
  return {
    id: optimisticId(txId, effectiveFrom),
    transaction_id: txId,
    effective_from: effectiveFrom,
    name: fields.name ?? null,
    amount: fields.amount ?? null,
    end_date: fields.end_date ?? null,
    is_deleted: fields.is_deleted ?? false,
    created_at: new Date().toISOString(),
  };
}

/** The transfer counterpart of `tx`, if this is one leg of a transfer pair. */
function pairedOf(transactions: Transaction[], tx: Transaction): Transaction | null {
  if (!tx.transfer_id) return null;
  return transactions.find((t) => t.transfer_id === tx.transfer_id && t.id !== tx.id) ?? null;
}

/** Normalise form values the same way the route handler does. */
function normalise(values: EditValues) {
  const name = typeof values.name === 'string' ? values.name.trim().slice(0, 200) : undefined;
  const hasAmount = values.amount !== undefined && values.amount !== null && values.amount !== '';
  const amount = hasAmount ? Number(values.amount) : undefined;
  return {
    name: name || null,
    amount: Number.isFinite(amount as number) ? (amount as number) : null,
    end_date: values.end_date || null,
  };
}

/**
 * Applies a single-occurrence or forward edit to a snapshot.
 *
 * Returns null when the change is one this cannot faithfully reproduce (a date
 * move, which splits or respawns rows server side). Callers should fall back to
 * waiting for the server in that case rather than showing a guess.
 */
export function applyOptimisticEdit(
  data: TxSnapshot,
  params: { id: string; editMode: EditMode; effectiveFrom?: string; values: EditValues },
): TxSnapshot | null {
  const { id, editMode, effectiveFrom, values } = params;
  const tx = data.transactions.find((t) => t.id === id);
  if (!tx) return null;

  // Date moves split the series or spawn a one-off server side. Too involved to
  // mirror safely, and rare enough that waiting for the server is acceptable.
  if (values.newDate && values.newDate !== effectiveFrom) return null;
  // Switching one_off <-> recurring rewrites the row's shape; let the server own it.
  if (values.type && values.type !== tx.type) return null;

  const { name, amount, end_date } = normalise(values);
  const paired = pairedOf(data.transactions, tx);
  const targets = [tx, ...(paired ? [paired] : [])];

  // ── One-off, or edit the whole series: the row is the source of truth ──────
  if (tx.type === 'one_off' || editMode === 'all') {
    let exceptions = data.exceptions;
    if (editMode === 'all') {
      for (const t of targets) exceptions = exceptions.filter((e) => e.transaction_id !== t.id);
    }
    const transactions = data.transactions.map((t) => {
      if (t.id !== tx.id && t.id !== paired?.id) return t;
      const isPaired = t.id === paired?.id;
      return {
        ...t,
        name: name || t.name,
        amount: amount ?? t.amount,
        category: (values.category
          ? (isPaired ? flip(values.category) : values.category)
          : t.category) as Transaction['category'],
        tag: 'tag' in values ? (values.tag || null) : t.tag,
        date: values.date || t.date,
        start_date: values.start_date || t.start_date,
        end_date: end_date,
        frequency: (values.frequency || t.frequency) as Frequency | null,
        // account_id is never mirrored onto the paired leg.
        account_id: !isPaired && 'account_id' in values ? (values.account_id ?? null) : t.account_id,
      };
    });
    return { transactions, exceptions };
  }

  if (!effectiveFrom) return null;
  if (!tx.start_date || !tx.frequency) return null;

  let exceptions = data.exceptions;

  // ── This occurrence only ──────────────────────────────────────────────────
  if (editMode === 'this_only') {
    for (const t of targets) {
      if (!t.start_date || !t.frequency) continue;
      const prior = priorEffective(exceptions, t.id, effectiveFrom);
      const nextDate = nextOccurrenceAfter(t.start_date, t.frequency as Frequency, effectiveFrom);
      exceptions = upsertException(exceptions, makeException(t.id, effectiveFrom, { name, amount, end_date }));
      // Restore the following occurrence to what was in effect before, so the
      // one-off change does not carry forward.
      exceptions = upsertException(
        exceptions,
        makeException(t.id, nextDate, {
          name: prior?.name ?? null,
          amount: prior?.amount ?? null,
          end_date: prior?.end_date ?? null,
        }),
      );
    }
  }

  // ── This occurrence and every one after ───────────────────────────────────
  if (editMode === 'all_future') {
    for (const t of targets) {
      exceptions = clearFrom(exceptions, t.id, effectiveFrom);
      exceptions = upsertException(exceptions, makeException(t.id, effectiveFrom, { name, amount, end_date }));
    }
  }

  // Row-level fields exceptions cannot carry.
  const transactions = data.transactions.map((t) => {
    if (t.id !== tx.id && t.id !== paired?.id) return t;
    const isPaired = t.id === paired?.id;
    const next = { ...t };
    if ('category' in values && values.category) {
      next.category = (isPaired ? flip(values.category) : values.category) as Transaction['category'];
    }
    if ('frequency' in values) next.frequency = (values.frequency || t.frequency) as Frequency | null;
    if (!isPaired && 'account_id' in values) next.account_id = values.account_id ?? null;
    return next;
  });

  return { transactions, exceptions };
}

function flip(category: string): string {
  return category === 'income' ? 'expense' : 'income';
}

/**
 * Applies a delete to a snapshot, mirroring DELETE /api/transactions/[id].
 * Returns null when it cannot be reproduced faithfully.
 */
export function applyOptimisticDelete(
  data: TxSnapshot,
  params: { id: string; deleteMode: DeleteMode; effectiveFrom?: string },
): TxSnapshot | null {
  const { id, deleteMode, effectiveFrom } = params;
  const tx = data.transactions.find((t) => t.id === id);
  if (!tx) return null;

  const paired = pairedOf(data.transactions, tx);
  const targets = [tx, ...(paired ? [paired] : [])];

  // ── One-off: the row is simply removed ────────────────────────────────────
  if (tx.type === 'one_off') {
    const ids = new Set(targets.map((t) => t.id));
    return {
      transactions: data.transactions.filter((t) => !ids.has(t.id)),
      exceptions: data.exceptions.filter((e) => !ids.has(e.transaction_id)),
    };
  }

  // ── Whole series: remove the row and every split or spawn it fathered ─────
  if (deleteMode === 'all') {
    const familyIds = new Set<string>();
    for (const t of targets) {
      const rootId = t.parent_id ?? t.id;
      familyIds.add(rootId);
      for (const c of data.transactions) {
        if (c.id === rootId || c.parent_id === rootId) familyIds.add(c.id);
      }
    }
    return {
      transactions: data.transactions.filter((t) => !familyIds.has(t.id)),
      exceptions: data.exceptions.filter((e) => !familyIds.has(e.transaction_id)),
    };
  }

  if (!effectiveFrom) return null;

  let exceptions = data.exceptions;

  if (deleteMode === 'this_only') {
    for (const t of targets) {
      if (!t.start_date || !t.frequency) continue;
      const prior = priorEffective(exceptions, t.id, effectiveFrom);
      const nextDate = nextOccurrenceAfter(t.start_date, t.frequency as Frequency, effectiveFrom);
      exceptions = upsertException(exceptions, makeException(t.id, effectiveFrom, { is_deleted: true }));
      // Without this the deletion would swallow every later occurrence too.
      exceptions = upsertException(
        exceptions,
        makeException(t.id, nextDate, {
          name: prior?.name ?? null,
          amount: prior?.amount ?? null,
          end_date: prior?.end_date ?? null,
        }),
      );
    }
  }

  if (deleteMode === 'all_future') {
    for (const t of targets) {
      exceptions = clearFrom(exceptions, t.id, effectiveFrom);
      exceptions = upsertException(exceptions, makeException(t.id, effectiveFrom, { is_deleted: true }));
    }
  }

  return { transactions: data.transactions, exceptions };
}
