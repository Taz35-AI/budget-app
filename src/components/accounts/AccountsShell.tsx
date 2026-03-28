'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useCurrency } from '@/hooks/useCurrency';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavMenuButton, MobileLogo } from '@/components/layout/NavSidebar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { AccountType } from '@/types';

const ACCOUNT_TYPES: { value: AccountType; label: string; color: string; icon: React.ReactNode }[] = [
  {
    value: 'checking',
    label: 'Checking',
    color: '#3b82f6',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    value: 'savings',
    label: 'Savings',
    color: '#10b981',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    value: 'investment',
    label: 'Investment',
    color: '#8b5cf6',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    value: 'credit',
    label: 'Credit Card',
    color: '#f59e0b',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

interface FormState {
  name: string;
  type: AccountType;
  balance: string;
  note: string;
}

const EMPTY: FormState = { name: '', type: 'checking', balance: '', note: '' };

export function AccountsShell() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useSettingsStore();
  const { formatAmount, symbol } = useCurrency();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');

  const netWorth = accounts.reduce(
    (sum, a) => (a.type === 'credit' ? sum - a.balance : sum + a.balance),
    0,
  );

  const grouped = ACCOUNT_TYPES.map((t) => ({
    ...t,
    items: accounts.filter((a) => a.type === t.value),
  })).filter((g) => g.items.length > 0);

  function openAdd() {
    setForm(EMPTY);
    setError('');
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(id: string) {
    const a = accounts.find((a) => a.id === id);
    if (!a) return;
    setForm({ name: a.name, type: a.type, balance: String(a.balance), note: a.note ?? '' });
    setError('');
    setEditingId(id);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    const bal = parseFloat(form.balance);
    if (isNaN(bal) || bal < 0) { setError('Enter a valid balance (0 or more)'); return; }
    const payload = { name: form.name.trim(), type: form.type, balance: bal, note: form.note.trim() || undefined };
    if (editingId) {
      updateAccount(editingId, payload);
    } else {
      addAccount(payload);
    }
    setShowForm(false);
    setEditingId(null);
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F7FAF9] dark:bg-[#0C1F1E]">
        {/* Ambient glow */}
        <div className="fixed top-0 inset-x-0 h-[480px] bg-gradient-to-b from-blue-100/50 via-indigo-50/20 to-transparent dark:from-blue-950/20 dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#0C1F1E]/85 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/[0.05]">
          <div className="px-4 sm:px-6 h-12 sm:h-14 flex items-center gap-3">
            <NavMenuButton />
            <MobileLogo />
            <h1 className="hidden lg:block text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Accounts</h1>
            <div className="ml-auto">
              <Button size="sm" onClick={openAdd}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add account
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-6 flex flex-col gap-5 max-w-2xl">
          {/* Net worth card */}
          <div className="bg-gradient-to-br from-[#16302F] to-[#0f3050] rounded-2xl p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Net Worth</p>
            <p className={cn('text-4xl font-extrabold tracking-tight', netWorth < 0 ? 'text-red-300' : 'text-white')}>
              {formatAmount(netWorth)}
            </p>
            <p className="text-xs text-white/40 mt-2">
              {accounts.length === 0
                ? 'Add accounts to track your net worth'
                : `Across ${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Add / Edit form */}
          {showForm && (
            <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-5 flex flex-col gap-4">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{editingId ? 'Edit account' : 'New account'}</p>

              {/* Type toggle */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Account type</p>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className={cn(
                        'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium',
                        form.type === t.value
                          ? 'border-transparent text-white'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20',
                      )}
                      style={form.type === t.value ? { backgroundColor: t.color } : undefined}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={form.type === t.value}
                        onChange={() => setForm((f) => ({ ...f, type: t.value }))}
                      />
                      <span style={form.type === t.value ? undefined : { color: t.color }}>{t.icon}</span>
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <Input
                id="acct-name"
                label="Account name"
                placeholder="e.g. Chase Checking"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(''); }}
              />
              <Input
                id="acct-balance"
                label="Current balance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                prefix={symbol}
                value={form.balance}
                onChange={(e) => { setForm((f) => ({ ...f, balance: e.target.value })); setError(''); }}
              />
              <Input
                id="acct-note"
                label="Note (optional)"
                placeholder="e.g. Main spending account"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSubmit}>{editingId ? 'Save changes' : 'Add account'}</Button>
                <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {accounts.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-white/60">No accounts yet</p>
              <p className="text-xs text-slate-400 dark:text-white/30">Add your bank accounts, savings, and investments</p>
            </div>
          )}

          {/* Account groups */}
          {grouped.map(({ value, label, color, icon, items }) => (
            <div key={value} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <span style={{ color }}>{icon}</span>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">{label}</p>
                <p className="text-xs text-slate-400 dark:text-white/30 ml-auto">
                  {value === 'credit' ? '−' : ''}{formatAmount(items.reduce((s, a) => s + a.balance, 0), { compact: true })}
                </p>
              </div>
              {items.map((acct) => (
                <div
                  key={acct.id}
                  className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-4 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                    <span style={{ color }}>{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{acct.name}</p>
                    {acct.note && <p className="text-xs text-slate-400 dark:text-white/30 truncate">{acct.note}</p>}
                  </div>
                  <p className={cn('text-sm font-extrabold tracking-tight flex-shrink-0', acct.type === 'credit' ? 'text-amber-500' : 'text-slate-900 dark:text-white')}>
                    {acct.type === 'credit' ? '−' : ''}{formatAmount(acct.balance)}
                  </p>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(acct.id)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteAccount(acct.id)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
