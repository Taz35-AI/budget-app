'use client';

import { useTransactions } from '@/hooks/useTransactions';
import { TAGS, FREQUENCIES } from '@/lib/constants';

export function ExportButton() {
  const { data } = useTransactions();

  const handleExport = () => {
    if (!data?.transactions.length) return;

    const headers = ['Date', 'Name', 'Amount', 'Category', 'Tag', 'Type', 'Frequency', 'End Date'];

    const rows = data.transactions.map((tx) => [
      tx.date ?? tx.start_date ?? '',
      `"${tx.name.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      tx.category,
      tx.tag ? (TAGS[tx.tag]?.label ?? tx.tag) : '',
      tx.type === 'one_off' ? 'One-off' : 'Recurring',
      tx.frequency ? (FREQUENCIES[tx.frequency] ?? tx.frequency) : '',
      tx.end_date ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data?.transactions.length}
      className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 text-sm font-medium transition-all border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Export transactions as CSV"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span className="hidden sm:inline">Export</span>
    </button>
  );
}
