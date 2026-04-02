'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/hooks/useSettings';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'map' | 'preview' | 'recurring' | 'done';

interface RawRow {
  [key: string]: string;
}

interface ParsedTransaction {
  id: string;
  name: string;
  amount: number;
  category: 'income' | 'expense';
  tag: string;
  date: string; // YYYY-MM-DD
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
  // Try common date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD.MM.YYYY
  const clean = raw.trim();
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return clean;
  const dmySlash = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlash) {
    const [, d, m, y] = dmySlash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const mdySlash = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdySlash) {
    // ambiguous — prefer DD/MM
    const [, a, b, y] = mdySlash;
    return `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
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
  // Try JS Date as last resort
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
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
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86_400_000;
    gaps.push(diff);
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg >= 5 && avg <= 9) return 'weekly';
  if (avg >= 12 && avg <= 17) return 'biweekly';
  if (avg >= 25 && avg <= 35) return 'monthly';
  return null;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ['upload', 'map', 'preview', 'recurring', 'done'];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.slice(0, -1).map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              i < idx ? 'bg-teal-400' : i === idx ? 'bg-white' : 'bg-white/20'
            }`}
          />
          {i < steps.length - 2 && <div className="w-6 h-px bg-white/15" />}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImportShell() {
  const router = useRouter();
  const t = useTranslations('import');
  const { allTags: allTagsMap } = useSettings();

  // Convert to array for Claude API + selects
  const allTags = Object.entries(allTagsMap).map(([id, v]) => ({ id, label: v.label, category: v.category }));

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [colDate, setColDate] = useState('');
  const [colName, setColName] = useState('');
  const [colAmount, setColAmount] = useState('');
  const [colCategory, setColCategory] = useState(''); // optional debit/credit column
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [recurringGroups, setRecurringGroups] = useState<RecurringGroup[]>([]);
  const [categorising, setCategorising] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
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
        // Auto-detect columns
        const lower = hdrs.map((h) => h.toLowerCase());
        const dateCol = hdrs[lower.findIndex((h) => h.includes('date'))] ?? '';
        const nameCol = hdrs[lower.findIndex((h) => h.includes('description') || h.includes('merchant') || h.includes('name') || h.includes('payee'))] ?? '';
        const amtCol = hdrs[lower.findIndex((h) => h.includes('amount') || h.includes('value') || h.includes('sum'))] ?? '';
        const catCol = hdrs[lower.findIndex((h) => h.includes('debit') || h.includes('credit') || h.includes('type'))] ?? '';
        setColDate(dateCol);
        setColName(nameCol);
        setColAmount(amtCol);
        setColCategory(catCol);
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

  // ── Step 2: Map → Step 3 build & categorise ────────────────────────────────
  const handleMap = async () => {
    if (!colDate || !colName || !colAmount) { setError(t('errorMapRequired')); return; }
    setError('');
    const cutoff = threeMthsAgo();

    const parsed: ParsedTransaction[] = [];
    for (const row of rows) {
      const dateRaw = row[colDate] ?? '';
      const date = toYMD(dateRaw);
      if (!date || date < cutoff) continue; // skip out of range

      const nameRaw = (row[colName] ?? '').trim().slice(0, 200);
      if (!nameRaw) continue;

      const amtRaw = (row[colAmount] ?? '').replace(/[^0-9.\-,]/g, '').replace(',', '.');
      const amt = Math.abs(parseFloat(amtRaw));
      if (isNaN(amt)) continue;

      // Determine category: if a debit/credit column exists, use it; else infer from sign
      let category: 'income' | 'expense' = 'expense';
      if (colCategory) {
        const catVal = (row[colCategory] ?? '').toLowerCase();
        if (catVal.includes('credit') || catVal.includes('income') || catVal.includes('in')) {
          category = 'income';
        }
      } else {
        const rawNum = parseFloat((row[colAmount] ?? '').replace(/[^0-9.\-]/g, ''));
        if (!isNaN(rawNum) && rawNum > 0 && !amtRaw.startsWith('-')) {
          // If the raw amount is positive and there's no sign, check if bank uses +/- convention
          // Default to expense (most transactions in bank statements are debits)
          category = 'expense';
        }
        if (rawNum > 0) category = 'expense';
        if (rawNum < 0) category = 'income'; // refunds/income shown as negative debits in some banks
      }

      parsed.push({ id: uid(), name: nameRaw, amount: amt, category, tag: 'other', date, skipped: false });
    }

    if (!parsed.length) { setError(t('errorNoRows')); return; }

    // Batch categorise unique merchants
    setCategorising(true);
    const uniqueMerchants = [...new Set(parsed.map((p) => p.name))];
    try {
      const res = await fetch('/api/import/categorise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants: uniqueMerchants, tags: allTags }),
      });
      if (res.ok) {
        const { categorisations } = await res.json();
        for (const tx of parsed) {
          const cat = categorisations[tx.name];
          if (cat?.tag) tx.tag = cat.tag;
          if (cat?.category === 'income' || cat?.category === 'expense') tx.category = cat.category;
        }
      }
    } catch {
      // Non-fatal — continue with defaults
    } finally {
      setCategorising(false);
    }

    setTransactions(parsed);
    setStep('preview');
  };

  // ── Step 3 → detect recurring ──────────────────────────────────────────────
  const handlePreviewNext = () => {
    const active = transactions.filter((tx) => !tx.skipped);
    // Group by merchant + category + tag + similar amount
    const groups: Record<string, ParsedTransaction[]> = {};
    for (const tx of active) {
      const key = `${tx.name}||${tx.category}||${tx.tag}`;
      (groups[key] ??= []).push(tx);
    }
    const detected: RecurringGroup[] = [];
    for (const [key, txs] of Object.entries(groups)) {
      if (txs.length < 2) continue;
      const amounts = txs.map((t) => t.amount);
      const avgAmt = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const allClose = amounts.every((a) => Math.abs(a - avgAmt) / avgAmt < 0.05);
      if (!allClose) continue;
      const interval = detectInterval(txs.map((t) => t.date));
      if (!interval) continue;
      const [merchant, category, tag] = key.split('||');
      detected.push({
        merchant,
        tag,
        category: category as 'income' | 'expense',
        amount: avgAmt,
        interval,
        transactionIds: txs.map((t) => t.id),
        confirmed: true,
      });
    }
    setRecurringGroups(detected);
    setStep(detected.length > 0 ? 'recurring' : 'done');
    if (detected.length === 0) doImport(active, []);
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const doImport = useCallback(async (
    txs: ParsedTransaction[],
    recurring: RecurringGroup[],
  ) => {
    setImporting(true);
    let count = 0;
    const confirmedRecurringMerchants = new Set(
      recurring.filter((g) => g.confirmed).map((g) => g.merchant),
    );

    // Import confirmed recurring groups as recurring transactions
    for (const group of recurring.filter((g) => g.confirmed)) {
      try {
        await fetch('/api/transactions', {
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
          }),
        });
        count++;
      } catch { /* continue */ }
    }

    // Import remaining as one_off (skip merchants promoted to recurring)
    for (const tx of txs) {
      if (confirmedRecurringMerchants.has(tx.name)) continue;
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tx.name,
            amount: tx.amount,
            category: tx.category,
            type: 'one_off',
            tag: tx.tag,
            date: tx.date,
          }),
        });
        count++;
      } catch { /* continue */ }
    }

    setImportedCount(count);
    setImporting(false);
    setStep('done');
  }, []);

  const handleRecurringNext = () => {
    const active = transactions.filter((tx) => !tx.skipped);
    doImport(active, recurringGroups);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-foreground mb-1">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('subtitle')}</p>

      <StepIndicator step={step} />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── STEP 1: Upload ── */}
      {step === 'upload' && (
        <div
          className="border-2 border-dashed border-white/15 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-teal-400/40 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div className="text-center">
            <p className="font-medium text-foreground">{t('dropzone')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('dropzoneHint')}</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {/* ── STEP 2: Map columns ── */}
      {step === 'map' && (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5">
          <p className="text-sm text-muted-foreground">{t('mapHint', { count: rows.length })}</p>
          {[
            { label: t('colDate'), value: colDate, set: setColDate, required: true },
            { label: t('colName'), value: colName, set: setColName, required: true },
            { label: t('colAmount'), value: colAmount, set: setColAmount, required: true },
            { label: t('colCategory'), value: colCategory, set: setColCategory, required: false },
          ].map(({ label, value, set, required }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground/70">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="">{t('colNone')}</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
          <div className="flex gap-3 mt-2">
            <button onClick={() => setStep('upload')} className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">
              {t('back')}
            </button>
            <button
              onClick={handleMap}
              disabled={categorising}
              className="flex-1 h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {categorising && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {categorising ? t('categorising') : t('next')}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Preview ── */}
      {step === 'preview' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t('previewHint', { count: transactions.filter((t) => !t.skipped).length })}</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-8"></th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t('colDate')}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t('colName')}</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">{t('colAmount')}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t('tag')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className={`border-b border-border/50 last:border-0 ${tx.skipped ? 'opacity-35' : ''}`}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={!tx.skipped}
                          onChange={() => setTransactions((prev) =>
                            prev.map((p) => p.id === tx.id ? { ...p, skipped: !p.skipped } : p)
                          )}
                          className="accent-teal-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 py-2 text-foreground max-w-[160px] truncate">{tx.name}</td>
                      <td className={`px-4 py-2 text-right font-mono whitespace-nowrap ${tx.category === 'income' ? 'text-emerald-400' : 'text-foreground'}`}>
                        {tx.category === 'income' ? '+' : '−'}{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={tx.tag}
                          onChange={(e) => setTransactions((prev) =>
                            prev.map((p) => p.id === tx.id ? { ...p, tag: e.target.value } : p)
                          )}
                          className="text-xs rounded-lg border border-border bg-background px-2 py-1 text-foreground focus:outline-none max-w-[110px]"
                        >
                          {allTags.map((tg) => <option key={tg.id} value={tg.id}>{tg.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('map')} className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">
              {t('back')}
            </button>
            <button
              onClick={handlePreviewNext}
              className="flex-1 h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 transition-colors"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Recurring suggestions ── */}
      {step === 'recurring' && (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-300">
            {t('recurringHint', { count: recurringGroups.length })}
          </div>
          <div className="flex flex-col gap-3">
            {recurringGroups.map((g, i) => (
              <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{g.merchant}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {g.interval === 'weekly' ? t('weekly') : g.interval === 'biweekly' ? t('biweekly') : t('monthly')}
                    {' · '}{g.amount.toFixed(2)}
                    {' · '}{g.transactionIds.length}×
                  </p>
                </div>
                <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                  <span className="text-sm text-muted-foreground">{t('setRecurring')}</span>
                  <input
                    type="checkbox"
                    checked={g.confirmed}
                    onChange={() => setRecurringGroups((prev) =>
                      prev.map((r, ri) => ri === i ? { ...r, confirmed: !r.confirmed } : r)
                    )}
                    className="accent-teal-500 w-4 h-4"
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('preview')} className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">
              {t('back')}
            </button>
            <button
              onClick={handleRecurringNext}
              disabled={importing}
              className="flex-1 h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {importing && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {importing ? t('importing') : t('importBtn')}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Done ── */}
      {step === 'done' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">{t('doneTitle')}</p>
          <p className="text-sm text-muted-foreground mb-6">{t('doneSubtitle', { count: importedCount })}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep('upload'); setRows([]); setTransactions([]); setRecurringGroups([]); setError(''); }}
              className="px-5 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors"
            >
              {t('importAnother')}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 transition-colors"
            >
              {t('goToDashboard')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
