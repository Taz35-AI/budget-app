'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/hooks/useSettings';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
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

/**
 * Parse a bank date string into YYYY-MM-DD. Handles ISO, plus slash/dash/dot
 * separated forms. When the two numbers are ambiguous (both ≤ 12), defaults
 * to day-first (dd/mm/yyyy). If one of them is > 12 the format is inferred
 * unambiguously — so "13/04/2025" → 13 Apr and "04/13/2025" → 13 Apr.
 */
function toYMD(raw: string): string | null {
  const clean = raw.trim();
  if (clean.match(/^(\d{4})-(\d{2})-(\d{2})$/)) return clean;
  const sep = clean.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (sep) {
    const [, aStr, bStr, y] = sep;
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    let d: number, m: number;
    if (a > 12) { d = a; m = b; }
    else if (b > 12) { m = a; d = b; }
    else { d = a; m = b; } // ambiguous → default to day-first
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
  // Reject noisy sequences: every gap must be within 40% of the average.
  // Without this, runs like [3, 45, 3, 45] average to 24 and get called 'monthly'.
  if (avg === 0) return null;
  for (const gap of gaps) {
    if (Math.abs(gap - avg) / avg > 0.4) return null;
  }
  if (avg >= 5 && avg <= 10) return 'weekly';
  if (avg >= 11 && avg <= 20) return 'biweekly';
  if (avg >= 21 && avg <= 45) return 'monthly'; // wide — covers 28-31 day months + some drift
  return null;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

/**
 * Builds a lookup of normalized merchant name → most-common (tag, category)
 * from the user's existing transactions. Used to auto-tag new imports using
 * the user's own prior choices — no AI round-trip needed for merchants the
 * user has already categorised.
 */
interface HistoryMatch { tag: string; category: 'income' | 'expense' }
function buildHistoryTagMap(
  transactions: Array<{ name?: string | null; tag?: string | null; category: 'income' | 'expense' }>,
): Record<string, HistoryMatch> {
  const buckets: Record<string, Record<string, { count: number; category: 'income' | 'expense' }>> = {};
  for (const tx of transactions) {
    if (!tx.name || !tx.tag) continue;
    const key = normalizeMerchant(tx.name);
    if (!key) continue;
    const tagKey = `${tx.tag}|${tx.category}`;
    const bucket = buckets[key] ?? (buckets[key] = {});
    const entry = bucket[tagKey] ?? { count: 0, category: tx.category };
    entry.count += 1;
    bucket[tagKey] = entry;
  }
  const out: Record<string, HistoryMatch> = {};
  for (const [key, bucket] of Object.entries(buckets)) {
    let best: { tag: string; category: 'income' | 'expense'; count: number } | null = null;
    for (const [tagKey, { count, category }] of Object.entries(bucket)) {
      const tag = tagKey.split('|')[0];
      if (!best || count > best.count) best = { tag, category, count };
    }
    if (best) out[key] = { tag: best.tag, category: best.category };
  }
  return out;
}

/**
 * Strips bank-statement noise from a merchant name so that entries like
 * "NETFLIX.COM 12345" and "NETFLIX.COM 67890" resolve to the same key.
 * Only used for grouping — the original name is kept for display.
 */
function normalizeMerchant(name: string): string {
  let s = name.toUpperCase().trim();
  // Remove trailing pure-digit references (e.g. card transaction IDs)
  s = s.replace(/\s+\d{4,}$/, '');
  // Remove REF: / REF / TXN / ID patterns
  s = s.replace(/\s*(REF[:\s#]|TXN[:\s]|TRANS[:\s]|ID[:\s])\S+$/i, '');
  // Remove trailing hash codes (#1234, *1234)
  s = s.replace(/[\s*#\/]+\w{4,}$/, '');
  // Collapse internal whitespace and trim
  s = s.replace(/\s{2,}/g, ' ').trim();
  // Drop trailing punctuation
  s = s.replace(/[^A-Z0-9]+$/, '').trim();
  return s || name.toUpperCase().trim();
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

const selectCls = 'h-11 rounded-2xl border border-brand-secondary/25 dark:border-white/15 bg-brand-bg dark:bg-[#042F2E] px-3 text-sm text-brand-text dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-transparent transition-all w-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] [&>option]:bg-white [&>option]:text-brand-text dark:[&>option]:bg-[#042F2E] dark:[&>option]:text-white';
const btnSecondary = 'flex-1 h-11 rounded-2xl border border-brand-secondary/25 dark:border-white/15 text-sm text-brand-text/70 dark:text-white/70 hover:bg-brand-secondary/8 dark:hover:bg-white/5 active:scale-[0.96] transition-all duration-100';
const btnPrimary = 'flex-1 h-11 rounded-2xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] transition-all duration-100 flex items-center justify-center gap-2';

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImportShell() {
  const router = useRouter();
  const qc = useQueryClient();
  const t = useTranslations('import');
  const { allTags: allTagsMap } = useSettings();
  const { data: accounts = [] } = useAccounts();
  const { data: txData } = useTransactions();
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
  const [importErrorCount, setImportErrorCount] = useState(0);
  const [importDupCount, setImportDupCount] = useState(0);
  const [importError, setImportError] = useState('');
  const [importBatchId, setImportBatchId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [undone, setUndone] = useState(false);
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

    // Default tag: prefer 'other' if available, else the first expense tag we find.
    // Prevents orphaned tag IDs if the user deleted/hid the 'other' builtin.
    const defaultTag =
      allTagsMap['other']
        ? 'other'
        : allTags.find((tg) => tg.category === 'expense' || tg.category === 'both')?.id
        ?? allTags[0]?.id
        ?? '';

    // Pre-tag from the user's own prior choices. Free — no AI round-trip needed
    // for merchants they have already categorised in past transactions.
    const historyMap = buildHistoryTagMap(txData?.transactions ?? []);

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

      // Apply historical match if we have one, overriding the parsed category
      const historyHit = historyMap[normalizeMerchant(nameRaw)];
      const finalTag = historyHit?.tag ?? defaultTag;
      const finalCategory = historyHit?.category ?? category;
      parsed.push({ id: uid(), name: nameRaw, amount: amt, category: finalCategory, tag: finalTag, date, skipped: false });
    }

    if (!parsed.length) { setError(t('errorNoRows')); return; }
    setTransactions(parsed);
    setStep('preview');
  };

  // ── AI auto-categorise (on demand from preview) ────────────────────────────
  const handleAutoCategorise = async () => {
    setCategorising(true);
    setError('');
    // Only send merchants that weren't already matched from the user's history.
    // Those rows still carry the default tag, so we filter by tag === defaultTag.
    const historyMap = buildHistoryTagMap(txData?.transactions ?? []);
    const uniqueMerchants = [...new Set(
      transactions
        .filter((tx) => !historyMap[normalizeMerchant(tx.name)])
        .map((tx) => tx.name),
    )];
    if (uniqueMerchants.length === 0) {
      setCategorising(false);
      return;
    }
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

    // Group by normalised merchant + category (strips trailing refs/IDs from bank names)
    const groups: Record<string, ParsedTransaction[]> = {};
    for (const tx of active) {
      const key = `${normalizeMerchant(tx.name)}||${tx.category}`;
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

      const [normName, category] = key.split('||');
      // Use the most common tag among the group's transactions
      const tagCounts: Record<string, number> = {};
      for (const tx of txs) tagCounts[tx.tag] = (tagCounts[tx.tag] ?? 0) + 1;
      const tag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0];
      // Use the most common raw merchant name (shortest = least noise) as display name
      const merchant = txs.map((t) => t.name).sort((a, b) => a.length - b.length)[0];

      detected.push({ merchant: merchant ?? normName, tag, category: category as 'income' | 'expense', amount: avg, interval, transactionIds: txs.map((t) => t.id), confirmed: true });
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
    const confirmedMerchantNorms = new Set(confirmedGroups.map((g) => normalizeMerchant(g.merchant)));
    const oneOffs = txs.filter((tx) => !confirmedMerchantNorms.has(normalizeMerchant(tx.name)));
    const accountId = selectedAccountId || null;

    // Build a flat array of all rows — single network call to the bulk endpoint
    const rows = [
      ...confirmedGroups.map((group) => ({
        name: group.merchant,
        amount: group.amount,
        category: group.category,
        type: 'recurring',
        tag: group.tag,
        frequency: group.interval,
        start_date: txs.filter((t) => group.transactionIds.includes(t.id)).map((t) => t.date).sort()[0],
        account_id: accountId,
      })),
      ...oneOffs.map((tx) => ({
        name: tx.name,
        amount: tx.amount,
        category: tx.category,
        type: 'one_off',
        tag: tx.tag,
        date: tx.date,
        account_id: accountId,
      })),
    ];

    let count = 0;
    let errorCount = 0;
    let dupCount = 0;
    let batchId: string | null = null;
    let errMessage = '';
    try {
      const res = await fetch('/api/import/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: rows }),
      });
      const data = await res.json() as { inserted?: number; errors?: number; duplicates?: number; batchId?: string | null; error?: string };
      if (res.ok) {
        count = data.inserted ?? 0;
        errorCount = data.errors ?? 0;
        dupCount = data.duplicates ?? 0;
        batchId = data.batchId ?? null;
      } else {
        errMessage = data.error ?? `HTTP ${res.status}`;
      }
    } catch (err) {
      errMessage = err instanceof Error ? err.message : String(err);
    }

    // Tell React Query the transactions cache is stale so the dashboard
    // shows the newly imported data immediately
    await qc.invalidateQueries({ queryKey: ['transactions'] });

    setImportedCount(count);
    setImportErrorCount(errorCount);
    setImportDupCount(dupCount);
    setImportBatchId(batchId);
    setUndone(false);
    setImportError(errMessage);
    setStep('done');
  }, [selectedAccountId, qc]);

  const handleRecurringNext = () => {
    doImport(transactions.filter((tx) => !tx.skipped), recurringGroups);
  };

  const handleUndo = async () => {
    if (!importBatchId || undoing) return;
    setUndoing(true);
    try {
      const res = await fetch('/api/import/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: importBatchId }),
      });
      if (res.ok) {
        await qc.invalidateQueries({ queryKey: ['transactions'] });
        setUndone(true);
      }
    } finally {
      setUndoing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-brand-text dark:text-white mb-1">{t('title')}</h1>
      <p className="text-sm text-brand-text/50 dark:text-white/50 mb-6">{t('subtitle')}</p>

      <StepIndicator step={step} />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── STEP 1: Upload ── */}
      {step === 'upload' && (
        <div
          className="border-2 border-dashed border-brand-secondary/30 dark:border-white/15 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-teal-500/50 transition-colors"
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
        <div className="bg-brand-card dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 flex flex-col gap-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
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
          ].map(({ label, value, set, required }) => {
            // Pull up to 3 non-empty sample values from the selected column
            const samples = value
              ? rows.map((r) => (r[value] ?? '').trim()).filter(Boolean).slice(0, 3)
              : [];
            return (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-text/80 dark:text-white/80">
                  {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <select value={value} onChange={(e) => set(e.target.value)} className={selectCls}>
                  <option value="">{t('colNone')}</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                {samples.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-text/35 dark:text-white/25">
                      {t('sampleLabel')}
                    </span>
                    {samples.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-brand-secondary/10 dark:bg-white/[0.06] text-[11px] font-mono text-brand-text/70 dark:text-white/65 max-w-[160px] truncate"
                        title={s}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
              className="flex-shrink-0 flex items-center gap-2 px-4 h-10 rounded-2xl border border-teal-600/40 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-sm font-bold hover:bg-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] transition-all duration-100"
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
          {/* Desktop: table view */}
          <div className="hidden sm:block bg-brand-card dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
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
                          className="text-xs rounded-lg border border-brand-secondary/25 dark:border-white/15 bg-brand-bg dark:bg-[#042F2E] px-2 py-1 text-brand-text dark:text-white focus:outline-none max-w-[110px] [&>option]:bg-white [&>option]:text-brand-text dark:[&>option]:bg-[#042F2E] dark:[&>option]:text-white"
                        >
                          {allTags.map((tg) => <option key={tg.id} value={tg.id}>{tg.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={tx.category}
                          onChange={(e) => setTransactions((prev) => prev.map((p) => p.id === tx.id ? { ...p, category: e.target.value as 'income' | 'expense' } : p))}
                          className="text-xs rounded-lg border border-brand-secondary/25 dark:border-white/15 bg-brand-bg dark:bg-[#042F2E] px-2 py-1 text-brand-text dark:text-white focus:outline-none [&>option]:bg-white [&>option]:text-brand-text dark:[&>option]:bg-[#042F2E] dark:[&>option]:text-white"
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

          {/* Mobile: card list */}
          <div className="sm:hidden flex flex-col gap-2 max-h-[60dvh] overflow-y-auto pb-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-brand-card dark:bg-white/[0.04] px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] ${tx.skipped ? 'opacity-40' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={!tx.skipped}
                    onChange={() => setTransactions((prev) => prev.map((p) => p.id === tx.id ? { ...p, skipped: !p.skipped } : p))}
                    className="accent-teal-600 mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-brand-text dark:text-white truncate">{tx.name}</p>
                      <p className={`text-sm font-bold font-mono tabular-nums whitespace-nowrap flex-shrink-0 ${tx.category === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.category === 'income' ? '+' : '−'}{tx.amount.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-[11px] text-brand-text/50 dark:text-white/50 mt-0.5">{tx.date}</p>
                    <div className="flex gap-1.5 mt-2">
                      <select
                        value={tx.tag}
                        onChange={(e) => setTransactions((prev) => prev.map((p) => p.id === tx.id ? { ...p, tag: e.target.value } : p))}
                        className="flex-1 min-w-0 text-xs rounded-lg border border-brand-secondary/25 dark:border-white/15 bg-brand-bg dark:bg-[#042F2E] px-2 py-1 text-brand-text dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/40 truncate [&>option]:bg-white [&>option]:text-brand-text dark:[&>option]:bg-[#042F2E] dark:[&>option]:text-white"
                      >
                        {allTags.map((tg) => <option key={tg.id} value={tg.id}>{tg.label}</option>)}
                      </select>
                      <select
                        value={tx.category}
                        onChange={(e) => setTransactions((prev) => prev.map((p) => p.id === tx.id ? { ...p, category: e.target.value as 'income' | 'expense' } : p))}
                        className="flex-shrink-0 text-xs rounded-lg border border-brand-secondary/25 dark:border-white/15 bg-brand-bg dark:bg-[#042F2E] px-2 py-1 text-brand-text dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/40 [&>option]:bg-white [&>option]:text-brand-text dark:[&>option]:bg-[#042F2E] dark:[&>option]:text-white"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {t('recurringHint', { count: recurringGroups.length })}
          </div>
          <div className="flex flex-col gap-3">
            {recurringGroups.map((g, i) => (
              <div key={i} className="bg-brand-card dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl px-4 py-3 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={g.merchant}
                      onChange={(e) => setRecurringGroups((prev) => prev.map((r, ri) => ri === i ? { ...r, merchant: e.target.value } : r))}
                      aria-label={t('recurringNameLabel')}
                      className="w-full font-semibold text-brand-text dark:text-white bg-transparent border border-transparent hover:border-brand-primary/20 focus:border-brand-primary/40 focus:bg-white dark:focus:bg-white/[0.04] rounded-lg px-2 -mx-2 py-0.5 outline-none transition-colors truncate"
                    />
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

      {/* ── Importing (spinner) ── */}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-text/20 dark:border-white/20 border-t-teal-500 animate-spin" />
          <p className="text-brand-text dark:text-white font-medium">{t('importing')}</p>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div className="text-center py-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${importError ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
            {importError ? (
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className="text-lg font-semibold text-brand-text dark:text-white mb-1">
            {undone ? t('undoneTitle') : importError ? t('errorImport') : t('doneTitle')}
          </p>
          {importError ? (
            <div className="text-sm text-red-500 dark:text-red-400 mb-6 max-w-md mx-auto break-words">
              {importError}
            </div>
          ) : undone ? (
            <p className="text-sm text-brand-text/50 dark:text-white/50 mb-6">
              {t('undoneSubtitle', { count: importedCount })}
            </p>
          ) : (
            <p className="text-sm text-brand-text/50 dark:text-white/50 mb-6">
              {t('doneSubtitle', { count: importedCount })}
              {importDupCount > 0 && ` · ${t('doneDuplicates', { count: importDupCount })}`}
              {importErrorCount > 0 && ` · ${t('doneSkipped', { count: importErrorCount })}`}
            </p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            {importBatchId && importedCount > 0 && !undone && (
              <button
                onClick={handleUndo}
                disabled={undoing}
                className="px-5 h-11 rounded-2xl border border-red-500/30 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-[0.96] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {undoing ? '…' : t('undoImport')}
              </button>
            )}
            <button
              onClick={() => { setStep('upload'); setRows([]); setTransactions([]); setRecurringGroups([]); setError(''); setImportedCount(0); setImportErrorCount(0); setImportDupCount(0); setImportError(''); setImportBatchId(null); setUndone(false); }}
              className="px-5 h-11 rounded-2xl border border-brand-secondary/25 dark:border-white/15 text-sm text-brand-text/70 dark:text-white/70 hover:bg-brand-secondary/8 dark:hover:bg-white/5 active:scale-[0.96] transition-all duration-100"
            >
              {t('importAnother')}
            </button>
            <button onClick={() => router.push('/dashboard')} className="px-5 h-11 rounded-2xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-500 active:scale-[0.96] transition-all duration-100">
              {t('goToDashboard')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
