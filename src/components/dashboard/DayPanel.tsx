'use client';

import { useEffect, useRef, useState } from 'react';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';
import type { DayTransaction, Transaction, TransactionFormValues } from '@/types';

interface Props {
  date: string | null;
  transactions: DayTransaction[];
  balance: number;
  formatAmount: (n: number) => string;
  symbol: string;
  isAdding: boolean;
  onAddNew: () => void;
  onCancelAdd: () => void;
  onClose: () => void;
  showTip?: boolean;
}

export function DayPanel({
  date,
  transactions,
  balance,
  formatAmount,
  symbol,
  isAdding,
  onAddNew,
  onCancelAdd,
  onClose,
  showTip,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const create = useCreateTransaction();
  const isOpen = date !== null;
  const [duplicateValues, setDuplicateValues] = useState<Partial<Transaction> | null>(null);

  const handleDuplicate = (tx: DayTransaction) => {
    setDuplicateValues({ name: tx.name, amount: tx.amount, category: tx.category, type: tx.type, tag: tx.tag ?? undefined, frequency: tx.frequency ?? undefined });
  };
  const cancelDuplicate = () => setDuplicateValues(null);
  const isShowingForm = isAdding || duplicateValues !== null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 native-backdrop z-20 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          'hidden lg:block',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-sm rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] z-30',
          'bg-white dark:bg-[#0F0F1A]',
          'flex flex-col transition-transform duration-300 ease-out',
          'hidden lg:flex',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/[0.08]">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {date
              ? new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              : ''}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white active:scale-[0.90] transition-all duration-100"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mutation error banner */}
        {create.isError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-400">
            Failed to save: {(create.error as Error)?.message ?? 'Unknown error'}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {date && (
            isShowingForm ? (
              <TransactionForm
                defaultDate={date}
                symbol={symbol}
                isDuplicate={duplicateValues !== null}
                initialValues={duplicateValues ?? undefined}
                onCancel={() => { cancelDuplicate(); if (isAdding) onCancelAdd(); }}
                isLoading={create.isPending}
                onSubmit={(values: TransactionFormValues) => {
                  create.reset();
                  if (duplicateValues !== null) {
                    create.mutate(values, { onSuccess: cancelDuplicate });
                  } else {
                    create.mutate(values, { onSuccess: onCancelAdd });
                  }
                }}
              />
            ) : (
              <TransactionList
                date={date}
                transactions={transactions}
                balance={balance}
                formatAmount={formatAmount}
                symbol={symbol}
                onAddNew={onAddNew}
                onDuplicate={handleDuplicate}
                showTip={showTip}
              />
            )
          )}
        </div>
      </aside>
    </>
  );
}
