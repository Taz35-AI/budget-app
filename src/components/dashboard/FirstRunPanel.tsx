'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';

/**
 * First-run experience for an empty dashboard.
 *
 * The funnel showed new users reaching a working, provisioned dashboard and
 * leaving without adding anything: the product's value (a forward balance
 * forecast) is invisible until data exists, so an empty calendar asks for
 * effort before it gives anything back. This panel leads with the payoff by
 * offering one tap to populate the calendar with example data, and puts CSV
 * import — the fastest route to a real populated forecast — in front of the
 * user instead of leaving it buried in the nav.
 *
 * Example data is written through the normal import endpoint so it carries an
 * import_batch_id, which makes "clear" a single reversible call rather than a
 * bespoke cleanup path.
 */

const DEMO_KEY = 'bt_demo_batch';

interface DemoRow {
  name: string;
  amount: number;
  category: 'income' | 'expense';
  tag: string;
  day: number;
  frequency: 'monthly' | 'weekly';
  /** One-off rows seed a starting balance; everything else recurs. */
  once?: boolean;
}

/**
 * Shape of the sample month: a salary, the usual fixed costs, one weekly drain,
 * and an opening balance.
 *
 * The opening balance matters. Without it the running balance starts at zero,
 * rent lands before payday, and the whole forecast renders red — which sells
 * the opposite of the point. Starting in credit shows the upward trend the
 * product actually exists to reveal.
 */
const DEMO_SHAPE: Omit<DemoRow, 'name'>[] = [
  { amount: 1800,  category: 'income',  tag: 'savings',       day: 1,  frequency: 'monthly', once: true },
  { amount: 2400,  category: 'income',  tag: 'salary',        day: 25, frequency: 'monthly' },
  { amount: 950,   category: 'expense', tag: 'housing',       day: 1,  frequency: 'monthly' },
  { amount: 140,   category: 'expense', tag: 'utilities',     day: 5,  frequency: 'monthly' },
  { amount: 120,   category: 'expense', tag: 'transport',     day: 8,  frequency: 'monthly' },
  { amount: 25,    category: 'expense', tag: 'utilities',     day: 12, frequency: 'monthly' },
  { amount: 12.99, category: 'expense', tag: 'subscriptions', day: 18, frequency: 'monthly' },
  { amount: 30,    category: 'expense', tag: 'gym_fitness',   day: 22, frequency: 'monthly' },
  { amount: 85,    category: 'expense', tag: 'groceries',     day: 3,  frequency: 'weekly'  },
];

/** YYYY-MM-DD for the given day of the current month, clamped to month length. */
function dayOfThisMonth(day: number): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const d = new Date(now.getFullYear(), now.getMonth(), Math.min(day, last));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function useDemoData() {
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try { setBatchId(localStorage.getItem(DEMO_KEY)); } catch { /* private mode */ }
  }, []);

  const seed = useCallback(async (rows: DemoRow[], accountId: string | null) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/import/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: rows.map((r) => ({
            name: r.name,
            amount: r.amount,
            category: r.category,
            tag: r.tag,
            account_id: accountId,
            ...(r.once
              ? { type: 'one_off', date: dayOfThisMonth(r.day) }
              : { type: 'recurring', frequency: r.frequency, start_date: dayOfThisMonth(r.day) }),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.batchId) throw new Error(data.error ?? 'failed');
      try { localStorage.setItem(DEMO_KEY, data.batchId); } catch { /* private mode */ }
      setBatchId(data.batchId);
      await qc.invalidateQueries({ queryKey: ['transactions'] });
      return true;
    } catch {
      setError('failed');
      return false;
    } finally {
      setBusy(false);
    }
  }, [qc]);

  const clear = useCallback(async () => {
    if (!batchId) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/import/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });
      if (!res.ok) throw new Error('failed');
      try { localStorage.removeItem(DEMO_KEY); } catch { /* private mode */ }
      setBatchId(null);
      await qc.invalidateQueries({ queryKey: ['transactions'] });
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }, [batchId, qc]);

  /** Forget the demo marker without deleting anything (user chose to keep it). */
  const keep = useCallback(() => {
    try { localStorage.removeItem(DEMO_KEY); } catch { /* private mode */ }
    setBatchId(null);
  }, []);

  return { isDemo: !!batchId, busy, error, seed, clear, keep };
}

// ─── Banner shown while example data is on screen ────────────────────────────

interface BannerProps {
  onClear: () => void;
  onKeep: () => void;
  busy: boolean;
}

export function DemoDataBanner({ onClear, onKeep, busy }: BannerProps) {
  const t = useTranslations('onboarding');
  return (
    <div className="mb-3 rounded-2xl border border-amber-300/50 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{t('demoBannerTitle')}</p>
        <p className="text-xs text-amber-800/80 dark:text-amber-200/70">{t('demoBannerDesc')}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onKeep}
          disabled={busy}
          className="h-8 px-3 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 border border-amber-400/50 hover:bg-amber-400/10 disabled:opacity-50 transition-colors"
        >
          {t('demoKeep')}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="h-8 px-3 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {busy ? t('demoClearing') : t('demoClear')}
        </button>
      </div>
    </div>
  );
}

// ─── The empty-state panel itself ────────────────────────────────────────────

interface Props {
  accountId: string | null;
  onAddManual: () => void;
  onSeed: (rows: DemoRow[], accountId: string | null) => Promise<boolean>;
  busy: boolean;
  error: string;
}

export function FirstRunPanel({ accountId, onAddManual, onSeed, busy, error }: Props) {
  const t = useTranslations('onboarding');

  const handleDemo = () => {
    const names = [
      t('demoOpening'), t('demoSalary'), t('demoRent'), t('demoUtilities'), t('demoTransport'),
      t('demoPhone'), t('demoStreaming'), t('demoGym'), t('demoGroceries'),
    ];
    onSeed(DEMO_SHAPE.map((s, i) => ({ ...s, name: names[i] })), accountId);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-brand-primary/15 dark:border-white/10 bg-white/95 dark:bg-[#0f2b2a]/95 backdrop-blur-sm shadow-[0_20px_50px_-20px_rgba(13,148,136,0.45)] p-6 sm:p-8 text-center">

        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-500/20 dark:to-teal-500/5 border border-brand-primary/15 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-brand-primary dark:text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-5 3.5 3.5L21 6" />
            <path d="M21 11V6h-5" />
          </svg>
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-brand-text dark:text-white mb-1.5">
          {t('heroTitle')}
        </h2>
        <p className="text-sm text-brand-text/60 dark:text-white/55 max-w-sm mx-auto mb-6 leading-relaxed">
          {t('heroDesc')}
        </p>

        <div className="flex flex-col gap-2.5 text-left">
          {/* Primary: value before effort */}
          <button
            type="button"
            onClick={handleDemo}
            disabled={busy}
            className="group w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-b from-[#12b3a3] to-brand-primary text-white shadow-[0_6px_18px_-6px_rgba(13,148,136,0.6)] hover:brightness-105 active:scale-[0.99] disabled:opacity-60 transition-all"
          >
            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-base">✨</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{busy ? t('demoLoading') : t('tryDemo')}</span>
              <span className="block text-[11px] text-white/80">{t('tryDemoHint')}</span>
            </span>
          </button>

          {/* Fastest route to real data */}
          <Link
            href="/import"
            className="group w-full flex items-center gap-3 rounded-2xl px-4 py-3 border border-brand-primary/20 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-brand-primary/40 hover:bg-brand-primary/[0.03] active:scale-[0.99] transition-all"
          >
            <span className="w-8 h-8 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center flex-shrink-0 text-base">📥</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-brand-text dark:text-white">{t('importCsv')}</span>
              <span className="block text-[11px] text-brand-text/50 dark:text-white/45">{t('importCsvHint')}</span>
            </span>
          </Link>

          {/* Manual */}
          <button
            type="button"
            onClick={onAddManual}
            className="group w-full flex items-center gap-3 rounded-2xl px-4 py-3 border border-brand-primary/20 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-brand-primary/40 hover:bg-brand-primary/[0.03] active:scale-[0.99] transition-all"
          >
            <span className="w-8 h-8 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center flex-shrink-0 text-base">✏️</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-brand-text dark:text-white">{t('addManual')}</span>
              <span className="block text-[11px] text-brand-text/50 dark:text-white/45">{t('addManualHint')}</span>
            </span>
          </button>
        </div>

        {error && (
          <p className="mt-4 text-xs font-medium text-red-600 dark:text-red-400">{t('demoError')}</p>
        )}
      </div>
    </div>
  );
}
