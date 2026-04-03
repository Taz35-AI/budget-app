'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TAGS } from '@/lib/constants';
import { useBalances } from '@/hooks/useBalances';
import { useSettings } from '@/hooks/useSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { useSettingsStore } from '@/store/settingsStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton, MobileLogo } from '@/components/layout/NavSidebar';
import { cn } from '@/lib/utils';


// Max bar height in px — leaves room for net indicator above + label below
const BAR_MAX_H = 128;

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
  const { allTags, goals, addGoal, updateGoal, deleteGoal } = useSettings();
  const { formatAmount, symbol: currencySymbol } = useCurrency();
  const { monthlyInsights, setMonthlyInsight } = useSettingsStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear,     setSelectedYear]     = useState(currentYear);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth());
  const [hoveredTag,       setHoveredTag]       = useState<string | null>(null);
  const [activeTab,        setActiveTab]        = useState<'overview' | 'month' | 'transactions' | 'annual' | 'goals'>('overview');

  // ── Insights state ──────────────────────────────────────────────────────────
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError,   setInsightsError]   = useState(false);

  // ── Goals management state ──────────────────────────────────────────────────
  const [showAddGoal,    setShowAddGoal]    = useState(false);
  const [goalForm,       setGoalForm]       = useState({ name: '', target: '', currentSaved: '', deadline: '', linkedTagId: '' });
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

  function downloadPdf() {
    const win = window.open('', '_blank');
    if (!win) return;
    const statsRows = [
      ['Income', `${currencySymbol}${selected.income.toFixed(2)}`],
      ['Expenses', `${currencySymbol}${selected.expense.toFixed(2)}`],
      ['Net', `${currencySymbol}${netMonth.toFixed(2)}`],
      ...(savingsRate !== null ? [['Savings Rate', `${savingsRate}%`]] : []),
      ['Transactions', String(selected.txCount)],
    ];
    const topCatsHtml = tagBreakdown.slice(0, 5).map((t) =>
      `<tr><td>${t.label}</td><td style="text-align:right">${currencySymbol}${t.amount.toFixed(2)}</td></tr>`
    ).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${MONTH_FULL[selectedMonthIdx]} ${selectedYear} — Financial Report</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #111; line-height: 1.6; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  h2 { font-size: 16px; font-weight: 700; margin: 28px 0 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  td { padding: 6px 0; border-bottom: 1px solid #eee; font-size: 15px; }
  td:last-child { font-weight: 700; }
  .advice { background: #f8fffe; border-left: 3px solid #0D9488; padding: 16px 20px; font-size: 15px; line-height: 1.7; margin-top: 8px; }
  .meta { color: #888; font-size: 12px; margin-top: 32px; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>${MONTH_FULL[selectedMonthIdx]} ${selectedYear}</h1>
<p style="color:#888;font-size:13px">Financial Report · Generated by Spentum</p>
<h2>Summary</h2>
<table>${statsRows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
<h2>Top Spending Categories</h2>
<table>${topCatsHtml}</table>
${savedInsight ? `<h2>AI Insights</h2><div class="advice">${savedInsight.advice.replace(/\n/g, '<br>')}</div>` : ''}
<p class="meta">Report generated on ${new Date().toLocaleDateString()} · spentum.com</p>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
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

        {/* ── Mobile tab strip + month selector ───────────────────────── */}
        <div className="sm:hidden sticky top-16 z-10 bg-[#F4FDFB]/95 dark:bg-[#011817]/95 backdrop-blur-xl border-b border-brand-primary/[0.08] dark:border-white/[0.05]">
          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-3 pt-2 pb-1.5">
            {([
              { id: 'overview',     label: t('tabOverview')      },
              { id: 'month',        label: t('tabMonth')         },
              { id: 'transactions', label: t('tabTransactions')  },
              { id: 'annual',       label: t('tabAnnual')        },
              { id: 'goals',        label: t('tabGoals')         },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex-shrink-0 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all border',
                  activeTab === id
                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                    : 'bg-white dark:bg-white/5 text-brand-text/55 dark:text-white/45 border-brand-primary/15 dark:border-white/10',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Month selector — shown on non-overview tabs */}
          <div className={cn(
            'flex items-center justify-between px-4 pb-2 pt-1',
            activeTab === 'overview' && 'invisible pointer-events-none',
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
        <div className="h-[calc(100dvh-4rem-6.5rem)] overflow-y-auto sm:h-auto sm:overflow-visible px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-4">

          {/* ── Headline bar ──────────────────────────────────────────── */}
          <div className="bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] overflow-hidden shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
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
          <div className={cn(activeTab !== 'overview' && 'hidden sm:block')}>
          <div className="bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] p-4 sm:p-5 shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
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

          {/* ── Selected month deep dive + tag breakdown ──────────────── */}
          <div className={cn(activeTab !== 'month' && 'hidden sm:block')}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Month detail */}
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] overflow-hidden shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
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
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-brand-primary/[0.07] flex">
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
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] p-4 sm:p-5 shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
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
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs font-semibold text-brand-text/75 dark:text-white/70">{label}</span>
                            <span className="text-[10px] text-brand-text/28 dark:text-white/22">{ofTotal}%</span>
                          </div>
                          <span className="text-xs font-bold text-brand-text/65 dark:text-white/55 tabular-nums">{formatAmount(amount)}</span>
                        </div>
                        <div className="h-[5px] bg-brand-primary/[0.07] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </div>

          {/* ── Top transactions this month ──────────────────────────── */}
          {topTx.length > 0 && (
          <div className={cn(activeTab !== 'transactions' && 'hidden sm:block')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] p-4 sm:p-5 shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20 mb-1">
                {t('topTransactions', { month: MONTH_FULL[selectedMonthIdx], year: selectedYear })}
              </p>
              <div className="flex flex-col">
                {topTx.map((tx, i) => {
                  const tagInfo = tx.tag ? allTags[tx.tag] : null;
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-brand-primary/[0.06] last:border-0">
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

          {/* ── AI Monthly Insights ──────────────────────────────────── */}
          <div className={cn(activeTab !== 'month' && 'hidden sm:block')}>
            <div className="relative bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] p-4 sm:p-5 shadow-[0_1px_6px_rgba(25,27,47,0.05)] overflow-hidden">
              {/* Gradient accent */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#0D9488] via-[#35C9A5] to-transparent pointer-events-none" />

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0D9488]/10 dark:bg-[#0D9488]/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text/30 dark:text-white/20">{t('insightsTitle')}</p>
                    <p className="text-sm font-bold text-brand-text dark:text-white leading-tight">{MONTH_FULL[selectedMonthIdx]} {selectedYear}</p>
                  </div>
                </div>
                {isPastMonth && (selected.income > 0 || selected.expense > 0) && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {savedInsight && (
                      <button
                        type="button"
                        onClick={downloadPdf}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary/8 dark:bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/14 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t('insightsDownloadPdf')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={generateInsights}
                      disabled={insightsLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0D9488] text-white hover:bg-[#0b7c72] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  </div>
                )}
              </div>

              {!isPastMonth ? (
                <p className="text-sm text-brand-text/40 dark:text-white/30 italic">{t('insightsOnlyPast')}</p>
              ) : insightsError ? (
                <p className="text-sm text-red-500/70">{t('insightsError')}</p>
              ) : savedInsight ? (
                <div>
                  <p className="text-sm text-brand-text/75 dark:text-white/65 leading-relaxed whitespace-pre-wrap">{savedInsight.advice}</p>
                  <p className="text-[10px] text-brand-text/25 dark:text-white/18 mt-3">
                    {t('insightsGeneratedOn', { date: new Date(savedInsight.generatedAt).toLocaleDateString() })}
                  </p>
                </div>
              ) : !(selected.income > 0 || selected.expense > 0) ? (
                <p className="text-sm text-brand-text/40 dark:text-white/30 italic">{t('insightsOnlyPast')}</p>
              ) : (
                <p className="text-sm text-brand-text/40 dark:text-white/30">{t('insightsGenerate')}</p>
              )}
            </div>
          </div>

          {/* ── Annual spending — donut + category bars ──────────────── */}
          {annualTags.length > 0 && (
          <div className={cn(activeTab !== 'annual' && 'hidden sm:block')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] overflow-hidden shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
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
                          className={cn('cursor-default transition-opacity duration-150', hoveredTag !== null && !isH && 'opacity-40')}
                          onMouseEnter={() => setHoveredTag(key)}
                          onMouseLeave={() => setHoveredTag(null)}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-xs font-semibold text-brand-text/75 dark:text-white/70">{label}</span>
                              <span className="text-[10px] text-brand-text/28 dark:text-white/22">{ofTotal}%</span>
                            </div>
                            <span className="text-xs font-bold text-brand-text/65 dark:text-white/55 tabular-nums">{formatAmount(amount)}</span>
                          </div>
                          <div className="h-[5px] bg-brand-primary/[0.07] rounded-full overflow-hidden">
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
          <div className={cn(activeTab !== 'goals' && 'hidden sm:block')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] overflow-hidden shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
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
                    <div key={goal.id} className="p-4 rounded-xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] bg-[#F4FDFB] dark:bg-[#042F2E]/10">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {linkedTag && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: linkedTag.color }} />}
                            <p className="text-sm font-semibold text-brand-text dark:text-white/90 truncate">{goal.name}</p>
                          </div>
                          {goal.deadline && (
                            <p className="text-xs text-brand-text/40 dark:text-white/35 mt-0.5">
                              {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {daysLeft !== null ? (daysLeft > 0 ? ` · ${daysLeft}d left` : ' · Overdue') : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn('text-xs font-bold tabular-nums', pct >= 1 ? 'text-brand-positive' : 'text-brand-text/40 dark:text-white/40')}>
                            {Math.round(pct * 100)}%
                          </span>
                          <button type="button" onClick={() => deleteGoal(goal.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-brand-text/30 hover:text-red-500 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-brand-primary/[0.08] dark:bg-brand-primary/[0.12] overflow-hidden mb-1.5">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', pct >= 1 ? 'bg-brand-positive' : 'bg-gradient-to-r from-[#0D9488] to-[#35C9A5]')}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-brand-text/40 dark:text-white/35 mb-2">
                        <span>{formatAmount(savedAmount)} / {formatAmount(goal.targetAmount)}</span>
                        {pct < 1 && <span>{formatAmount(remaining)} remaining</span>}
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
                            className="flex-1 h-8 px-2 rounded-lg bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white placeholder:text-brand-text/30 outline-none focus:border-emerald-400" />
                          <button type="button" onClick={() => { updateGoal(goal.id, { currentSaved: Number(editSaved) || 0 }); setEditGoalId(null); }}
                            className="px-3 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors">Save</button>
                          <button type="button" onClick={() => setEditGoalId(null)}
                            className="px-2 h-8 rounded-lg bg-brand-primary/8 dark:bg-white/5 text-brand-text/50 dark:text-white/50 text-xs transition-colors">✕</button>
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
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10">
                    <input value={goalForm.name} onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Goal name (e.g. Holiday fund)" autoFocus
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white placeholder:text-brand-text/30 outline-none focus:border-emerald-400" />
                    <input type="number" value={goalForm.target} onChange={(e) => setGoalForm((f) => ({ ...f, target: e.target.value }))}
                      placeholder="Target amount" min="0"
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white placeholder:text-brand-text/30 outline-none focus:border-emerald-400" />
                    {!goalForm.linkedTagId && (
                      <input type="number" value={goalForm.currentSaved} onChange={(e) => setGoalForm((f) => ({ ...f, currentSaved: e.target.value }))}
                        placeholder="Already saved (optional)" min="0"
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white placeholder:text-brand-text/30 outline-none focus:border-emerald-400" />
                    )}
                    <div>
                      <p className="text-xs text-brand-text/40 dark:text-white/40 mb-1">Deadline (optional)</p>
                      <input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm((f) => ({ ...f, deadline: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-white/5 border border-brand-primary/15 dark:border-white/10 text-sm text-brand-text dark:text-white outline-none focus:border-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-text/40 dark:text-white/40 mb-1.5">Link to expense tag — matching transactions auto-update progress</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => setGoalForm((f) => ({ ...f, linkedTagId: '' }))}
                          className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                            !goalForm.linkedTagId
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-primary/15 dark:border-white/10 text-brand-text/50 dark:text-white/40 bg-white dark:bg-white/5')}>
                          Manual
                        </button>
                        {Object.entries(allTags).filter(([, tag]) => tag.category === 'expense' || tag.category === 'both').map(([key, { label, color }]) => (
                          <button key={key} type="button"
                            onClick={() => setGoalForm((f) => ({ ...f, linkedTagId: f.linkedTagId === key ? '' : key }))}
                            className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                              goalForm.linkedTagId === key
                                ? 'text-white border-transparent'
                                : 'border-brand-primary/15 dark:border-white/10 bg-white dark:bg-white/5 text-brand-text/60 dark:text-white/60')}
                            style={goalForm.linkedTagId === key ? { backgroundColor: color } : undefined}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: goalForm.linkedTagId === key ? 'rgba(255,255,255,0.7)' : color }} />
                            {TAGS[key] ? tTags(key as never) : label}
                          </button>
                        ))}
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
                          });
                          setGoalForm({ name: '', target: '', currentSaved: '', deadline: '', linkedTagId: '' });
                          setShowAddGoal(false);
                        }}
                        className="flex-1 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors">
                        Add goal
                      </button>
                      <button type="button" onClick={() => setShowAddGoal(false)}
                        className="px-4 h-9 rounded-xl bg-brand-primary/8 dark:bg-white/5 text-brand-text/60 dark:text-white/60 text-sm font-semibold transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddGoal(true)}
                    className="w-full h-10 rounded-xl border border-dashed border-brand-primary/20 dark:border-white/10 text-sm text-brand-text/40 dark:text-white/30 hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                    + Add savings goal
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Savings rate trend ───────────────────────────────────── */}
          {hasSomeData && (
          <div className={cn(activeTab !== 'annual' && 'hidden sm:block')}>
            <div className="bg-brand-card dark:bg-[#042F2E] rounded-2xl border border-brand-primary/[0.09] dark:border-brand-primary/[0.07] p-4 sm:p-5 shadow-[0_1px_6px_rgba(25,27,47,0.05)]">
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
    </AppLayout>
  );
}
