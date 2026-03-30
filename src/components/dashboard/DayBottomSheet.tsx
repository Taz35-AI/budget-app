'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';
import { useOfflineCreate } from '@/hooks/useOfflineCreate';
import { cn } from '@/lib/utils';
import type { BudgetAccount, DayTransaction, TransactionFormValues } from '@/types';

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
  onTransfer?: () => void;
  showTip?: boolean;
  accountId?: string;
  accounts?: BudgetAccount[];
}

export function DayBottomSheet({
  date,
  transactions,
  balance,
  formatAmount,
  symbol,
  isAdding,
  onAddNew,
  onCancelAdd,
  onClose,
  onTransfer,
  showTip,
  accountId,
  accounts,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentDragY = useRef<number>(0);

  // Which account new transactions go to — defaults to the active tab's account,
  // or the first account if on the Combined tab.
  const defaultAccountId = accountId ?? accounts?.[0]?.id;
  const [formAccountId, setFormAccountId] = useState<string | undefined>(defaultAccountId);

  // Re-sync when the active tab changes or the sheet re-opens for adding
  useEffect(() => {
    setFormAccountId(accountId ?? accounts?.[0]?.id);
  }, [accountId, accounts, isAdding]);

  const t = useTranslations('transactions');
  const tc = useTranslations('common');

  const create = useOfflineCreate(formAccountId);
  const showAccountPicker = (accounts?.length ?? 0) >= 2;
  const isOpen = date !== null;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    currentDragY.current = 0;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta < 0) return;
    currentDragY.current = delta;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    if (currentDragY.current > 120) {
      onClose();
    }
    dragStartY.current = null;
    currentDragY.current = 0;
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 rounded-t-3xl shadow-2xl',
          'bg-white dark:bg-[#131926]',
          'flex flex-col transition-transform duration-300 ease-out lg:hidden',
          'max-h-[92dvh]',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ willChange: 'transform' }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 pt-2">
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
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 active:bg-slate-200 dark:active:bg-white/20 transition-colors"
            aria-label={tc('close')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mutation error banner */}
        {create.isError && (
          <div className="mx-5 mb-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-400">
            {t('failedToSave', { message: (create.error as Error)?.message ?? 'Unknown error' })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 overscroll-contain">
          {date && (
            isAdding ? (
              <>
                {/* Account picker — only when 2+ accounts */}
                {showAccountPicker && (
                  <div className="flex gap-1.5 flex-wrap mb-3 pb-3 border-b border-slate-100 dark:border-white/[0.07]">
                    <p className="w-full text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-0.5">{t('addToAccount')}</p>
                    {accounts!.map((acct) => (
                      <button
                        key={acct.id}
                        type="button"
                        onClick={() => setFormAccountId(acct.id)}
                        className={cn(
                          'h-7 px-3 rounded-lg text-[11px] font-semibold transition-all border',
                          formAccountId === acct.id
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/50 border-slate-200 dark:border-white/10 hover:border-brand-primary/40',
                        )}
                      >
                        {acct.name}
                      </button>
                    ))}
                  </div>
                )}
                <TransactionForm
                  defaultDate={date}
                  symbol={symbol}
                  onCancel={onCancelAdd}
                  isLoading={create.isPending}
                  isCreditAccount={accounts?.find(a => a.id === formAccountId)?.type === 'credit'}
                  onSubmit={(values: TransactionFormValues) => {
                    create.submit(values, { onSuccess: onCancelAdd });
                  }}
                />
              </>
            ) : (
              <TransactionList
                date={date}
                transactions={transactions}
                balance={balance}
                formatAmount={formatAmount}
                symbol={symbol}
                onAddNew={onAddNew}
                onTransfer={onTransfer}
                showTip={showTip}
                accounts={accounts}
              />
            )
          )}
        </div>
      </div>
    </>
  );
}
