'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { TransactionForm } from './TransactionForm';
import { RecurringEditForm } from './RecurringEditForm';
import { RecurringDeleteDialog } from './RecurringDeleteDialog';
import { useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import type { EditMode, DeleteMode } from '@/hooks/useTransactions';
import { FREQUENCIES } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import type { DayTransaction, TransactionFormValues } from '@/types';

interface Props {
  date: string;
  transactions: DayTransaction[];
  balance: number;
  formatAmount: (n: number) => string;
  symbol: string;
  onAddNew: () => void;
}

type ActiveAction =
  | { type: 'edit'; txId: string }
  | { type: 'delete'; txId: string }
  | null;

export function TransactionList({ date, transactions, balance, formatAmount, symbol, onAddNew }: Props) {
  const [active, setActive] = useState<ActiveAction>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<'all' | 'income' | 'expense'>('all');
  const update = useUpdateTransaction();
  const del = useDeleteTransaction();
  const { allTags } = useSettings();

  const isPositive = balance > 0;
  const isNegative = balance < 0;
  const clearActive = () => setActive(null);

  const filtered = transactions.filter((tx) => {
    if (filterCat !== 'all' && tx.category !== filterCat) return false;
    if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Balance summary */}
      <div className={cn(
        'relative rounded-2xl p-4 mb-4 overflow-hidden',
        isPositive && 'bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/10 border border-emerald-100 dark:border-emerald-900/30',
        isNegative && 'bg-gradient-to-br from-red-50 to-rose-50/60 dark:from-red-950/30 dark:to-rose-950/10 border border-red-100 dark:border-red-900/30',
        !isPositive && !isNegative && 'bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.08]',
      )}>
        <div className={cn(
          'absolute top-0 inset-x-0 h-[3px]',
          isPositive && 'bg-gradient-to-r from-emerald-400 to-teal-400',
          isNegative && 'bg-gradient-to-r from-red-400 to-rose-400',
          !isPositive && !isNegative && 'bg-gradient-to-r from-slate-300 to-slate-200 dark:from-white/10 dark:to-white/5',
        )} />
        <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1.5 mt-0.5">
          Balance · {format(new Date(date + 'T12:00:00'), 'd MMM yyyy')}
        </p>
        <p className={cn(
          'text-3xl font-extrabold tracking-tight tabular-nums',
          isPositive && 'text-emerald-600 dark:text-emerald-400',
          isNegative && 'text-red-600 dark:text-red-400',
          !isPositive && !isNegative && 'text-slate-600 dark:text-slate-400',
        )}>
          {formatAmount(balance)}
        </p>
      </div>

      {/* Search + filter */}
      {transactions.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="w-full h-8 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
            {(['all', 'income', 'expense'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn(
                  'flex-1 h-7 text-xs font-medium transition-all',
                  filterCat === cat
                    ? cat === 'income'
                      ? 'bg-emerald-500 text-white'
                      : cat === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-900 text-white'
                    : 'bg-white dark:bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/5',
                )}
              >
                {cat === 'all' ? 'All' : cat === 'income' ? '+ Income' : '− Expense'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-3 shadow-inner">
              <svg className="w-5 h-5 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400 dark:text-white/25">No transactions on this day</p>
            <p className="text-xs text-slate-300 dark:text-white/15 mt-0.5">Tap below to add one</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-slate-400 dark:text-white/30">No matching transactions</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((tx) => {
              const isEditing = active?.type === 'edit' && active.txId === tx.transaction_id;
              const isDeleting = active?.type === 'delete' && active.txId === tx.transaction_id;

              // ── EDIT form ─────────────────────────────────────────────
              if (isEditing) {
                if (tx.type === 'recurring') {
                  return (
                    <li key={tx.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                      <RecurringEditForm
                        tx={tx}
                        occurrenceDate={date}
                        onCancel={clearActive}
                        isLoading={update.isPending}
                        onSubmit={({ editMode, name, amount, category, frequency, end_date }) => {
                          update.mutate(
                            {
                              id: tx.transaction_id,
                              editMode: editMode as EditMode,
                              effectiveFrom: date,
                              values: { name, amount, category, frequency, end_date },
                            },
                            { onSuccess: clearActive },
                          );
                        }}
                      />
                      {update.isError && (
                        <p className="mt-2 text-xs text-red-500">
                          {(update.error as Error)?.message}
                        </p>
                      )}
                    </li>
                  );
                }

                // One-off edit
                return (
                  <li key={tx.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                    <TransactionForm
                      symbol={symbol}
                      initialValues={{
                        id: tx.transaction_id,
                        name: tx.name,
                        amount: tx.amount,
                        category: tx.category,
                        type: tx.type,
                        date,
                      }}
                      onCancel={clearActive}
                      isLoading={update.isPending}
                      onSubmit={(values: TransactionFormValues) => {
                        update.mutate(
                          { id: tx.transaction_id, editMode: 'all', values },
                          { onSuccess: clearActive },
                        );
                      }}
                    />
                    {update.isError && (
                      <p className="mt-2 text-xs text-red-500">
                        {(update.error as Error)?.message}
                      </p>
                    )}
                  </li>
                );
              }

              // ── DELETE dialog ─────────────────────────────────────────
              if (isDeleting) {
                if (tx.type === 'recurring') {
                  return (
                    <li key={tx.id} className="rounded-xl border border-red-200 dark:border-red-500/30 p-4">
                      <RecurringDeleteDialog
                        tx={tx}
                        occurrenceDate={date}
                        onCancel={clearActive}
                        isLoading={del.isPending}
                        onConfirm={(deleteMode: DeleteMode) => {
                          del.mutate(
                            {
                              id: tx.transaction_id,
                              deleteMode,
                              effectiveFrom: date,
                            },
                            { onSuccess: clearActive },
                          );
                        }}
                      />
                      {del.isError && (
                        <p className="mt-2 text-xs text-red-500">
                          {(del.error as Error)?.message}
                        </p>
                      )}
                    </li>
                  );
                }

                // One-off delete
                return (
                  <li key={tx.id} className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-900/20 p-4">
                    <p className="text-sm text-slate-700 dark:text-white/80 mb-3">
                      Delete &quot;{tx.name}&quot;?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        loading={del.isPending}
                        onClick={() =>
                          del.mutate(
                            { id: tx.transaction_id, deleteMode: 'all' },
                            { onSuccess: clearActive },
                          )
                        }
                      >
                        Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={clearActive}>
                        Cancel
                      </Button>
                    </div>
                    {del.isError && (
                      <p className="mt-2 text-xs text-red-500">
                        {(del.error as Error)?.message}
                      </p>
                    )}
                  </li>
                );
              }

              // ── Default row ───────────────────────────────────────────
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent hover:border-slate-100 dark:hover:border-white/[0.06] transition-all group"
                >
                  <div className={cn(
                    'w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[1.75rem]',
                    tx.category === 'income' ? 'bg-emerald-400' : 'bg-red-400',
                  )} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white/90 truncate">{tx.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {tx.type === 'recurring' && tx.frequency && (
                        <p className="text-xs text-slate-400 dark:text-white/40">{FREQUENCIES[tx.frequency]}</p>
                      )}
                      {tx.tag && allTags[tx.tag] && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-white"
                          style={{ backgroundColor: allTags[tx.tag].color }}
                        >
                          {allTags[tx.tag].label}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={cn(
                    'text-sm font-semibold tabular-nums flex-shrink-0',
                    tx.category === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                  )}>
                    {tx.category === 'income' ? '+' : '−'}{formatAmount(tx.amount)}
                  </span>

                  {/* Actions — always visible on mobile, hover on desktop */}
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => setActive({ type: 'edit', txId: tx.transaction_id })}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/70 transition-colors"
                      aria-label="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActive({ type: 'delete', txId: tx.transaction_id })}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      aria-label="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add button */}
      <div className="pt-4 mt-auto border-t border-slate-100 dark:border-white/[0.08]">
        <Button onClick={onAddNew} className="w-full" size="lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add transaction
        </Button>
      </div>
    </div>
  );
}
