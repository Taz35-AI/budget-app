'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TAGS } from '@/lib/constants';
import { useBalances } from '@/hooks/useBalances';
import { useSettings } from '@/hooks/useSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { useSettingsStore } from '@/store/settingsStore';
import { useTransactions, useUpdateTransaction } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import type { DayTransaction, Frequency } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton, MobileLogo } from '@/components/layout/NavSidebar';
import { TagDropdown } from '@/components/dashboard/TransactionForm';
import { cn } from '@/lib/utils';


// Max bar height in px — leaves room for net indicator above + label below
const BAR_MAX_H = 128;

const GOAL_PRESETS = [
  { name: 'New Vehicle', icon: '\u{1F697}', color: '#3b82f6' },
  { name: 'New Home', icon: '\u{1F3E0}', color: '#f97316' },
  { name: 'Holiday Trip', icon: '\u2708\uFE0F', color: '#22c55e' },
  { name: 'Education', icon: '\u{1F393}', color: '#6366f1' },
  { name: 'Emergency Fund', icon: '\u{1F6E1}\uFE0F', color: '#a855f7' },
  { name: 'Health Care', icon: '\u2764\uFE0F', color: '#ef4444' },
];

// ── Donut chart helpers ────────────────────────────────────────────────────────

const CX = 90; const CY = 90; const R_OUT = 78; const R_IN = 52;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutPath(startDeg: number, endDeg: number, outerR = R_OUT, innerR = R_IN) {
  const o1 = polar(CX, CY, outerR, startDeg);
  const o2 = polar(CX, CY, outerR, endDeg);
  const i1 = polar(CX, CY, innerR, endDeg);
  const i2 = polar(CX, CY, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${o1.x},${o1.y} A${outerR},${outerR},0,${large},1,${o2.x},${o2.y} L${i1.x},${i1.y} A${innerR},${innerR},0,${large},0,${i2.x},${i2.y}Z`;
}

interface MonthData {
  income:           number;
  expense:          number;
  recurringExpense: number;
  oneOffExpense:    number;
  txCount:          number;
  tags:             Record<string, number>;
  endBalance:       number | null;
}

export function ReportsShell() {
  const t = useTranslations('reports');
  const tc = useTranslations('common');
  const tMonths = useTranslations('months');
  const tTags = useTranslations('tags');
  const MONTH_LABELS = tMonths.raw('short') as string[];
  const MONTH_FULL = tMonths.raw('long') as string[];

  const { dayTransactions, balances, isLoading } = useBalances();
  const { data: txData } = useTransactions();
  const { allTags, goals, addGoal, updateGoal, deleteGoal } = useSettings();
  const { formatAmount, symbol: currencySymbol } = useCurrency();
  const tFreq = useTranslations('frequency');
  const tForecast = useTranslations('forecast');
  const tHeatmap = useTranslations('heatmap');
  const { monthlyInsights, setMonthlyInsight, addCustomTag } = useSettingsStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear,     setSelectedYear]     = useState(currentYear);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth());
  const [hoveredTag,       setHoveredTag]       = useState<string | null>(null);
  const [activeTab,        setActiveTab]        = useState<'overview' | 'month' | 'transactions' | 'annual' | 'goals' | 'subscriptions'>('overview');

  // ── Tag drill-down state ────────────────────────────────────────────────────
  const [selectedTagKey,  setSelectedTagKey]  = useState<string | null>(null);
  const [retaggingKey,    setRetaggingKey]    = useState<string | null>(null); // `${transaction_id}-${date}`
  const [annualDrillTag,  setAnnualDrillTag]  = useState<string | null>(null);
  const updateTx = useUpdateTransaction();

  // ── Insights state ──────────────────────────────────────────────────────────
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError,   setInsightsError]   = useState(false);

  // ── Goals management state ──────────────────────────────────────────────────
  const [showAddGoal,    setShowAddGoal]    = useState(false);
  const [goalForm,       setGoalForm]       = useState({ name: '', target: '', currentSaved: '', deadline: '', linkedTagId: '', icon: '' });
  const [newTagName,     setNewTagName]     = useState('');
  const [editGoalId,     setEditGoalId]     = useState<string | null>(null);
  const [editSaved,      setEditSaved]      = useState('');
  const [linkingGoalId,  setLinkingGoalId]  = useState<string | null>(null);

  // ── Monthly aggregates ──────────────────────────────────────────────────────
  const yearlyData = useMemo<MonthData[]>(() => {
    const months: MonthData[] = Array.from({ length: 12 }, () => ({
      income: 0, expense: 0, recurringExpense: 0, oneOffExpense: 0,
      txCount: 0, tags: {}, endBalance: null,
    }));

    for (const [date, txs] of dayTransactions) {
      if (Number(date.slice(0, 4)) !== selectedYear) continue;
      const mi = Number(date.slice(5, 7)) - 1;
      for (const tx of txs) {
        months[mi].txCount++;
        if (tx.category === 'income') {
          months[mi].income += tx.amount;
        } else {
          months[mi].expense += tx.amount;
          if (tx.type === 'recurring') months[mi].recurringExpense += tx.amount;
          else months[mi].oneOffExpense += tx.amount;
          const isUuid = tx.tag != null && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tx.tag);
          const k = (tx.tag == null || isUuid) ? '__untagged__' : tx.tag;
          months[mi].tags[k] = (months[mi].tags[k] ?? 0) + tx.amount;
        }
      }
    }

    // End-of-month closing balance
    for (let i = 0; i < 12; i++) {
      const lastDay = new Date(selectedYear, i + 1, 0).getDate();
      const dateStr = `${selectedYear}-${String(i + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const bal = balances.get(dateStr);
      if (bal !== undefined) months[i].endBalance = bal;
    }

    return months;
  }, [dayTransactions, balances, selectedYear]);

  const maxMonthlyValue = useMemo(
    () => Math.max(...yearlyData.map((m) => Math.max(m.income, m.expense)), 1),
    [yearlyData],
  );

  const selected  = yearlyData[selectedMonthIdx];
  const prevMonth = selectedMonthIdx > 0 ? yearlyData[selectedMonthIdx - 1] : null;
  const netMonth  = selected.income - selected.expense;
  const savingsRate = selected.income > 0
    ? Math.round((netMonth / selected.income) * 100) : null;

  // ── Subscriptions data ────────────────────────────────────────────────────
  const MONTHLY_FACTOR: Record<Frequency, number> = {
    daily: 30.44, weekly: 4.35, biweekly: 2.17,
    monthly: 1, quarterly: 1 / 3, semiannual: 1 / 6, annual: 1 / 12,
  };
  const FREQ_LABEL_KEY: Record<Frequency, string> = {
    daily: 'daily', weekly: 'weekly', biweekly: 'biweekly',
    monthly: 'monthly', quarterly: 'quarterly', semiannual: 'quarterly', annual: 'yearly',
  };
  const subscriptions = useMemo(() => {
    if (!txData?.transactions) return [];
    const today = new Date();
    return txData.transactions
      .filter((tx) => tx.type === 'recurring' && tx.frequency && (!tx.end_date || new Date(tx.end_date) >= today))
      .map((tx) => {
        const freq = tx.frequency as Frequency;
        const monthlyCost = tx.amount * (MONTHLY_FACTOR[freq] ?? 1);
        const tagInfo = tx.tag ? allTags[tx.tag] : null;
        return { ...tx, freq, monthlyCost, tagInfo };
      })
      .sort((a, b) => b.monthlyCost - a.monthlyCost);
  }, [txData?.transactions, allTags]);

  const subsExpenses = subscriptions.filter((s) => s.category === 'expense');
  const subsIncome   = subscriptions.filter((s) => s.category === 'income');
  const totalMonthlyExpense = subsExpenses.reduce((sum, s) => sum + s.monthlyCost, 0);
  const totalMonthlyIncome  = subsIncome.reduce((sum, s) => sum + s.monthlyCost, 0);

  // ── Year totals ─────────────────────────────────────────────────────────────
  const yearTotals = useMemo(() => {
    const income  = yearlyData.reduce((s, m) => s + m.income, 0);
    const expense = yearlyData.reduce((s, m) => s + m.expense, 0);
    const net     = income - expense;
    const rate    = income > 0 ? Math.round((net / income) * 100) : null;
    return { income, expense, net, rate };
  }, [yearlyData]);

  // ── Tag breakdown for selected month ───────────────────────────────────────
  const tagBreakdown = useMemo(() =>
    Object.entries(selected.tags)
      .sort((a, b) => b[1] - a[1])
      .map(([k, amt]) => ({
        key: k, amount: amt,
        label: k === '__untagged__' ? tTags('untagged') : (TAGS[k] ? tTags(k as never) : (allTags[k]?.label ?? k)),
        color: k === '__untagged__' ? '#6b7280' : (allTags[k]?.color ?? '#6b7280'),
      })),
    [selected.tags, allTags, tTags],
  );
  const maxTagAmt = tagBreakdown[0]?.amount ?? 1;

  // ── Annual tag totals ───────────────────────────────────────────────────────
  const annualTags = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const m of yearlyData)
      for (const [k, a] of Object.entries(m.tags))
        totals[k] = (totals[k] ?? 0) + a;
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([k, amt]) => ({
        key: k, amount: amt,
        label: k === '__untagged__' ? tTags('untagged') : (TAGS[k] ? tTags(k as never) : (allTags[k]?.label ?? k)),
        color: k === '__untagged__' ? '#6b7280' : (allTags[k]?.color ?? '#6b7280'),
      }));
  }, [yearlyData, allTags, tTags]);
  const maxAnnualTagAmt = annualTags[0]?.amount ?? 1;

  // Donut segments for annual spending — start at top (-90°), gap 2° between slices.
  // GAP is always 2 even for a single segment: a 360° arc has identical start/end
  // points which SVG renders as nothing. A 358° arc avoids that degenerate case.
  const donutSegments = useMemo(() => {
    const total = annualTags.reduce((s, t) => s + t.amount, 0);
    if (total === 0 || annualTags.length === 0) return [];
    const GAP   = 2;
    const sweep = 360 - GAP * annualTags.length;
    let angle   = -90;
    return annualTags.map((tag) => {
      const frac   = tag.amount / total;
      const arcDeg = Math.max(frac * sweep, 0.5); // min 0.5° so tiny slices stay visible
      const seg    = { ...tag, startDeg: angle + GAP / 2, endDeg: angle + GAP / 2 + arcDeg, pct: Math.round(frac * 100) };
      angle += arcDeg + GAP;
      return seg;
    });
  }, [annualTags]);

  // ── Top transactions for selected month ────────────────────────────────────
  const topTx = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}`;
    const all: Array<{ name: string; amount: number; category: string; tag: string | null; date: string }> = [];
    for (const [date, txs] of dayTransactions) {
      if (!date.startsWith(prefix)) continue;
      for (const tx of txs) all.push({ name: tx.name, amount: tx.amount, category: tx.category, tag: tx.tag ?? null, date });
    }
    return all.sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [dayTransactions, selectedYear, selectedMonthIdx]);

  // ── Tag drill-down: all transactions for the selected tag in the selected month ──
  const tagTransactionsList = useMemo<Array<{ tx: DayTransaction; date: string }>>(() => {
    if (!selectedTagKey) return [];
    const prefix = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}`;
    const results: Array<{ tx: DayTransaction; date: string }> = [];
    for (const [date, txs] of dayTransactions) {
      if (!date.startsWith(prefix)) continue;
      for (const tx of txs) {
        if (tx.category !== 'expense') continue;
        const isUuid = tx.tag != null && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tx.tag);
        const k = (tx.tag == null || isUuid) ? '__untagged__' : tx.tag;
        if (k === selectedTagKey) results.push({ tx, date });
      }
    }
    return results.sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedTagKey, dayTransactions, selectedYear, selectedMonthIdx]);

  // Tags available for re-tagging (expense + both, excluding hidden)
  const retagOptions = useMemo(() =>
    Object.entries(allTags)
      .filter(([, t]) => t.category === 'expense' || t.category === 'both')
      .map(([id, t]) => ({ id, label: TAGS[id] ? tTags(id as never) : t.label, color: t.color }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [allTags, tTags],
  );

  // ── Balance forecast data (next 180 days) ───────────────────────────────────
  const forecastData = useMemo(() => {
    const today = new Date();
    const points: { date: string; balance: number; label: string }[] = [];
    let firstNegativeDate: string | null = null;
    for (let i = 0; i < 180; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const bal = balances.get(dateStr);
      if (bal !== undefined) {
        points.push({ date: dateStr, balance: bal, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
        if (bal < 0 && !firstNegativeDate) firstNegativeDate = dateStr;
      }
    }
    return { points, firstNegativeDate };
  }, [balances]);

  // ── Spending heatmap data (selected month) ─────────────────────────────────
  const heatmapData = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonthIdx;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const days: { date: string; amount: number; day: number }[] = [];
    let maxSpend = 0;
    let maxDay = 0;
    let totalSpend = 0;
    let activeDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const txs = dayTransactions.get(dateStr) ?? [];
      const spent = txs.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);
      days.push({ date: dateStr, amount: spent, day: d });
      totalSpend += spent;
      if (spent > 0) activeDays += 1;
      if (spent > maxSpend) { maxSpend = spent; maxDay = d; }
    }
    const avgDaily = activeDays > 0 ? totalSpend / activeDays : 0;
    return { days, maxSpend, maxDay, firstDow, daysInMonth, totalSpend, avgDaily, activeDays };
  }, [selectedYear, selectedMonthIdx, dayTransactions]);

  // ── Insights helpers ────────────────────────────────────────────────────────
  const today       = new Date();
  const isPastMonth = selectedYear < today.getFullYear() ||
    (selectedYear === today.getFullYear() && selectedMonthIdx < today.getMonth());
  const monthKey    = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}`;
  const savedInsight = monthlyInsights[monthKey];

  async function generateInsights() {
    setInsightsLoading(true);
    setInsightsError(false);
    try {
      const res = await fetch('/api/reports/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthLabel: `${MONTH_FULL[selectedMonthIdx]} ${selectedYear}`,
          income: selected.income,
          expense: selected.expense,
          net: netMonth,
          savingsRate,
          topCategories: tagBreakdown.slice(0, 5).map((t) => ({ label: t.label, amount: t.amount })),
          prevMonthNet: prevMonth ? prevMonth.income - prevMonth.expense : null,
          txCount: selected.txCount,
          currency: currencySymbol,
        }),
      });
      const data = await res.json();
      if (data.advice) {
        setMonthlyInsight(monthKey, data.advice);
      } else {
        setInsightsError(true);
      }
    } catch {
      setInsightsError(true);
    } finally {
      setInsightsLoading(false);
    }
  }


  const hasSomeData = yearlyData.some((m) => m.income > 0 || m.expense > 0);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F4FDFB] dark:bg-[#011817]">

        {/* Ambient glow */}
        <div className="fixed top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#D9DDF0]/40 to-transparent dark:from-[#042F2E]/15 dark:to-transparent pointer-events-none -z-10" />

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20
          bg-white/95 dark:bg-[#011817]/95 backdrop-blur-2xl
          border-b border-[#D9DDF0]/70 dark:border-[#0D9488]/[0.08]
          shadow-[0_1px_0_rgba(25,27,47,0.06),0_4px_16px_rgba(25,27,47,0.04)]
          dark:shadow-[0_1px_0_rgba(59,122,120,0.06)]">
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0D9488]/40 to-transparent" />
          <div className="px-4 sm:px-6 h-16 sm:h-14 flex items-center gap-3">
            <NavMenuButton />
            <MobileLogo />
            <h1 className="text-xl font-extrabold text-[#042F2E] dark:text-white tracking-tight hidden lg:block">{t('title')}</h1>
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-brand-primary/20 text-brand-primary/60 hover:bg-brand-primary/8 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-bold text-brand-text dark:text-white w-11 text-center">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                disabled={selectedYear >= currentYear + 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-brand-primary/20 text-brand-primary/60 hover:bg-brand-primary/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* ── Tab strip + month selector (mobile + desktop) ───────────── */}
        <div className="sticky top-16 sm:top-14 z-10 bg-[#F4FDFB]/95 dark:bg-[#011817]/95 backdrop-blur-xl border-b border-brand-primary/[0.08] dark:border-white/[0.05]">
          {/* Tabs */}
          <div className="flex gap-0.5 overflow-x-auto scrollbar-none bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl mx-3 my-2 p-0.5 sm:mx-5 sm:my-3">
            {([
              { id: 'overview',     label: t('tabOverview')      },
              { id: 'month',        label: t('tabMonth')         },
              { id: 'transactions', label: t('tabTransactions')  },
              { id: 'annual',       label: t('tabAnnual')        },
              { id: 'goals',        label: t('tabGoals')         },
              { id: 'subscriptions', label: t('tabSubscriptions') },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex-shrink-0 h-7 px-3 text-[11px] select-none active:scale-[0.96] duration-100 transition-all',
                  'sm:h-9 sm:px-4 sm:text-xs',
                  activeTab === id
                    ? 'bg-white dark:bg-white/15 text-brand-text dark:text-white font-bold shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-xl'
                    : 'bg-transparent font-semibold text-brand-text/55 dark:text-white/45',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Month selector — shown on non-overview tabs */}
          <div className={cn(
            'flex items-center justify-between px-4 pb-2 pt-1',
            (activeTab === 'overview' || activeTab === 'subscriptions') && 'invisible pointer-events-none',
          )}>
            <button
              onClick={() => setSelectedMonthIdx((m) => (m > 0 ? m - 1 : 11))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-brand-primary/20 text-brand-primary/60 hover:bg-brand-primary/8 transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-brand-text dark:text-white">
              {MONTH_FULL[selectedMonthIdx]} {selectedYear}
            </span>
            <button
              onClick={() => setSelectedMonthIdx((m) => (m < 11 ? m + 1 : 0))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-brand-primary/20 text-brand-primary/60 hover:bg-brand-primary/8 transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Content area — fixed-height scrollable on mobile, normal on desktop ── */}
        <div className="h-[calc(100dvh-4rem-6.5rem-60px)] overflow-y-auto sm:h-auto sm:overflow-visible px-3 sm:px-5 py-3 sm:py-4 pb-4 flex flex-col gap-4">

          {/* ── Headline bar ──────────────────────────────────────────── */}
          <div className={cn("bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]", activeTab !== 'overview' && activeTab !== 'annual' && 'hidden')}>
            {/* Desktop */}
            <div className="hidden sm:flex divide-x divide-brand-primary/[0.08] dark:divide-brand-primary/[0.06]">
              <div className="flex-[1.6] px-5 py-3.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">
                  {yearTotals.net >= 0 ? t('savedIn', { year: selectedYear }) : t('deficitIn', { year: selectedYear })}
                </span>
                <span className={cn('text-[1.75rem] font-black tabular-nums leading-none tracking-tight truncate block',
                  yearTotals.net >= 0 ? 'text-brand-positive' : 'text-brand-danger')}>
                  {formatAmount(Math.abs(yearTotals.net))}
                </span>
              </div>
              <div className="flex-1 px-4 py-3.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">{t('yearIncome', { year: selectedYear })}</span>
                <span className="text-xl font-black tabular-nums leading-none tracking-tight text-brand-positive truncate block">{formatAmount(yearTotals.income)}</span>
              </div>
              <div className="flex-1 px-4 py-3.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">{t('yearExpenses', { year: selectedYear })}</span>
                <span className="text-xl font-black tabular-nums leading-none tracking-tight text-brand-danger truncate block">{formatAmount(yearTotals.expense)}</span>
              </div>
              <div className="flex-1 px-4 py-3.5 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">{t('savingsRate')}</span>
                <span className={cn('text-xl font-black tabular-nums leading-none tracking-tight truncate block',
                  (yearTotals.rate ?? 0) >= 0 ? 'text-brand-positive' : 'text-brand-danger')}>
                  {yearTotals.rate !== null ? `${yearTotals.rate}%` : '—'}
                </span>
              </div>
            </div>
            {/* Mobile */}
            <div className="sm:hidden">
              <div className="px-4 pt-4 pb-3 border-b border-brand-primary/[0.08]">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1.5">
                  {yearTotals.net >= 0 ? t('savedIn', { year: selectedYear }) : t('deficit', { year: selectedYear })}
                </span>
                <span className={cn('text-[1.75rem] font-black tabular-nums leading-none tracking-tight block',
                  yearTotals.net >= 0 ? 'text-brand-positive' : 'text-brand-danger')}>
                  {formatAmount(Math.abs(yearTotals.net))}
                </span>
              </div>
              <div className="flex divide-x divide-brand-primary/[0.08]">
                <div className="flex-1 px-3 py-2.5 min-w-0">
                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-brand-text/25 dark:text-white/16 block mb-1">{t('incomeLabel')}</span>
                  <span className="text-base font-black tabular-nums text-brand-positive truncate block">{formatAmount(yearTotals.income)}</span>
                </div>
                <div className="flex-1 px-3 py-2.5 min-w-0">
                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-brand-text/25 dark:text-white/16 block mb-1">{t('expensesLabel')}</span>
                  <span className="text-base font-black tabular-nums text-brand-danger truncate block">{formatAmount(yearTotals.expense)}</span>
                </div>
                <div className="flex-1 px-3 py-2.5 min-w-0">
                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-brand-text/25 dark:text-white/16 block mb-1">Rate</span>
                  <span className={cn('text-base font-black tabular-nums truncate block',
                    (yearTotals.rate ?? 0) >= 0 ? 'text-brand-positive' : 'text-brand-danger')}>
                    {yearTotals.rate !== null ? `${yearTotals.rate}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Monthly bar chart ─────────────────────────────────────── */}
          <div className={cn(activeTab !== 'overview' && 'hidden')}>
          <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20">{t('monthlyOverview')}</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-brand-positive/70" />
                  <span className="text-[10px] font-semibold text-brand-text/35 dark:text-white/25">{t('incomeLabel')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-brand-danger/70" />
                  <span className="text-[10px] font-semibold text-brand-text/35 dark:text-white/25">{t('expensesLabel')}</span>
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-4 h-4 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
              </div>
            ) : (
              /* fixed height container: 8px net dot + BAR_MAX_H bars + 20px label = ~156px */
              <div className="flex gap-[3px] sm:gap-1" style={{ height: `${BAR_MAX_H + 28}px` }}>
                {yearlyData.map((month, idx) => {
                  const net = month.income - month.expense;
                  const incH = month.income > 0 ? Math.max(3, Math.round((month.income  / maxMonthlyValue) * BAR_MAX_H)) : 0;
                  const expH = month.expense > 0 ? Math.max(3, Math.round((month.expense / maxMonthlyValue) * BAR_MAX_H)) : 0;
                  const isSelected = idx === selectedMonthIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedMonthIdx(idx)}
                      className={cn(
                        'flex-1 flex flex-col items-center cursor-pointer rounded-xl px-0.5 pt-1 pb-1.5 transition-all',
                        isSelected
                          ? 'bg-brand-primary/8 dark:bg-brand-primary/12 ring-1 ring-brand-primary/20'
                          : 'hover:bg-brand-primary/5 dark:hover:bg-brand-primary/8',
                      )}
                    >
                      {/* Net sign */}
                      <span className={cn('text-[7px] font-black leading-none mb-0.5 h-2.5',
                        net > 0 ? 'text-brand-positive/80' : net < 0 ? 'text-brand-danger/80' : 'text-transparent')}>
                        {net > 0 ? '▲' : net < 0 ? '▼' : '▲'}
                      </span>
                      {/* Bars grow from bottom */}
                      <div className="flex items-end gap-[2px] w-full justify-center flex-1">
                        <div className="w-[38%] rounded-t-md bg-brand-positive/65 dark:bg-brand-positive/55 transition-all duration-300" style={{ height: `${incH}px` }} />
                        <div className="w-[38%] rounded-t-md bg-brand-danger/65 dark:bg-brand-danger/55 transition-all duration-300" style={{ height: `${expH}px` }} />
                      </div>
                      <span className={cn('text-[8px] sm:text-[9px] font-bold mt-1 leading-none',
                        isSelected ? 'text-brand-primary' : 'text-brand-text/28 dark:text-white/22')}>
                        {MONTH_LABELS[idx]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          </div>

          {/* ── Balance Forecast Graph ─────────────────────────────── */}
          {forecastData.points.length > 10 && (
          <div className={cn(activeTab !== 'overview' && 'hidden')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20">{tForecast('title')}</p>
                <p className="text-[11px] text-brand-text/40 dark:text-white/30 mt-0.5">{tForecast('subtitle')}</p>
              </div>
              {forecastData.firstNegativeDate && (
                <div className="mx-4 sm:mx-5 mb-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {tForecast('warningNegative', { date: new Date(forecastData.firstNegativeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) })}
                  </p>
                </div>
              )}
              <div className="px-2 sm:px-3 pb-4">
                <svg viewBox="0 0 720 160" className="w-full h-[140px] sm:h-[180px]" preserveAspectRatio="none">
                  {(() => {
                    const pts = forecastData.points;
                    const minBal = Math.min(...pts.map(p => p.balance), 0);
                    const maxBal = Math.max(...pts.map(p => p.balance), 100);
                    const range = maxBal - minBal || 1;
                    const padTop = 10, padBot = 10, h = 160 - padTop - padBot;
                    const w = 720;
                    const toX = (i: number) => (i / (pts.length - 1)) * w;
                    const toY = (bal: number) => padTop + h - ((bal - minBal) / range) * h;
                    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.balance).toFixed(1)}`).join(' ');
                    const fillPath = `${linePath} L${toX(pts.length - 1)},${toY(minBal)} L${toX(0)},${toY(minBal)} Z`;
                    const zeroY = toY(0);
                    return (
                      <>
                        <defs>
                          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0D9488" />
                            <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Fill under line */}
                        <path d={fillPath} fill="url(#forecastGrad)" opacity="0.15" />
                        {/* Zero line */}
                        {minBal < 0 && <line x1="0" y1={zeroY} x2={w} y2={zeroY} stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="text-brand-text/20 dark:text-white/15" />}
                        {/* Red zone below zero */}
                        {minBal < 0 && (
                          <rect x="0" y={zeroY} width={w} height={padTop + h - zeroY + padBot} fill="#DC2626" opacity="0.06" />
                        )}
                        {/* Line */}
                        <path d={linePath} fill="none" stroke="#0D9488" strokeWidth="2" strokeLinejoin="round" />
                        {/* Today marker */}
                        <circle cx={toX(0)} cy={toY(pts[0].balance)} r="3" fill="#0D9488" />
                        {/* Month labels */}
                        {[0, 30, 60, 90, 120, 150].map((dayIdx) => {
                          if (dayIdx >= pts.length) return null;
                          return (
                            <text key={dayIdx} x={toX(dayIdx)} y={156} textAnchor="middle" style={{ fontSize: 8, fontWeight: 600, fill: 'currentColor', opacity: 0.3, fontFamily: 'inherit' }}>
                              {pts[dayIdx].label}
                            </text>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
          )}

          {/* ── Selected month deep dive + tag breakdown ──────────────── */}
          <div className={cn(activeTab !== 'month' && 'hidden')}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Month detail */}
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              {/* Mini headline */}
              <div className="flex divide-x divide-brand-primary/[0.08] dark:divide-brand-primary/[0.06] border-b border-brand-primary/[0.08] dark:border-brand-primary/[0.06]">
                <div className="flex-[1.4] px-4 py-3 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1">
                    {t('monthNet', { month: MONTH_FULL[selectedMonthIdx] })}
                  </span>
                  <span className={cn('text-2xl font-black tabular-nums leading-none',
                    netMonth >= 0 ? 'text-brand-positive' : 'text-brand-danger')}>
                    {(netMonth >= 0 ? '+' : '')}{formatAmount(netMonth)}
                  </span>
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 block mb-1">{t('savingsRate')}</span>
                  <span className={cn('text-2xl font-black tabular-nums leading-none',
                    savingsRate !== null && savingsRate >= 20 ? 'text-brand-positive' :
                    savingsRate !== null && savingsRate < 0  ? 'text-brand-danger' :
                    'text-brand-text dark:text-white')}>
                    {savingsRate !== null ? `${savingsRate}%` : '—'}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3.5 flex flex-col gap-2.5">
                {/* Income / Expense rows */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-text/45 dark:text-white/35">{t('totalIncome')}</span>
                  <span className="text-sm font-bold text-brand-positive tabular-nums">{formatAmount(selected.income)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-text/45 dark:text-white/35">{t('totalExpenses')}</span>
                  <span className="text-sm font-bold text-brand-danger tabular-nums">{formatAmount(selected.expense)}</span>
                </div>

                {/* Recurring vs discretionary */}
                {selected.expense > 0 && (
                  <div className="pt-2.5 border-t border-brand-primary/[0.07]">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text/22 dark:text-white/14 mb-2">{t('expenseBreakdown')}</p>
                    {[
                      { label: t('recurringExpense'), amount: selected.recurringExpense, color: 'bg-brand-danger/55' },
                      { label: t('discretionary'), amount: selected.oneOffExpense, color: 'bg-brand-secondary/50' },
                    ].map(({ label, amount, color }) => {
                      const pct = selected.expense > 0 ? Math.round((amount / selected.expense) * 100) : 0;
                      return (
                        <div key={label} className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', color)} />
                            <span className="text-xs text-brand-text/45 dark:text-white/35">{label}</span>
                            <span className="text-[10px] text-brand-text/25 dark:text-white/18">{pct}%</span>
                          </div>
                          <span className="text-xs font-semibold text-brand-text/65 dark:text-white/55 tabular-nums">{formatAmount(amount)}</span>
                        </div>
                      );
                    })}
                    <div className="mt-1.5 h-2 rounded-full overflow-hidden bg-brand-primary/[0.07] flex">
                      <div className="h-full bg-brand-danger/55 rounded-l-full" style={{ width: `${selected.expense > 0 ? Math.round((selected.recurringExpense / selected.expense) * 100) : 0}%` }} />
                      <div className="h-full bg-brand-secondary/45" style={{ width: `${selected.expense > 0 ? Math.round((selected.oneOffExpense / selected.expense) * 100) : 0}%` }} />
                    </div>
                  </div>
                )}

                {/* vs previous month */}
                {prevMonth && (prevMonth.income > 0 || prevMonth.expense > 0) && (
                  <div className="pt-2.5 border-t border-brand-primary/[0.07]">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text/22 dark:text-white/14 mb-2">
                      {t('vsPrevMonth', { month: MONTH_LABELS[selectedMonthIdx - 1] })}
                    </p>
                    {([
                      { label: t('incomeLabel'),   curr: selected.income,  prev: prevMonth.income,  higherIsBetter: true  },
                      { label: t('expensesLabel'), curr: selected.expense, prev: prevMonth.expense, higherIsBetter: false },
                    ] as { label: string; curr: number; prev: number; higherIsBetter: boolean }[]).map(({ label, curr, prev, higherIsBetter }) => {
                      const diff = curr - prev;
                      const pct  = prev > 0 ? Math.round((diff / prev) * 100) : null;
                      const good = pct !== null && (higherIsBetter ? diff > 0 : diff < 0);
                      const bad  = pct !== null && (higherIsBetter ? diff < 0 : diff > 0);
                      return (
                        <div key={label} className="flex items-center justify-between mb-1">
                          <span className="text-xs text-brand-text/38 dark:text-white/28">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className={cn('text-[10px] font-bold',
                              good ? 'text-brand-positive' : bad ? 'text-brand-danger' : 'text-brand-text/25 dark:text-white/18')}>
                              {pct !== null ? `${pct > 0 ? '+' : ''}${pct}%` : '—'}
                            </span>
                            <span className="text-xs font-semibold text-brand-text/50 dark:text-white/40 tabular-nums">{formatAmount(curr)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer: tx count + closing balance */}
                <div className="pt-2 border-t border-brand-primary/[0.07] flex items-center justify-between">
                  <span className="text-[10px] text-brand-text/30 dark:text-white/22">
                    {t('txCountLabel', { count: selected.txCount })}
                  </span>
                  {selected.endBalance !== null && (
                    <span className={cn('text-[10px] font-bold tabular-nums',
                      selected.endBalance >= 0 ? 'text-brand-positive/80' : 'text-brand-danger/80')}>
                      {t('closingBalance', { amount: formatAmount(selected.endBalance) })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tag breakdown — selected month */}
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20 mb-3.5">
                {t('monthSpendingByCategory', { month: MONTH_LABELS[selectedMonthIdx] })}
              </p>
              {tagBreakdown.length === 0 ? (
                <p className="text-sm text-brand-text/28 dark:text-white/22 text-center py-10">{t('noExpensesThisMonth')}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {tagBreakdown.map(({ key, amount, label, color }) => {
                    const pct     = Math.round((amount / maxTagAmt) * 100);
                    const ofTotal = selected.expense > 0 ? Math.round((amount / selected.expense) * 100) : 0;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setSelectedTagKey(key); setRetaggingKey(null); }}
                        className="group text-left w-full rounded-lg p-1.5 -mx-1.5 hover:bg-brand-primary/[0.05] dark:hover:bg-brand-primary/[0.08] transition-colors"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs font-semibold text-brand-text/75 dark:text-white/70">{label}</span>
                            <span className="text-[10px] text-brand-text/28 dark:text-white/22">{ofTotal}%</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-brand-text/65 dark:text-white/55 tabular-nums">{formatAmount(amount)}</span>
                            <svg className="w-3 h-3 text-brand-text/20 dark:text-white/15 group-hover:text-brand-primary/50 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="h-2 bg-brand-primary/[0.07] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </div>

          {/* ── Spending Heatmap ────────────────────────────────────── */}
          <div className={cn(activeTab !== 'month' && 'hidden')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20">{tHeatmap('title')}</p>
                <p className="text-[11px] text-brand-text/40 dark:text-white/30 mt-0.5">{tHeatmap('subtitle')}</p>
              </div>
              <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                  {/* Grid — gets full content width since each report is now its own tab */}
                  <div className="w-full md:flex-1 md:min-w-0">
                    <div className="grid grid-cols-7 gap-1.5 max-w-[420px] mx-auto md:max-w-none md:mx-0">
                      {/* Day of week headers */}
                      {['M','T','W','T','F','S','S'].map((d, i) => (
                        <div key={i} className="text-center text-[9px] font-bold text-brand-text/25 dark:text-white/20 pb-1">{d}</div>
                      ))}
                      {/* Empty cells for offset (Monday-based) */}
                      {Array.from({ length: (heatmapData.firstDow + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {/* Day cells — single-hue intensity ramp for premium feel */}
                      {heatmapData.days.map(({ date, amount, day }) => {
                        const intensity = heatmapData.maxSpend > 0 ? amount / heatmapData.maxSpend : 0;
                        const isZero = amount === 0;
                        // Single red-amber ramp driven by opacity (clean, GitHub-style)
                        const opacity = isZero ? 0 : 0.15 + intensity * 0.85;
                        const isDark = intensity > 0.45;
                        return (
                          <div
                            key={date}
                            className={cn(
                              'aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative',
                              isZero
                                ? 'bg-brand-primary/[0.04] dark:bg-white/[0.04] border border-dashed border-brand-primary/10 dark:border-white/[0.08]'
                                : 'shadow-[0_1px_2px_rgba(220,38,38,0.08)]',
                            )}
                            style={isZero ? undefined : { backgroundColor: `rgba(220, 38, 38, ${opacity})` }}
                            title={`${day}: ${formatAmount(amount)}`}
                          >
                            <span className={cn(
                              'text-[10px] font-bold tabular-nums',
                              isZero
                                ? 'text-brand-text/30 dark:text-white/25'
                                : isDark
                                ? 'text-white'
                                : 'text-brand-text/70 dark:text-white/70',
                            )}>
                              {day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-text/30 dark:text-white/25">{tHeatmap('noSpend')}</span>
                      <div className="flex gap-0.5">
                        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((lvl) => (
                          <div
                            key={lvl}
                            className="w-3 h-3 rounded"
                            style={lvl === 0
                              ? { backgroundColor: 'rgba(13, 148, 136, 0.06)' }
                              : { backgroundColor: `rgba(220, 38, 38, ${0.15 + lvl * 0.85})` }
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-text/30 dark:text-white/25">{tHeatmap('high')}</span>
                    </div>
                  </div>

                  {/* Stats side panel — desktop only */}
                  <div className="hidden md:flex flex-col gap-3 md:w-[260px] md:flex-shrink-0 pt-1">
                    <div className="rounded-2xl border border-brand-primary/[0.08] dark:border-white/[0.06] bg-brand-primary/[0.03] dark:bg-white/[0.02] p-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text/35 dark:text-white/25 mb-1">{tHeatmap('totalSpent')}</p>
                      <p className="text-2xl font-black tabular-nums text-brand-text dark:text-white tracking-tight">
                        {formatAmount(heatmapData.totalSpend)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-black/[0.04] dark:border-white/[0.04] bg-slate-50/60 dark:bg-white/[0.02] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text/30 dark:text-white/25 mb-0.5">{tHeatmap('avgDay')}</p>
                        <p className="text-sm font-bold tabular-nums text-brand-text dark:text-white">{formatAmount(heatmapData.avgDaily)}</p>
                      </div>
                      <div className="rounded-2xl border border-black/[0.04] dark:border-white/[0.04] bg-slate-50/60 dark:bg-white/[0.02] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text/30 dark:text-white/25 mb-0.5">{tHeatmap('biggestDay')}</p>
                        <p className="text-sm font-bold tabular-nums text-brand-danger">
                          {heatmapData.maxSpend > 0 ? formatAmount(heatmapData.maxSpend) : '—'}
                        </p>
                        {heatmapData.maxDay > 0 && (
                          <p className="text-[9px] text-brand-text/30 dark:text-white/25 mt-0.5">{MONTH_LABELS[selectedMonthIdx]} {heatmapData.maxDay}</p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-black/[0.04] dark:border-white/[0.04] bg-slate-50/60 dark:bg-white/[0.02] p-3 col-span-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text/30 dark:text-white/25 mb-0.5">{tHeatmap('activeDays')}</p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-sm font-bold tabular-nums text-brand-text dark:text-white">{heatmapData.activeDays}</p>
                          <p className="text-[10px] text-brand-text/35 dark:text-white/30 tabular-nums">/ {heatmapData.daysInMonth}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Top transactions this month ──────────────────────────── */}
          {topTx.length > 0 && (
          <div className={cn(activeTab !== 'transactions' && 'hidden')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20 mb-1">
                {t('topTransactions', { month: MONTH_FULL[selectedMonthIdx], year: selectedYear })}
              </p>
              <div className="flex flex-col">
                {topTx.map((tx, i) => {
                  const tagInfo = tx.tag ? allTags[tx.tag] : null;
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-brand-primary/[0.06] last:border-0 native-row rounded-2xl">
                      <span className="text-[10px] font-black text-brand-text/18 dark:text-white/12 w-4 text-right flex-shrink-0 tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-brand-text/80 dark:text-white/72 truncate block leading-tight">{tx.name === 'Balance Adjustment' ? tc('balanceAdjustment') : tx.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-brand-text/28 dark:text-white/22">{tx.date}</span>
                          {tagInfo && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-[2px] rounded-full"
                              style={{ backgroundColor: `${tagInfo.color}22`, color: tagInfo.color }}
                            >
                              {tx.tag && TAGS[tx.tag] ? tTags(tx.tag as never) : tagInfo.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={cn('text-sm font-black tabular-nums flex-shrink-0',
                        tx.category === 'income' ? 'text-brand-positive' : 'text-brand-danger')}>
                        {tx.category === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* ── Monthly Report ────────────────────────────────────────── */}
          <div className={cn(activeTab !== 'month' && 'hidden')}>
            <div className="relative bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              {/* Gradient accent */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#0D9488] via-[#35C9A5] to-transparent pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0D9488]/10 dark:bg-[#0D9488]/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20">{t('insightsTitle')}</p>
                    <p className="text-sm font-bold text-brand-text dark:text-white leading-tight">{MONTH_FULL[selectedMonthIdx]} {selectedYear}</p>
                  </div>
                </div>
                {isPastMonth && (selected.income > 0 || selected.expense > 0) && (
                  <button
                    type="button"
                    onClick={generateInsights}
                    disabled={insightsLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0D9488] text-white hover:bg-[#0b7c72] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    {insightsLoading ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('insightsGenerating')}
                      </>
                    ) : savedInsight ? t('insightsRegenerate') : t('insightsGenerate')}
                  </button>
                )}
              </div>

              {!isPastMonth ? (
                <p className="px-4 sm:px-5 pb-5 text-sm text-brand-text/40 dark:text-white/30 italic">{t('insightsOnlyPast')}</p>
              ) : !(selected.income > 0 || selected.expense > 0) ? (
                <p className="px-4 sm:px-5 pb-5 text-sm text-brand-text/40 dark:text-white/30 italic">{t('insightsOnlyPast')}</p>
              ) : (
                <div>
                  {/* Stats strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-brand-primary/[0.07] border-t border-brand-primary/[0.07]">
                    {[
                      { label: t('totalIncome'),   value: formatAmount(selected.income),  positive: true  },
                      { label: t('totalExpenses'),  value: formatAmount(selected.expense), positive: false },
                      { label: t('pdfNet'),         value: (netMonth >= 0 ? '+' : '') + formatAmount(netMonth), positive: netMonth >= 0 },
                      { label: t('savingsRate'),    value: savingsRate !== null ? `${savingsRate}%` : '—',      positive: savingsRate !== null && savingsRate >= 0 },
                    ].map(({ label, value, positive }) => (
                      <div key={label} className="bg-brand-card dark:bg-[#042F2E] px-4 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text/28 dark:text-white/20 mb-0.5">{label}</p>
                        <p className={cn('text-base font-black tabular-nums leading-tight', positive ? 'text-brand-positive' : 'text-brand-danger')}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Top spending categories */}
                  {tagBreakdown.length > 0 && (
                    <div className="px-4 sm:px-5 pt-4 pb-3 border-t border-brand-primary/[0.06]">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 mb-3">{t('pdfTopCategories')}</p>
                      <div className="flex flex-col gap-2.5">
                        {tagBreakdown.slice(0, 5).map(({ key, amount, label, color }) => {
                          const pct = Math.round((amount / (tagBreakdown[0]?.amount ?? 1)) * 100);
                          const ofTotal = selected.expense > 0 ? Math.round((amount / selected.expense) * 100) : 0;
                          return (
                            <div key={key}>
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                  <span className="text-xs font-semibold text-brand-text/70 dark:text-white/65">{label}</span>
                                  <span className="text-[10px] text-brand-text/28 dark:text-white/22">{ofTotal}%</span>
                                </div>
                                <span className="text-xs font-bold text-brand-text/60 dark:text-white/50 tabular-nums">{formatAmount(amount)}</span>
                              </div>
                              <div className="h-2 bg-brand-primary/[0.07] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI advice */}
                  <div className="px-4 sm:px-5 pt-3 pb-5 border-t border-brand-primary/[0.06]">
                    {insightsError ? (
                      <p className="text-sm text-red-500/70">{t('insightsError')}</p>
                    ) : savedInsight ? (
                      <>
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/28 dark:text-white/18 mb-2">{t('pdfAiInsights')}</p>
                        <p className="text-sm text-brand-text/75 dark:text-white/65 leading-relaxed whitespace-pre-wrap">{savedInsight.advice}</p>
                        <p className="text-[10px] text-brand-text/22 dark:text-white/16 mt-3">
                          {t('insightsGeneratedOn', { date: new Date(savedInsight.generatedAt).toLocaleDateString() })}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-brand-text/35 dark:text-white/25">{t('insightsGenerate')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Annual spending — donut + category bars ──────────────── */}
          {annualTags.length > 0 && (
          <div className={cn(activeTab !== 'annual' && 'hidden')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20">
                  {t('annualSpending', { year: selectedYear })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-0 sm:divide-x sm:divide-brand-primary/[0.07]">

                {/* Donut */}
                <div className="flex-shrink-0 flex flex-col items-center px-4 sm:px-6 pb-4 sm:pb-6">
                  <svg viewBox="0 0 180 180" className="w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] text-brand-text dark:text-white" style={{ overflow: 'visible' }}>
                    {donutSegments.map((seg) => {
                      const isHovered = hoveredTag === seg.key;
                      const outerR = isHovered ? R_OUT + 6 : R_OUT;
                      return (
                        <path
                          key={seg.key}
                          d={donutPath(seg.startDeg, seg.endDeg, outerR, R_IN)}
                          fill={seg.color}
                          fillRule="evenodd"
                          opacity={hoveredTag === null || isHovered ? 0.85 : 0.3}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredTag(seg.key)}
                          onMouseLeave={() => setHoveredTag(null)}
                          onTouchStart={() => setHoveredTag(seg.key === hoveredTag ? null : seg.key)}
                          onClick={() => setAnnualDrillTag(seg.key)}
                        />
                      );
                    })}

                    {/* Centre text — shows hovered tag or total */}
                    {hoveredTag ? (() => {
                      const seg = donutSegments.find((s) => s.key === hoveredTag);
                      return seg ? (
                        <>
                          <text x={CX} y={CY - 7} textAnchor="middle" className="fill-brand-text dark:fill-white" style={{ fontSize: 13, fontWeight: 800, fontFamily: 'inherit' }}>
                            {seg.pct}%
                          </text>
                          <text x={CX} y={CY + 8} textAnchor="middle" style={{ fontSize: 8, fontWeight: 600, fontFamily: 'inherit', fill: 'currentColor', opacity: 0.45 }}>
                            {seg.label.length > 10 ? seg.label.slice(0, 10) + '…' : seg.label}
                          </text>
                        </>
                      ) : null;
                    })() : (
                      <>
                        <text x={CX} y={CY - 5} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fontFamily: 'inherit', fill: 'currentColor', opacity: 0.28 }}>
                          {t('totalSpent')}
                        </text>
                        <text x={CX} y={CY + 10} textAnchor="middle" style={{ fontSize: 11, fontWeight: 900, fontFamily: 'inherit', fill: 'currentColor', opacity: 0.75 }}>
                          {formatAmount(yearTotals.expense)}
                        </text>
                      </>
                    )}

                    {/* Percentage labels on outer edge */}
                    {donutSegments.filter(s => s.pct >= 5).map((seg) => {
                      const midAngle = (seg.startDeg + seg.endDeg) / 2;
                      const labelR = R_OUT + 14;
                      const pos = polar(CX, CY, labelR, midAngle);
                      return (
                        <text
                          key={`lbl-${seg.key}`}
                          x={pos.x}
                          y={pos.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{ fontSize: 9, fontWeight: 800, fill: seg.color, fontFamily: 'inherit' }}
                        >
                          {seg.pct}%
                        </text>
                      );
                    })}
                  </svg>
                </div>

                {/* Category list */}
                <div className="flex-1 min-w-0 px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="flex flex-col gap-2.5">
                    {annualTags.map(({ key, amount, label, color }) => {
                      const barPct  = Math.round((amount / maxAnnualTagAmt) * 100);
                      const ofTotal = yearTotals.expense > 0 ? Math.round((amount / yearTotals.expense) * 100) : 0;
                      const isH     = hoveredTag === key;
                      return (
                        <div
                          key={key}
                          className={cn('cursor-pointer transition-opacity duration-150', hoveredTag !== null && !isH && 'opacity-40')}
                          onMouseEnter={() => setHoveredTag(key)}
                          onMouseLeave={() => setHoveredTag(null)}
                          onClick={() => setAnnualDrillTag(key)}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-xs font-semibold text-brand-text/75 dark:text-white/70">{label}</span>
                              <span className="text-[10px] text-brand-text/28 dark:text-white/22">{ofTotal}%</span>
                            </div>
                            <span className="text-xs font-bold text-brand-text/65 dark:text-white/55 tabular-nums">{formatAmount(amount)}</span>
                          </div>
                          <div className="h-2 bg-brand-primary/[0.07] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barPct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* ── Goals ────────────────────────────────────────────────── */}
          <div className={cn(activeTab !== 'goals' && 'hidden')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="px-5 pt-5 pb-4">
                <h2 className="text-base font-extrabold text-brand-text dark:text-white tracking-tight">{t('tabGoals')}</h2>
                <p className="text-xs text-brand-text/40 dark:text-white/35 mt-0.5">{t('goalsSubtitle')}</p>
              </div>
              <div className="px-5 pb-5 flex flex-col gap-3">
                {goals.length === 0 && !showAddGoal && (
                  <p className="text-sm text-brand-text/40 dark:text-white/30">{t('noGoals')}</p>
                )}
                {goals.map((goal) => {
                  const today = new Date().toISOString().slice(0, 10);
                  // Use dayTransactions (already expanded recurring occurrences) so
                  // both one-off and recurring past/present amounts count toward progress.
                  const savedAmount = goal.linkedTagId
                    ? Array.from(dayTransactions.entries())
                        .filter(([date]) => date <= today)
                        .flatMap(([, txs]) => txs)
                        .filter((tx) => tx.category === 'expense' && tx.tag === goal.linkedTagId)
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    : goal.currentSaved;

                  const pct = goal.targetAmount > 0 ? Math.min(savedAmount / goal.targetAmount, 1) : 0;
                  const remaining = Math.max(0, goal.targetAmount - savedAmount);
                  const daysLeft = goal.deadline
                    ? Math.max(0, Math.ceil((new Date(goal.deadline + 'T12:00:00').getTime() - Date.now()) / 86_400_000))
                    : null;
                  const linkedTag = goal.linkedTagId ? allTags[goal.linkedTagId] : null;

                  return (
                    <div key={goal.id} className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F4FDFB] dark:bg-[#042F2E]/10">
                      <div className="flex items-center gap-4 mb-2">
                        {/* Circular progress */}
                        <div className="relative flex-shrink-0 w-14 h-14">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-brand-primary/10 dark:text-brand-primary/15" />
                            <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
                              style={{ stroke: pct >= 1 ? '#16A34A' : '#0D9488', strokeDasharray: `${pct * 97.4} 97.4` }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[11px] font-black text-brand-text dark:text-white tabular-nums">{Math.round(pct * 100)}%</span>
                          </div>
                        </div>
                        {/* Goal info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {goal.icon && <span className="text-base flex-shrink-0 leading-none">{goal.icon}</span>}
                            {linkedTag && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: linkedTag.color }} />}
                            <p className="text-sm font-bold text-brand-text dark:text-white truncate">{goal.name}</p>
                          </div>
                          <p className="text-xs text-brand-text/50 dark:text-white/40 tabular-nums">{formatAmount(savedAmount)} / {formatAmount(goal.targetAmount)}</p>
                          {goal.deadline && (
                            <p className="text-[11px] text-brand-text/35 dark:text-white/30 mt-0.5">
                              {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {daysLeft !== null ? (daysLeft > 0 ? ` · ${daysLeft}d left` : ' · Overdue') : ''}
                            </p>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {pct < 1 && <span className="text-[10px] text-brand-text/30 dark:text-white/25">{formatAmount(remaining)} left</span>}
                          <button type="button" onClick={() => deleteGoal(goal.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-brand-text/25 hover:text-red-500 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Linked tag or manual controls */}
                      {linkingGoalId === goal.id ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Object.entries(allTags).filter(([, tag]) => tag.category === 'expense' || tag.category === 'both').map(([key, { label, color }]) => (
                            <button key={key} type="button"
                              onClick={() => { updateGoal(goal.id, { linkedTagId: key, currentSaved: 0 }); setLinkingGoalId(null); }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-brand-primary/15 dark:border-white/10 bg-white dark:bg-white/5 text-brand-text/60 dark:text-white/60 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              {TAGS[key] ? tTags(key as never) : label}
                            </button>
                          ))}
                          <button type="button" onClick={() => setLinkingGoalId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs border border-brand-primary/15 dark:border-white/10 text-brand-text/40 dark:text-white/30">
                            Cancel
                          </button>
                        </div>
                      ) : linkedTag ? (
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: linkedTag.color }} />
                            <span className="text-xs text-brand-text/40 dark:text-white/40">
                              Auto-tracked via <span className="font-medium text-brand-text/60 dark:text-white/60">{goal.linkedTagId && TAGS[goal.linkedTagId] ? tTags(goal.linkedTagId as never) : linkedTag.label}</span>
                            </span>
                          </div>
                          <button type="button"
                            onClick={() => updateGoal(goal.id, { linkedTagId: undefined })}
                            className="text-[11px] text-brand-text/30 hover:text-red-400 transition-colors">
                            Unlink
                          </button>
                        </div>
                      ) : editGoalId === goal.id ? (
                        <div className="flex gap-2">
                          <input type="number" value={editSaved} onChange={(e) => setEditSaved(e.target.value)}
                            placeholder="Amount saved so far" autoFocus
                            className="flex-1 h-9 px-2 rounded-2xl bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white placeholder:text-brand-text/30 outline-none focus:border-emerald-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
                          <button type="button" onClick={() => { updateGoal(goal.id, { currentSaved: Number(editSaved) || 0 }); setEditGoalId(null); }}
                            className="px-3 h-9 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold active:scale-[0.96] transition-all duration-100">Save</button>
                          <button type="button" onClick={() => setEditGoalId(null)}
                            className="px-2 h-9 rounded-2xl bg-brand-primary/8 dark:bg-white/5 text-brand-text/50 dark:text-white/50 text-xs active:scale-[0.96] transition-all duration-100">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => { setEditGoalId(goal.id); setEditSaved(goal.currentSaved.toString()); }}
                            className="text-xs font-semibold text-brand-primary hover:underline">
                            Update amount
                          </button>
                          <span className="text-brand-primary/20 text-xs">·</span>
                          <button type="button" onClick={() => { setLinkingGoalId(goal.id); setEditGoalId(null); }}
                            className="text-xs text-brand-text/35 dark:text-white/30 hover:text-emerald-500 transition-colors">
                            Link to tag
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add goal form */}
                {showAddGoal ? (
                  <div className="flex flex-col gap-3 p-4 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10">
                    {!goalForm.name && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {GOAL_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setGoalForm((f) => ({ ...f, name: preset.name, icon: preset.icon }))}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:border-brand-primary/30 active:scale-[0.96] transition-all duration-100"
                          >
                            <span className="text-2xl">{preset.icon}</span>
                            <span className="text-[10px] font-semibold text-brand-text/60 dark:text-white/50 text-center leading-tight">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <input value={goalForm.name} onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Goal name (e.g. Holiday fund)" autoFocus
                      className="w-full h-10 px-3 rounded-2xl bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white placeholder:text-brand-text/30 outline-none focus:border-emerald-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
                    <input type="number" value={goalForm.target} onChange={(e) => setGoalForm((f) => ({ ...f, target: e.target.value }))}
                      placeholder="Target amount" min="0"
                      className="w-full h-10 px-3 rounded-2xl bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white placeholder:text-brand-text/30 outline-none focus:border-emerald-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
                    {!goalForm.linkedTagId && (
                      <input type="number" value={goalForm.currentSaved} onChange={(e) => setGoalForm((f) => ({ ...f, currentSaved: e.target.value }))}
                        placeholder="Already saved (optional)" min="0"
                        className="w-full h-10 px-3 rounded-2xl bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white placeholder:text-brand-text/30 outline-none focus:border-emerald-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
                    )}
                    <div>
                      <p className="text-xs text-brand-text/40 dark:text-white/40 mb-1">Deadline (optional)</p>
                      <input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm((f) => ({ ...f, deadline: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white outline-none focus:border-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-text/40 dark:text-white/40 mb-1.5">Link to expense tag — matching transactions auto-update progress</p>
                      <div className="flex items-center gap-2 mb-2">
                        <button type="button" onClick={() => setGoalForm((f) => ({ ...f, linkedTagId: '' }))}
                          className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                            !goalForm.linkedTagId
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-primary/15 dark:border-white/10 text-brand-text/50 dark:text-white/40 bg-white dark:bg-white/5')}>
                          Manual
                        </button>
                        <span className="text-xs text-brand-text/30 dark:text-white/25">or pick / create a tag</span>
                      </div>
                      <TagDropdown
                        allTags={allTags}
                        category="expense"
                        selected={goalForm.linkedTagId}
                        onSelect={(key) => setGoalForm((f) => ({ ...f, linkedTagId: key }))}
                        hideLabel
                      />

                      {/* Inline 'create new tag' — separate from the dropdown so
                          it works even if the dropdown UI misbehaves on mobile */}
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newTagName.trim()) {
                              e.preventDefault();
                              const newId = crypto.randomUUID();
                              addCustomTag({ id: newId, label: newTagName.trim(), color: '#10b981', category: 'expense' });
                              setGoalForm((f) => ({ ...f, linkedTagId: newId }));
                              setNewTagName('');
                            }
                          }}
                          placeholder="Or type a new tag name…"
                          className="flex-1 min-w-0 h-9 px-3 rounded-xl bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-xs text-brand-text dark:text-white placeholder:text-brand-text/35 dark:placeholder:text-white/25 outline-none focus:border-emerald-400"
                        />
                        <button
                          type="button"
                          disabled={!newTagName.trim()}
                          onClick={() => {
                            const trimmed = newTagName.trim();
                            if (!trimmed) return;
                            const newId = crypto.randomUUID();
                            addCustomTag({ id: newId, label: trimmed, color: '#10b981', category: 'expense' });
                            setGoalForm((f) => ({ ...f, linkedTagId: newId }));
                            setNewTagName('');
                          }}
                          className="flex-shrink-0 h-9 px-3 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] transition-all"
                        >
                          + Create
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => {
                          const target = Number(goalForm.target);
                          if (!goalForm.name.trim() || !target || target <= 0) return;
                          addGoal({
                            name: goalForm.name.trim(),
                            targetAmount: target,
                            currentSaved: goalForm.linkedTagId ? 0 : (Number(goalForm.currentSaved) || 0),
                            deadline: goalForm.deadline || undefined,
                            linkedTagId: goalForm.linkedTagId || undefined,
                            icon: goalForm.icon || undefined,
                          });
                          setGoalForm({ name: '', target: '', currentSaved: '', deadline: '', linkedTagId: '', icon: '' });
                          setNewTagName('');
                          setShowAddGoal(false);
                        }}
                        className="flex-1 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold active:scale-[0.96] transition-all duration-100">
                        Add goal
                      </button>
                      <button type="button" onClick={() => setShowAddGoal(false)}
                        className="px-4 h-10 rounded-2xl bg-brand-primary/8 dark:bg-white/5 text-brand-text/60 dark:text-white/60 text-sm font-semibold active:scale-[0.96] transition-all duration-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddGoal(true)}
                    className="w-full h-11 rounded-2xl border border-dashed border-brand-primary/20 dark:border-white/10 text-sm text-brand-text/40 dark:text-white/30 hover:border-emerald-400 hover:text-emerald-500 active:scale-[0.96] transition-all duration-100">
                    + Add savings goal
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Subscriptions ─────────────────────────────────────────── */}
          <div className={cn(activeTab !== 'subscriptions' && 'hidden')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="h-[3px] w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="px-5 pt-5 pb-4">
                <h2 className="text-base font-extrabold text-brand-text dark:text-white tracking-tight">{t('subsTitle')}</h2>
                <p className="text-xs text-brand-text/40 dark:text-white/35 mt-0.5">{t('subsSubtitle')}</p>
              </div>

              {subscriptions.length === 0 ? (
                <div className="px-5 pb-8 flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-brand-text/50 dark:text-white/40">{t('subsNoSubscriptions')}</p>
                  <p className="text-xs text-brand-text/30 dark:text-white/25">{t('subsNoSubscriptionsHint')}</p>
                </div>
              ) : (
                <div className="px-5 pb-5 flex flex-col gap-4">
                  {/* ── Summary cards ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-brand-danger/8 dark:bg-brand-danger/10 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-danger/60 dark:text-brand-danger/50">{t('subsTotalMonthly')}</p>
                      <p className="text-lg font-extrabold text-brand-danger dark:text-brand-danger/90 mt-1 tabular-nums">{formatAmount(totalMonthlyExpense)}</p>
                      <p className="text-[10px] text-brand-text/35 dark:text-white/30 mt-0.5">{t('subsAnnualCost')}: {formatAmount(totalMonthlyExpense * 12)}</p>
                    </div>
                    <div className="rounded-2xl bg-brand-positive/8 dark:bg-brand-positive/10 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-positive/60 dark:text-brand-positive/50">{t('subsIncome')}</p>
                      <p className="text-lg font-extrabold text-brand-positive dark:text-brand-positive/90 mt-1 tabular-nums">{formatAmount(totalMonthlyIncome)}</p>
                      <p className="text-[10px] text-brand-text/35 dark:text-white/30 mt-0.5">{t('subsCount', { count: subsIncome.length })}</p>
                    </div>
                  </div>

                  {/* ── Expense subscriptions ── */}
                  {subsExpenses.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text/35 dark:text-white/25 mb-2">{t('subsExpense')} ({subsExpenses.length})</p>
                      <div className="flex flex-col gap-1.5">
                        {subsExpenses.map((sub) => (
                          <div key={sub.id} className="native-row flex items-center gap-3 px-3.5 py-3 rounded-2xl">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: sub.tagInfo?.color ? `${sub.tagInfo.color}18` : 'rgba(220,38,38,0.08)' }}>
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.tagInfo?.color ?? '#DC2626' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-brand-text dark:text-white truncate">{sub.name}</p>
                              <p className="text-[11px] text-brand-text/40 dark:text-white/35">
                                {tFreq(FREQ_LABEL_KEY[sub.freq] as never)}
                                {sub.start_date && <> &middot; {t('subsStarted', { date: format(new Date(sub.start_date), 'MMM yyyy') })}</>}
                                {sub.end_date
                                  ? <> &middot; {t('subsEnds', { date: format(new Date(sub.end_date), 'MMM yyyy') })}</>
                                  : <> &middot; {t('subsOngoing')}</>}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-brand-danger tabular-nums">{formatAmount(sub.amount)}</p>
                              <p className="text-[10px] text-brand-text/30 dark:text-white/25 tabular-nums">
                                {formatAmount(sub.monthlyCost)}{t('subsPerMonth')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Income subscriptions ── */}
                  {subsIncome.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text/35 dark:text-white/25 mb-2">{t('subsIncome')} ({subsIncome.length})</p>
                      <div className="flex flex-col gap-1.5">
                        {subsIncome.map((sub) => (
                          <div key={sub.id} className="native-row flex items-center gap-3 px-3.5 py-3 rounded-2xl">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: sub.tagInfo?.color ? `${sub.tagInfo.color}18` : 'rgba(22,163,74,0.08)' }}>
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.tagInfo?.color ?? '#16A34A' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-brand-text dark:text-white truncate">{sub.name}</p>
                              <p className="text-[11px] text-brand-text/40 dark:text-white/35">
                                {tFreq(FREQ_LABEL_KEY[sub.freq] as never)}
                                {sub.start_date && <> &middot; {t('subsStarted', { date: format(new Date(sub.start_date), 'MMM yyyy') })}</>}
                                {sub.end_date
                                  ? <> &middot; {t('subsEnds', { date: format(new Date(sub.end_date), 'MMM yyyy') })}</>
                                  : <> &middot; {t('subsOngoing')}</>}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-brand-positive tabular-nums">{formatAmount(sub.amount)}</p>
                              <p className="text-[10px] text-brand-text/30 dark:text-white/25 tabular-nums">
                                {formatAmount(sub.monthlyCost)}{t('subsPerMonth')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Savings rate trend ───────────────────────────────────── */}
          {hasSomeData && (
          <div className={cn(activeTab !== 'annual' && 'hidden')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20 mb-4">
                {t('savingsRateByMonth', { year: selectedYear })}
              </p>
              <div className="flex gap-1.5 sm:gap-2 items-end" style={{ height: '72px' }}>
                {yearlyData.map((m, idx) => {
                  const rate  = m.income > 0
                    ? Math.max(-100, Math.min(100, Math.round(((m.income - m.expense) / m.income) * 100)))
                    : null;
                  const isPos = rate !== null && rate >= 0;
                  const barH  = rate !== null ? Math.max(4, Math.abs(rate) * 0.44) : 3;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedMonthIdx(idx)}
                      className="flex-1 flex flex-col items-center gap-0.5 group"
                    >
                      <span className={cn('text-[7px] font-black tabular-nums leading-none',
                        rate === null ? 'text-transparent' :
                        isPos ? 'text-brand-positive/75' : 'text-brand-danger/75')}>
                        {rate !== null ? `${rate}%` : '0'}
                      </span>
                      <div
                        className={cn('w-full rounded-sm transition-all duration-300 group-hover:opacity-80',
                          rate === null ? 'bg-brand-primary/8' :
                          isPos ? 'bg-brand-positive/55 dark:bg-brand-positive/45' : 'bg-brand-danger/55 dark:bg-brand-danger/45')}
                        style={{ height: `${barH}px` }}
                      />
                      <span className={cn('text-[8px] font-semibold leading-none',
                        idx === selectedMonthIdx ? 'text-brand-primary' : 'text-brand-text/25 dark:text-white/18')}>
                        {MONTH_LABELS[idx]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          )}

        </div>
      </div>

      {/* ── Tag drill-down drawer ──────────────────────────────────────────── */}
      {selectedTagKey !== null && (() => {
        const tagInfo = tagBreakdown.find((t) => t.key === selectedTagKey);
        const tagLabel = tagInfo?.label ?? selectedTagKey;
        const tagColor = tagInfo?.color ?? '#6b7280';

        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-[2px]"
              onClick={() => { setSelectedTagKey(null); setRetaggingKey(null); }}
            />

            {/* Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-[160] flex flex-col rounded-t-3xl bg-white dark:bg-[#042F2E] shadow-2xl max-h-[82vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg sm:rounded-3xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-9 h-1 rounded-full bg-brand-text/12 dark:bg-white/12" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 px-5 pt-3 pb-3 border-b border-brand-primary/[0.08] flex-shrink-0">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tagColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-brand-text dark:text-white leading-tight truncate">{tagLabel}</p>
                  <p className="text-[11px] text-brand-text/40 dark:text-white/30">{MONTH_FULL[selectedMonthIdx]} {selectedYear}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedTagKey(null); setRetaggingKey(null); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-text/40 hover:text-brand-text/70 dark:text-white/30 dark:hover:text-white/70 hover:bg-brand-primary/8 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Hint */}
              <p className="px-5 pt-2.5 text-[11px] text-brand-text/35 dark:text-white/25 flex-shrink-0">
                {t('tagDrawerHint')}
              </p>

              {/* Transaction list */}
              <div className="flex-1 overflow-y-auto px-5 pb-6 pt-1">
                {tagTransactionsList.length === 0 ? (
                  <p className="text-sm text-brand-text/35 dark:text-white/25 text-center py-10">{t('tagDrawerEmpty')}</p>
                ) : (
                  <div className="flex flex-col divide-y divide-brand-primary/[0.06]">
                    {tagTransactionsList.map(({ tx, date }) => {
                      const rowKey   = `${tx.transaction_id}-${date}`;
                      const isOpen   = retaggingKey === rowKey;
                      const currentTagInfo = tx.tag && allTags[tx.tag] ? allTags[tx.tag] : null;
                      const currentTagLabel = tx.tag
                        ? (TAGS[tx.tag] ? tTags(tx.tag as never) : (allTags[tx.tag]?.label ?? tx.tag))
                        : tTags('untagged' as never);

                      return (
                        <div key={rowKey} className="py-3 native-row rounded-2xl">
                          {/* Transaction row */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-brand-text/85 dark:text-white/80 truncate leading-tight">
                                {tc('balanceAdjustment') === tx.name ? tc('balanceAdjustment') : tx.name}
                              </p>
                              <p className="text-[11px] text-brand-text/35 dark:text-white/28 mt-0.5">{date}</p>
                            </div>
                            <span className="text-sm font-bold text-brand-danger tabular-nums flex-shrink-0">
                              -{formatAmount(tx.amount)}
                            </span>
                            {/* Tag chip — click to open picker */}
                            <button
                              type="button"
                              onClick={() => setRetaggingKey(isOpen ? null : rowKey)}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all border flex-shrink-0"
                              style={currentTagInfo
                                ? { backgroundColor: `${currentTagInfo.color}18`, color: currentTagInfo.color, borderColor: `${currentTagInfo.color}30` }
                                : { backgroundColor: 'rgba(107,114,128,0.1)', color: '#6b7280', borderColor: 'rgba(107,114,128,0.2)' }}
                            >
                              {currentTagLabel}
                              <svg className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* Inline tag picker */}
                          {isOpen && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5 pl-0">
                              {retagOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={updateTx.isPending}
                                  onClick={() => {
                                    updateTx.mutate(
                                      { id: tx.transaction_id, editMode: 'all', values: { tag: opt.id } },
                                      { onSuccess: () => setRetaggingKey(null) },
                                    );
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-50"
                                  style={{ backgroundColor: `${opt.color}15`, color: opt.color, borderColor: `${opt.color}30` }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Annual tag drill-down drawer ───────────────────────────────────── */}
      {annualDrillTag !== null && (() => {
        const tagInfo = annualTags.find((t) => t.key === annualDrillTag);
        const tagLabel = tagInfo?.label ?? annualDrillTag;
        const tagColor = tagInfo?.color ?? '#6b7280';
        const tagTotal = tagInfo?.amount ?? 0;

        // Collect all transactions for this tag in the selected year
        const yearPrefix = `${selectedYear}-`;
        const annualDrillTxs: Array<{ tx: DayTransaction; date: string }> = [];
        for (const [date, txs] of dayTransactions) {
          if (!date.startsWith(yearPrefix)) continue;
          for (const tx of txs) {
            const txTag = tx.tag ?? '__untagged__';
            if (txTag === annualDrillTag && tx.category === 'expense') {
              annualDrillTxs.push({ tx, date });
            }
          }
        }
        annualDrillTxs.sort((a, b) => b.date.localeCompare(a.date));

        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-[2px]"
              onClick={() => setAnnualDrillTag(null)}
            />

            {/* Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-[160] flex flex-col rounded-t-3xl bg-white dark:bg-[#042F2E] shadow-2xl max-h-[82vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg sm:rounded-3xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-9 h-1 rounded-full bg-brand-text/12 dark:bg-white/12" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 px-5 pt-3 pb-3 border-b border-brand-primary/[0.08] flex-shrink-0">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tagColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-brand-text dark:text-white leading-tight truncate">{tagLabel}</p>
                  <p className="text-[11px] text-brand-text/40 dark:text-white/30">{selectedYear} &middot; {formatAmount(tagTotal)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnnualDrillTag(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-text/40 hover:text-brand-text/70 dark:text-white/30 dark:hover:text-white/70 hover:bg-brand-primary/8 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Transaction list */}
              <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
                {annualDrillTxs.length === 0 ? (
                  <p className="text-sm text-brand-text/35 dark:text-white/25 text-center py-10">{t('tagDrawerEmpty')}</p>
                ) : (
                  <div className="flex flex-col divide-y divide-brand-primary/[0.06]">
                    {annualDrillTxs.map(({ tx, date }, i) => (
                      <div key={`${tx.transaction_id}-${date}-${i}`} className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-brand-text/85 dark:text-white/80 truncate leading-tight">
                              {tc('balanceAdjustment') === tx.name ? tc('balanceAdjustment') : tx.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-brand-text/35 dark:text-white/28">{date}</span>
                              {tx.frequency ? (
                                <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 dark:bg-violet-400/15 dark:text-violet-400">
                                  {tFreq(tx.frequency as never)}
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-primary/8 text-brand-text/30 dark:bg-white/8 dark:text-white/25">
                                  {tFreq('once' as never)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-brand-danger tabular-nums flex-shrink-0">
                            -{formatAmount(tx.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

    </AppLayout>
  );
}
