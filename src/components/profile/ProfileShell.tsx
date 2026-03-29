'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">{label}</p>
      <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProfileShell() {
  const router = useRouter();
  const supabase = createClient();
  const { data: txData } = useTransactions();
  const { formatAmount } = useCurrency();

  const [user, setUser] = useState<User | null>(null);

  // Password change
  const [showPwForm, setShowPwForm] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  // Delete account
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-400 dark:text-white/30 text-sm">Loading…</p>
        </div>
      </AppLayout>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const fullName: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
  const email = user.email ?? '';
  const avatarUrl: string | undefined = user.user_metadata?.avatar_url;
  const displayName = fullName || email.split('@')[0];
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const isGoogle = user.app_metadata?.provider === 'google' ||
    (user.identities ?? []).some((id) => id.provider === 'google');
  const memberSince = user.created_at ? formatDate(user.created_at) : '—';

  const transactions = txData?.transactions ?? [];
  const totalIncome = transactions.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0);

  const recentTx = [...transactions]
    .sort((a, b) => {
      const da = a.date ?? a.start_date ?? '';
      const db = b.date ?? b.start_date ?? '';
      return db.localeCompare(da);
    })
    .slice(0, 5);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    if (newPw.length < 6) { setPwError('Minimum 6 characters'); return; }
    setPwStatus('loading');
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { setPwError(error.message); setPwStatus('error'); }
    else { setPwStatus('success'); setNewPw(''); setConfirmPw(''); setTimeout(() => { setPwStatus('idle'); setShowPwForm(false); }, 2000); }
  };

  const handleSetPasswordEmail = async () => {
    setPwStatus('loading');
    const base = window.location.hostname === 'localhost'
      ? 'https://budget-app-19qy.vercel.app'
      : window.location.origin;
    const redirectTo = `${base}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) { setPwError(error.message); setPwStatus('error'); }
    else { setPwStatus('success'); }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== email) { setDeleteError('Email does not match'); return; }
    setDeleteStep('deleting');
    const res = await fetch('/api/delete-account', { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error ?? 'Something went wrong');
      setDeleteStep('confirm');
      return;
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* ── Profile header ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-6 flex items-center gap-5 mb-4">
          <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden bg-brand-primary/30 flex items-center justify-center">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={64} height={64} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span className="text-xl font-black text-slate-600 dark:text-white/70">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white truncate">{displayName}</h1>
            <p className="text-sm text-slate-400 dark:text-white/40 truncate">{email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-slate-400 dark:text-white/30">Member since {memberSince}</span>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                isGoogle
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40',
              )}>
                {isGoogle ? 'Google' : 'Email'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Transactions" value={String(transactions.length)} />
          <StatCard label="All-time income" value={formatAmount(totalIncome, { compact: true })} />
          <StatCard label="All-time expenses" value={formatAmount(totalExpenses, { compact: true })} />
        </div>

        {/* ── Recent transactions ─────────────────────────────────────── */}
        {recentTx.length > 0 && (
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-5 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-3">Recent entries</p>
            <div className="flex flex-col divide-y divide-slate-50 dark:divide-white/[0.04]">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', tx.category === 'income' ? 'bg-emerald-400' : 'bg-red-400')} />
                    <span className="text-sm font-medium text-slate-700 dark:text-white/80 truncate">{tx.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-xs text-slate-400 dark:text-white/30">{tx.date ?? tx.start_date}</span>
                    <span className={cn('text-sm font-semibold tabular-nums', tx.category === 'income' ? 'text-emerald-500' : 'text-red-500')}>
                      {tx.category === 'income' ? '+' : '−'}{formatAmount(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Security ────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.06] p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-4">Security</p>

          {isGoogle && !showPwForm && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Set a password</p>
                <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">Allows you to also sign in with email + password</p>
              </div>
              {pwStatus === 'success' ? (
                <span className="text-xs font-semibold text-emerald-500">Email sent ✓</span>
              ) : (
                <button
                  onClick={handleSetPasswordEmail}
                  disabled={pwStatus === 'loading'}
                  className="h-8 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/70 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {pwStatus === 'loading' ? 'Sending…' : 'Send reset email'}
                </button>
              )}
            </div>
          )}

          {!isGoogle && !showPwForm && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Change password</p>
                <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">Update your login password</p>
              </div>
              <button
                onClick={() => setShowPwForm(true)}
                className="h-8 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/70 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                Change
              </button>
            </div>
          )}

          {showPwForm && (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
              {pwStatus === 'success' && <p className="text-xs text-emerald-500">Password updated ✓</p>}
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min. 6 characters)"
                required
                minLength={6}
                className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none focus:border-brand-primary/40 transition-all"
              />
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                required
                className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none focus:border-brand-primary/40 transition-all"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={pwStatus === 'loading'}
                  className="flex-1 h-9 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
                  {pwStatus === 'loading' ? 'Saving…' : 'Save password'}
                </button>
                <button type="button" onClick={() => { setShowPwForm(false); setPwError(''); setNewPw(''); setConfirmPw(''); }}
                  className="px-4 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60 text-sm font-semibold transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Danger zone ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-red-100 dark:border-red-500/20 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-4">Danger zone</p>

          {deleteStep === 'idle' && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Delete account</p>
                <p className="text-xs text-slate-400 dark:text-white/35 mt-0.5">Permanently removes your account and all data</p>
              </div>
              <button
                onClick={() => setDeleteStep('confirm')}
                className="h-8 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          )}

          {(deleteStep === 'confirm' || deleteStep === 'deleting') && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-600 dark:text-white/60">
                This will permanently delete your account and <strong className="text-red-500">all {transactions.length} transactions</strong>, settings, and accounts. This cannot be undone.
              </p>
              <p className="text-xs text-slate-500 dark:text-white/40">
                Type <span className="font-mono font-bold text-slate-700 dark:text-white/70">{email}</span> to confirm:
              </p>
              <input
                type="email"
                value={deleteInput}
                onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(''); }}
                placeholder={email}
                className="h-10 rounded-xl border border-red-200 dark:border-red-500/30 bg-white dark:bg-white/5 px-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-red-400 transition-all"
              />
              {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteStep === 'deleting' || deleteInput !== email}
                  className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteStep === 'deleting' ? 'Deleting…' : 'Delete my account'}
                </button>
                <button
                  onClick={() => { setDeleteStep('idle'); setDeleteInput(''); setDeleteError(''); }}
                  disabled={deleteStep === 'deleting'}
                  className="px-4 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
