'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/hooks/useSettings';
import { useAccounts } from '@/hooks/useAccounts';
import { useSettingsStore } from '@/store/settingsStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'map' | 'preview' | 'recurring' | 'importing' | 'done';

interface RawRow {
  [key: string]: string;
}

interface ParsedTransaction {
  id: string;
  name: string;
  amount: number;
  category: 'income' | 'expense';
  tag: string;
  date: string;
  skipped: boolean;
}

interface RecurringGroup {
  merchant: string;
  tag: string;
  category: 'income' | 'expense';
  amount: number;
  interval: 'weekly' | 'biweekly' | 'monthly';
  transactionIds: string[];
  confirmed: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(raw: string): string | null {
  const clean = raw.trim();
  if (clean.match(/^(\d{4})-(\d{2})-(\d{2})$/)) return clean;
  const dmySlash = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlash) {
    const [, d, m, y] = dmySlash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const mdySlash = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdySlash) {
    const [, m, d, y] = mdySlash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const dmyDash = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) {
    const [, d, m, y] = dmyDash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const dmyDot = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmyDot) {
    const [, d, m, y] = dmyDot;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function threeMthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function detectInterval(dates: string[]): 'weekly' | 'biweekly' | 'monthly' | null {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86_400_000);
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg >= 5 && avg <= 10) return 'weekly';
  if (avg >= 11 && avg <= 20) return 'biweekly';
  if (avg >= 21 && avg <= 45) return 'monthly'; // wide — covers 28-31 day months + some drift
  return null;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ['upload', 'map', 'preview', 'recurring', 'done'];
  const current = step === 'importing' ? 'done' : step;
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full transition-colors ${
            i < idx ? 'bg-teal-500' : i === idx ? 'bg-brand-text dark:bg-white' : 'bg-brand-text/20 dark:bg-white/20'
          }`} />
          {i < steps.length - 1 && <div className="w-6 h-px bg-brand-text/15 dark:bg-white/15" />}
        </div>
      ))}
    </div>
  );
}

// ─── Shared classes ───────────────────────────────────────────────────────────

const selectCls = 'h-10 rounded-xl border border-brand-secondary/25 dark:border-white/15 bg-brand-bg dark:bg-[#042F2E] px-3 text-sm text-brand-text dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-transparent transition-all w-full';
const btnSecondary = 'flex-1 h-10 rounded-xl border border-brand-secondary/25 dark:border-white/15 text-sm text-brand-text/70 dark:text-white/70 hover:bg-brand-secondary/8 dark:hover:bg-white/5 transition-colors';
const btnPrimary = 'flex-1 h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2';

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImportShell() {
  const router = useRouter();
  const qc = useQueryClient();
  const t = useTranslations('import');
  const { allTags: allTagsMap } = useSettings();
  const { data: accounts = [] } = useAccounts();
  const allTags = Object.entries(allTagsMap).map(([id, v]) => ({ id, label: v.label, category: v.category }));

  const addTemplate = useSettingsStore((s) => s.addTemplate);

  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [colDate, setColDate] = useState('');
  const [colName, setColName] = useState('');
  const [colAmount, setColAmount] = useState('');
  const [colCategory, setColCategory] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [recurringGroups, setRecurringGroups] = useState<RecurringGroup[]>([]);
  const [categorising, setCategorising] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [savedTemplates, setSavedTemplates] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Step 1: Upload ─────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setError('');
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) { setError(t('errorEmpty')); return; }
        const hdrs = results.meta.fields ?? [];
        setHeaders(hdrs);
        setRows(results.data);
        const lower = hdrs.map((h) => h.toLowerCase());
        const find = (...terms: string[]) => hdrs[lower.findIndex((h) => terms.some((term) => h.includes(term)))] ?? '';
        setColDate(find('date'));
        setColName(find('description', 'merchant', 'payee', 'narrative', 'name'));
        setColAmount(find('amount', 'value', 'sum'));
        setColCategory(find('type', 'cr/dr', 'debit', 'credit', 'dc'));
        setStep('map');
      },
      error: () => setError(t('errorParse')),
    });
  }, [t]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ── Step 2: Map → parse (instant, no AI) ──────────────────────────────────
  const handleMap = () => {
    if (!colDate || !colName || !colAmount) { setError(t('errorMapRequired')); return; }
    setError('');
    const cutoff = threeMthsAgo();

    const parsed: ParsedTransaction[] = [];
    for (const row of rows) {
      const date = toYMD(row[colDate] ?? '');
      if (!date || date < cutoff) continue;

      const nameRaw = (row[colName] ?? '').trim().slice(0, 200);
      if (!nameRaw) continue;

      const amtStr = (row[colAmount] ?? '').trim().replace(/[^0-9.,\-]/g, '').replace(',', '.');
      const rawNum = parseFloat(amtStr);
      if (isNaN(rawNum) || rawNum === 0) continue;
      const amt = Math.abs(rawNum);

      let category: 'income' | 'expense';
      if (colCategory) {
        const v = (row[colCategory] ?? '').toLowerCase().trim();
        category = /^cr$|credit|^c$|^in$/.test(v) ? 'income' : 'expense';
      } else {
        category = rawNum >= 0 ? 'income' : 'expense';
      }

      parsed.push({ id: uid(), name: nameRaw, amount: amt, category, tag: 'other', date, skipped: false });
    }

    if (!parsed.length) { setError(t('errorNoRows')); return; }
    setTransactions(parsed);
    setStep('preview');
  };

  // ── AI auto-categorise (on demand from preview) ────────────────────────────
  const handleAutoCategorise = async () => {
    setCategorising(true);
    setError('');
    const uniqueMerchants = [...new Set(transactions.map((tx) => tx.name))];
    try {
      const res = await fetch('/api/import/categorise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants: uniqueMerchants, tags: allTags }),
      });
      if (!res.ok) throw new Error('API error');
      const { categorisations } = await res.json() as {
        categorisations: Record<string, { tag: string; category: string }>;
      };
      const normMap: Record<string, { tag: string; category: string }> = {};
      for (const [k, v] of Object.entries(categorisations)) {
        normMap[k.trim().toLowerCase()] = v;
      }
      setTransactions((prev) => prev.map((tx) => {
        const cat = normMap[tx.name.trim().toLowerCase()];
        return {
          ...tx,
          tag: cat?.tag ?? tx.tag,
          category: (cat?.category === 'income' || cat?.category === 'expense') ? cat.category : tx.category,
        };
      }));
    } catch {
      setError(t('errorCategorise'));
    } finally {
      setCategorising(false);
    }
  };

  // ── Step 3 → detect recurring ──────────────────────────────────────────────
  const handlePreviewNext = () => {
    const active = transactions.filter((tx) => !tx.skipped);

    // Group by merchant + category only (ignore tag — it may still be 'other')
    const groups: Record<string, ParsedTransaction[]> = {};
    for (const tx of active) {
      const key = `${tx.name}||${tx.category}`;
      (groups[key] ??= []).push(tx);
    }

    const detected: RecurringGroup[] = [];
    for (const [key, txs] of Object.entries(groups)) {
      if (txs.length < 2) continue;

      const amounts = txs.map((t) => t.amount);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      // Allow 20% tolerance — subscriptions can vary, and FX fluctuations happen
      if (!amounts.every((a) => avg === 0 || Math.abs(a - avg) / avg < 0.20)) continue;

      const interval = detectInterval(txs.map((t) => t.date));
      if (!interval) continue;

      const [merchant, category] = key.split('||');
      // Use the most common tag among the group's transactions
      const tagCounts: Record<string, number> = {};
      for (const tx of txs) tagCounts[tx.tag] = (tagCounts[tx.tag] ?? 0) + 1;
      const tag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0];

      detected.push({ merchant, tag, category: category as 'income' | 'expense', amount: avg, interval, transactionIds: txs.map((t) => t.id), confirmed: true });
    }

    setRecurringGroups(detected);
    if (detected.length > 0) {
      setStep('recurring');
    } else {
      doImport(active, []);
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const doImport = useCallback(async (txs: ParsedTransaction[], recurring: RecurringGroup[]) => {
    setStep('importing');
    const confirmedGroups = recurring.filter((g) => g.confirmed);
    const confirmedMerchants = new Set(confirmedGroups.map((g) => g.merchant));
    const oneOffs = txs.filter((tx) => !confirmedMerchants.has(tx.name));
    const total = confirmedGroups.length + oneOffs.length;
    setImportTotal(total);
    setImportProgress(0);

    let count = 0;
    const accountId = selectedAccountId || null;

    for (const group of confirmedGroups) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: group.merchant,
            amount: group.amount,
            category: group.category,
            type: 'recurring',
            tag: group.tag,
            frequency: group.interval,
            start_date: txs.filter((t) => group.transactionIds.includes(t.id)).map((t) => t.date).sort()[0],
            account_id: accountId,
          }),
        });
        if (res.ok) count++;
      } catch { /* continue */ }
      setImportProgress((p) => p + 1);
    }

    for (const tx of oneOffs) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tx.name,
            amount: tx.amount,
            category: tx.category,
            type: 'one_off',
            tag: tx.tag,
            date: tx.date,
            account_id: accountId,
          }),
        });
        if (res.ok) count++;
      } catch { /* continue */ }
      setImportProgress((p) => p + 1);
    }

    // Tell React Query the transactions cache is stale so the dashboard
    // shows the newly imported data immediately
    await qc.invalidateQueries({ queryKey: ['transactions'] });

    setImportedCount(count);
    setStep('done');
  }, [selectedAccountId, qc]);

  const handleRecurringNext = () => {
    doImport(transactions.filter((tx) => !tx.skipped), recurringGroups);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-brand-text dark:text-white mb-1">{t('title')}</h1>
      <p className="text-sm text-brand-text/50 dark:text-white/50 mb-6">{t('subtitle')}</p>

      <StepIndicator step={step} />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── STEP 1: Upload ── */}
      {step === 'upload' && (
        <div
          className="border-2 border-dashed border-brand-secondary/30 dark:border-white/15 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-teal-500/50 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <svg className="w-10 h-10 text-brand-text/30 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div className="text-center">
            <p className="font-semibold text-brand-text dark:text-white">{t('dropzone')}</p>
            <p className="text-sm text-brand-text/50 dark:text-white/50 mt-1">{t('dropzoneHint')}</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {/* ── STEP 2: Map columns ── */}
      {step === 'map' && (
        <div className="bg-brand-card dark:bg-white/[0.04] border border-brand-secondary/20 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-5">
          <p className="text-sm text-brand-text/60 dark:text-white/60">{t('mapHint', { count: rows.length })}</p>

          {accounts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-text/80 dark:text-white/80">{t('account')}</label>
              <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className={selectCls}>
                <option value="">{t('noAccount')}</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          {[
            { label: t('colDate'), value: colDate, set: setColDate, required: true },
            { label: t('colName'), value: colName, set: setColName, required: true },
            { label: t('colAmount'), value: colAmount, set: setColAmount, required: true },
            { label: t('colCategory'), value: colCategory, set: setColCategory, required: false },
          ].map(({ label, value, set, required }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-text/80 dark:text-white/80">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <select value={value} onChange={(e) => set(e.target.value)} className={selectCls}>
                <option value="">{t('colNone')}</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
          <div className="flex gap-3 mt-2">
            <button onClick={() => setStep('upload')} className={btnSecondary}>{t('back')}</button>
            <button onClick={handleMap} className={btnPrimary}>{t('next')}</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Preview ── */}
      {step === 'preview' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-brand-text/60 dark:text-white/60">{t('previewHint', { count: transactions.filter((tx) => !tx.skipped).length })}</p>
            <button
              onClick={handleAutoCategorise}
              disabled={categorising}
              className="flex-shrink-0 flex items-center gap-2 px-4 h-9 rounded-xl border border-teal-600/40 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-sm font-medium hover:bg-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {categorising ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
                  {t('categorising')}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  {t('autoCategorise')}
                </>
              )}
            </button>
          </div>
          <div className="bg-brand-card dark:bg-white/[0.04] border border-brand-secondary/20 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-teal-50 dark:bg-[#042F2E] border-b border-brand-secondary/20 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-brand-text/60 dark:text-white/60 w-8"></th>
                    <th className="px-4 py-2.5 text-left font-medium text-brand-text/60 dark:text-white/60">{t('colDate')}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-brand-text/60 dark:text-white/60">{t('colName')}</th>
                    <th className="px-4 py-2.5 text-right font-medium text-brand-text/60 dark:text-white/60">{t('colAmount')}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-brand-text/60 dark:text-white/60">{t('tag')}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-brand-text/60 dark:text-white/60">{t('type')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className={`border-b border-brand-secondary/10 dark:border-white/[0.06] last:border-0 ${tx.skipped ? 'opacity-30' : ''}`}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={!tx.skipped}
                          onChange={() => setTransactions((prev) => prev.map((p) => p.id === tx.id ? { ...p, skipped: !p.skipped } : p))}
                          className="accent-teal-600"
                        />
                      </td>
                      <td className="px-4 py-2 text-brand-text/60 dark:text-white/60 whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 py-2 text-brand-text dark:text-white max-w-[140px] truncate">{tx.name}</td>
                      <td className={`px-4 py-2 text-right font-mono whitespace-nowrap ${tx.category === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.category === 'income' ? '+' : '−'}{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={tx.tag}
                          onChange={(e) => setTransactions((prev) => prev.map((p) => p.id === tx.id ? { ...p, tag: e.target.value } : p))}
                          className="text-xs rounded-lg border border-brand-secondary/25 dark:border-white/15 bg-brand-bg dark:bg-[#042F2E] px-2 py-1 text-brand-text dark:text-white focus:outline-none max-w-[110px]"
                        >
                          {allTags.map((tg) => <option key={tg.id} value={tg.id}>{tg.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={tx.category}
                          onChange={(e) => setTransactions((prev) => prev.map((p) => p.id === tx.id ? { ...p, category: e.target.value as 'income' | 'expense' } : p))}
                          className="text-xs rounded-lg border border-brand-secondary/25 dark:border-white/15 bg-brand-bg dark:bg-[#042F2E] px-2 py-1 text-brand-text dark:text-white focus:outline-none"
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button
            onClick={() => setTransactions((prev) => prev.map((tx) => ({ ...tx, category: tx.category === 'income' ? 'expense' : 'income' })))}
            className="text-xs text-brand-text/40 dark:text-white/40 hover:text-brand-text/70 dark:hover:text-white/70 transition-colors text-left"
          >
            {t('flipAll')}
          </button>
          <div className="flex gap-3">
            <button onClick={() => setStep('map')} className={btnSecondary}>{t('back')}</button>
            <button onClick={handlePreviewNext} className={btnPrimary}>{t('next')}</button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Recurring suggestions ── */}
      {step === 'recurring' && (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {t('recurringHint', { count: recurringGroups.length })}
          </div>
          <div className="flex flex-col gap-3">
            {recurringGroups.map((g, i) => (
              <div key={i} className="bg-brand-card dark:bg-white/[0.04] border border-brand-secondary/20 dark:border-white/10 rounded-xl px-4 py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-text dark:text-white truncate">{g.merchant}</p>
                    <p className="text-xs text-brand-text/50 dark:text-white/50 mt-0.5">
                      {g.interval === 'weekly' ? t('weekly') : g.interval === 'biweekly' ? t('biweekly') : t('monthly')}
                      {' · '}{g.amount.toFixed(2)}
                      {' · '}{g.transactionIds.length}×
                    </p>
                  </div>
                  <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                    <span className="text-sm text-brand-text/70 dark:text-white/70">{t('setRecurring')}</span>
                    <input
                      type="checkbox"
                      checked={g.confirmed}
                      onChange={() => setRecurringGroups((prev) => prev.map((r, ri) => ri === i ? { ...r, confirmed: !r.confirmed } : r))}
                      className="accent-teal-600 w-4 h-4"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between border-t border-brand-secondary/10 dark:border-white/[0.06] pt-2.5">
                  <p className="text-xs text-brand-text/50 dark:text-white/50">{t('templateHint')}</p>
                  {savedTemplates.has(i) ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {t('templateSaved')}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        addTemplate({ name: g.merchant, amount: g.amount, category: g.category, type: 'recurring', tag: g.tag, frequency: g.interval });
                        setSavedTemplates((prev) => new Set([...prev, i]));
                      }}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors font-medium"
                    >
                      {t('saveTemplate')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('preview')} className={btnSecondary}>{t('back')}</button>
            <button onClick={handleRecurringNext} className={btnPrimary}>{t('importBtn')}</button>
          </div>
        </div>
      )}

      {/* ── Importing (progress) ── */}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-text/20 dark:border-white/20 border-t-teal-500 animate-spin" />
          <p className="text-brand-text dark:text-white font-medium">{t('importing')}</p>
          {importTotal > 0 && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-brand-text/50 dark:text-white/50 mb-1.5">
                <span>{importProgress} / {importTotal}</span>
                <span>{Math.round((importProgress / importTotal) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-brand-text/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all duration-200" style={{ width: `${(importProgress / importTotal) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-brand-text dark:text-white mb-1">{t('doneTitle')}</p>
          <p className="text-sm text-brand-text/50 dark:text-white/50 mb-6">{t('doneSubtitle', { count: importedCount })}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep('upload'); setRows([]); setTransactions([]); setRecurringGroups([]); setError(''); setImportedCount(0); }}
              className="px-5 h-10 rounded-xl border border-brand-secondary/25 dark:border-white/15 text-sm text-brand-text/70 dark:text-white/70 hover:bg-brand-secondary/8 dark:hover:bg-white/5 transition-colors"
            >
              {t('importAnother')}
            </button>
            <button onClick={() => router.push('/dashboard')} className="px-5 h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 transition-colors">
              {t('goToDashboard')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
