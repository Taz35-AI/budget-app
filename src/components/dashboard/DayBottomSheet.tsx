'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';
import { useOfflineCreate } from '@/hooks/useOfflineCreate';
import { cn } from '@/lib/utils';
import { accountDisplayName, groupAccountsByOwner, memberShortName } from '@/lib/memberUtils';
import type { BudgetAccount, DayTransaction, HouseholdMember, Transaction, TransactionFormValues } from '@/types';

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
  onTransfer?: (defaultToId?: string) => void;
  showTip?: boolean;
  accountId?: string;
  accounts?: BudgetAccount[];
  members?: HouseholdMember[];
  myUserId?: string | null;
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
  members,
  myUserId,
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

  // Filter the account picker: default to my accounts in shared households,
  // toggle to reveal all members' accounts.
  const [showAllAddAccounts, setShowAllAddAccounts] = useState(false);
  const hasHousehold = (members?.length ?? 0) > 1;
  const myAccounts = (accounts ?? []).filter((a) => a.user_id === myUserId);
  const hasOtherAccounts = (accounts ?? []).some((a) => a.user_id !== myUserId);
  const addPickerAccounts = (showAllAddAccounts || !hasHousehold || myAccounts.length === 0)
    ? accounts
    : myAccounts;

  useEffect(() => {
    if (!addPickerAccounts || addPickerAccounts.length === 0) return;
    if (!addPickerAccounts.find((a) => a.id === formAccountId)) {
      setFormAccountId(addPickerAccounts[0].id);
    }
  }, [addPickerAccounts, formAccountId]);

  const create = useOfflineCreate(formAccountId);
  const showAccountPicker = (accounts?.length ?? 0) >= 2;
  const isOpen = date !== null;
  const [duplicateValues, setDuplicateValues] = useState<Partial<Transaction> | null>(null);

  const handleDuplicate = (tx: DayTransaction) => {
    setDuplicateValues({ name: tx.name, amount: tx.amount, category: tx.category, type: tx.type, tag: tx.tag ?? undefined, frequency: tx.frequency ?? undefined });
  };
  const cancelDuplicate = () => setDuplicateValues(null);
  const isShowingForm = isAdding || duplicateValues !== null;

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
    if (delta > 0) return; // only allow upward drag
    currentDragY.current = delta;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    if (currentDragY.current < -120) {
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
          'fixed inset-0 native-backdrop z-40 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed inset-x-0 top-0 z-50 rounded-b-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
          'bg-white dark:bg-[#0F0F1A]',
          'flex flex-col transition-transform duration-300 ease-out lg:hidden',
          'max-h-[92dvh]',
          isOpen ? 'translate-y-0' : '-translate-y-full',
        )}
        style={{ willChange: 'transform', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Close button row */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="w-8" />
          <div className="w-8" />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 active:bg-slate-200 dark:active:bg-white/20 active:scale-[0.96] transition-all duration-100"
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
        <div className="flex-1 overflow-y-auto px-5 overscroll-contain" style={{ paddingBottom: 'calc(2rem + var(--kb, 0px))' }}>
          {date && (
            isShowingForm ? (
              <>
                {/* Account picker — only when 2+ accounts */}
                {showAccountPicker && (
                  <div className="mb-3 pb-3 border-b border-slate-100 dark:border-white/[0.07]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30">{t('addToAccount')}</p>
                      {hasHousehold && hasOtherAccounts && (
                        <button
                          type="button"
                          onClick={() => setShowAllAddAccounts((v) => !v)}
                          className="text-[10px] font-bold uppercase tracking-wider text-brand-primary active:opacity-70 transition-opacity"
                        >
                          {showAllAddAccounts ? t('showMineOnly') : t('showAll')}
                        </button>
                      )}
                    </div>
                    {showAllAddAccounts && hasHousehold ? (
                      // Grouped view — scrollable, keeps the picker compact with many accounts
                      <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto overscroll-contain">
                        {groupAccountsByOwner(addPickerAccounts ?? [], myUserId, members).map((group) => (
                          <div key={group.userId || 'mine'} className="flex flex-col gap-1">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/25 px-1">
                              {group.isMine ? t('showMineOnly') : memberShortName(group.userId, members) ?? '—'}
                            </p>
                            <div className="flex gap-1 flex-wrap">
                              {group.items.map((acct) => (
                                <button
                                  key={acct.id}
                                  type="button"
                                  onClick={() => setFormAccountId(acct.id)}
                                  className={cn(
                                    'h-7 px-3 rounded-xl text-[11px] font-semibold transition-all duration-100 active:scale-[0.96] border',
                                    formAccountId === acct.id
                                      ? 'bg-brand-primary text-white border-brand-primary'
                                      : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/50 border-slate-200 dark:border-white/10',
                                  )}
                                >
                                  {acct.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Flat pills for "mine only" / solo
                      <div className="flex gap-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl p-0.5 flex-wrap">
                        {(addPickerAccounts ?? []).map((acct) => (
                          <button
                            key={acct.id}
                            type="button"
                            onClick={() => setFormAccountId(acct.id)}
                            className={cn(
                              'flex-1 h-7 px-3 rounded-[14px] text-[11px] font-semibold transition-all duration-100 active:scale-[0.96]',
                              formAccountId === acct.id
                                ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-white/40',
                            )}
                          >
                            {accountDisplayName(acct, myUserId, members)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <TransactionForm
                  defaultDate={date}
                  symbol={symbol}
                  isDuplicate={duplicateValues !== null}
                  initialValues={duplicateValues ?? undefined}
                  onCancel={() => { cancelDuplicate(); if (isAdding) onCancelAdd(); }}
                  isLoading={create.isPending}
                  isCreditAccount={accounts?.find(a => a.id === formAccountId)?.type === 'credit'}
                  creditLimit={accounts?.find(a => a.id === formAccountId)?.credit_limit}
                  onTransfer={(accounts?.length ?? 0) >= 2 && onTransfer ? () => { cancelDuplicate(); if (isAdding) onCancelAdd(); onTransfer(formAccountId); } : undefined}
                  onSubmit={(values: TransactionFormValues) => {
                    // Close immediately — optimistic update already shows the entry
                    if (duplicateValues !== null) {
                      cancelDuplicate();
                    } else {
                      onCancelAdd();
                    }
                    create.submit(values, {});
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
                onDuplicate={handleDuplicate}
                onTransfer={onTransfer}
                showTip={showTip}
                accounts={accounts}
                members={members}
                myUserId={myUserId}
              />
            )
          )}
        </div>

        {/* Drag handle — swipe up to dismiss */}
        <div
          className="flex justify-center pb-3 pt-2 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-[5px] rounded-full bg-black/15 dark:bg-white/20" />
        </div>
      </div>
    </>
  );
}
