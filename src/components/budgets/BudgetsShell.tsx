'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { TAGS } from '@/lib/constants';
import { useBalances } from '@/hooks/useBalances';
import { useSettings } from '@/hooks/useSettings';
import { useSettingsStore } from '@/store/settingsStore';
import { useCurrency } from '@/hooks/useCurrency';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton, MobileLogo } from '@/components/layout/NavSidebar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export function BudgetsShell() {
  const { dayTransactions, isLoading } = useBalances();
  const { allTags, tagBudgets } = useSettings();
  const { setTagBudget } = useSettingsStore();
  const { formatAmount, symbol } = useCurrency();
  const t = useTranslations('budgets');
  const tc = useTranslations('common');
  const tMonths = useTranslations('months');
  const tTags = useTranslations('tags');

  const currentMonth = format(new Date(), 'yyyy-MM');
  const _now = new Date();
  const currentMonthLabel = `${(tMonths.raw('long') as string[])[_now.getMonth()]} ${_now.getFullYear()}`;

  const [addingForTag, setAddingForTag] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState('');

  // Compute actual spending per tag for current month.
  // Excludes inter-account transfers — they're internal money movements,
  // not spending, so they shouldn't inflate 'untracked' or any budget.
  const monthlySpend = useMemo<Record<string, number>>(() => {
    const spend: Record<string, number> = {};
    for (const [date, txs] of dayTransactions) {
      if (date.slice(0, 7) !== currentMonth) continue;
      for (const tx of txs) {
        if (tx.category !== 'expense') continue;
        if (tx.transfer_id) continue; // skip transfer legs
        const key = tx.tag ?? '__untagged__';
        spend[key] = (spend[key] ?? 0) + tx.amount;
      }
    }
    return spend;
  }, [dayTransactions, currentMonth]);

  const totalMonthlyExpense = Object.values(monthlySpend).reduce((s, v) => s + v, 0);

  const budgetedTags = tagBudgets.map((b) => {
    const spent = monthlySpend[b.tagId] ?? 0;
    const tag = allTags[b.tagId];
    return {
      tagId: b.tagId,
      label: TAGS[b.tagId] ? tTags(b.tagId as never) : (tag?.label ?? b.tagId),
      color: tag?.color ?? '#6b7280',
      monthlyLimit: b.monthlyLimit,
      spent,
      pct: Math.min(100, Math.round((spent / b.monthlyLimit) * 100)),
      over: spent > b.monthlyLimit,
    };
  });

  const unbudgetedSpend = Object.entries(monthlySpend)
    .filter(([tagId]) => !tagBudgets.some((b) => b.tagId === tagId))
    .map(([tagId, amount]) => ({
      tagId,
      label: tagId === '__untagged__' ? tTags('untagged') : (TAGS[tagId] ? tTags(tagId as never) : (allTags[tagId]?.label ?? tagId)),
      color: tagId === '__untagged__' ? '#6b7280' : (allTags[tagId]?.color ?? '#6b7280'),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Expense-capable tags without a budget
  const availableForBudget = Object.entries(allTags).filter(
    ([id, t]) => !tagBudgets.some((b) => b.tagId === id) && (t.category === 'expense' || t.category === 'both'),
  );

  function handleSaveBudget(tagId: string) {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) { setBudgetError(t('amountError')); return; }
    setTagBudget(tagId, val);
    setAddingForTag(null);
    setBudgetInput('');
    setBudgetError('');
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-brand-bg dark:bg-[#0A1F1E]">
        {/* Ambient glow */}
        <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-amber-100/20 via-teal-50/10 to-transparent dark:from-amber-950/10 dark:via-teal-900/5 dark:to-transparent pointer-events-none -z-10" />

        {/* Header */}
        <header className="sticky top-0 z-20 glass-header">
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent" />
          <div className="px-4 sm:px-6 h-16 sm:h-14 flex items-center gap-3">
            <NavMenuButton />
            <MobileLogo />
            <div className="hidden lg:block">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
            </div>
            {availableForBudget.length > 0 && (
              <div className="ml-auto">
                <Button size="sm" onClick={() => { setAddingForTag('__pick__'); setBudgetInput(''); setBudgetError(''); }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {t('addBudget')}
                </Button>
              </div>
            )}
          </div>
        </header>

        <div className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-5">
          {/* Month overview */}
          <div className="hero-card rounded-3xl p-6">
            <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300/50 mb-3 font-display">{currentMonthLabel}</p>
            <div className="relative flex items-end gap-6">
              <div>
                <p className="text-3xl font-extrabold text-white tracking-tight font-display">
                  {formatAmount(totalMonthlyExpense, { compact: true })}
                </p>
                <p className="text-xs text-teal-300/40 mt-1">{t('spentThisMonth')}</p>
              </div>
              {tagBudgets.length > 0 && (() => {
                const totalBudget = tagBudgets.reduce((s, b) => s + b.monthlyLimit, 0);
                const remaining = totalBudget - totalMonthlyExpense;
                const over = remaining < 0;
                return (
                  <div className="text-right">
                    <p className={cn('text-xl font-bold font-display', over ? 'text-red-300' : 'text-emerald-300')}>
                      {formatAmount(Math.abs(remaining), { compact: true })}
                      <span className="text-xs font-medium text-teal-300/40 ml-1">{over ? t('over') : t('left')}</span>
                    </p>
                    <p className="text-xs text-teal-300/40">of {formatAmount(totalBudget, { compact: true })} budgeted</p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Tag picker */}
          {addingForTag === '__pick__' && (
            <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Which category?</p>
              <div className="flex flex-wrap gap-1.5">
                {availableForBudget.map(([id, tag]) => (
                  <button
                    key={id}
                    onClick={() => { setAddingForTag(id); setBudgetInput(''); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/5 active:scale-[0.96] transition-all duration-100"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {TAGS[id] ? tTags(id as never) : tag.label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAddingForTag(null)}>{tc('cancel')}</Button>
            </div>
          )}

          {addingForTag && addingForTag !== '__pick__' && (() => {
            const tag = allTags[addingForTag];
            return (
              <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag?.color ?? '#6b7280' }} />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{t('budgetFor', { tag: TAGS[addingForTag] ? tTags(addingForTag as never) : (tag?.label ?? addingForTag) })}</p>
                </div>
                <Input
                  id="budget-input"
                  label={t('monthlyLimit')}
                  type="number"
                  step="0.01"
                  min="0.01"
                  prefix={symbol}
                  placeholder={t('amountPlaceholder')}
                  defaultValue={tagBudgets.find((b) => b.tagId === addingForTag)?.monthlyLimit?.toString() ?? ''}
                  onChange={(e) => { setBudgetInput(e.target.value); setBudgetError(''); }}
                />
                {budgetError && <p className="text-xs text-red-500">{budgetError}</p>}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleSaveBudget(addingForTag)}>{tc('set')}</Button>
                  <Button variant="ghost" onClick={() => { setAddingForTag(null); setBudgetInput(''); setBudgetError(''); }}>{tc('cancel')}</Button>
                </div>
              </div>
            );
          })()}

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
            </div>
          ) : budgetedTags.length === 0 && unbudgetedSpend.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-white/60">{t('noBudgetYet')}</p>
              <p className="text-xs text-slate-400 dark:text-white/30">Set monthly limits for your spending categories</p>
            </div>
          ) : (
            <>
              {/* Budgeted categories */}
              {budgetedTags.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 px-1">{t('trackedCategories')}</p>
                  {budgetedTags.map((b) => (
                    <div key={b.tagId} className="glass-card rounded-3xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                          <span className="text-sm font-semibold text-slate-800 dark:text-white">{b.label}</span>
                          {b.over && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-500">OVER</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-white/40">
                            {formatAmount(b.spent, { compact: true })} / {formatAmount(b.monthlyLimit, { compact: true })}
                          </span>
                          <button
                            onClick={() => { setAddingForTag(b.tagId); setBudgetInput(String(b.monthlyLimit)); setBudgetError(''); }}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-slate-500 dark:hover:text-white/60 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setTagBudget(b.tagId, null)}
                            className="p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${b.pct}%`,
                            background: b.over ? 'linear-gradient(90deg, #ef4444, #f87171)' : b.pct > 80 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : `linear-gradient(90deg, ${b.color}, ${b.color}dd)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-white/30">
                          {formatAmount(Math.max(0, b.monthlyLimit - b.spent), { compact: true })} remaining
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-white/30">{b.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Untracked spending */}
              {unbudgetedSpend.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 px-1">Untracked spending this month</p>
                  {unbudgetedSpend.map((item) => (
                    <div
                      key={item.tagId}
                      className="glass-card rounded-3xl p-4 flex items-center justify-between native-row"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-slate-700 dark:text-white/70">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-600 dark:text-white/60">{formatAmount(item.amount, { compact: true })}</span>
                        {item.tagId !== '__untagged__' && availableForBudget.some(([id]) => id === item.tagId) && (
                          <button
                            onClick={() => { setAddingForTag(item.tagId); setBudgetInput(''); setBudgetError(''); }}
                            className="text-[10px] font-bold text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 underline transition-colors"
                          >
                            {tc('set')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
