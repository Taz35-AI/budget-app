'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Stage = 'loading' | 'form' | 'success' | 'invalid';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        setStage(error ? 'invalid' : 'form');
      });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStage('form');
    });

    const timer = setTimeout(() => {
      setStage((s) => (s === 'loading' ? 'invalid' : s));
    }, 3000);

    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Minimum 6 characters'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setSaving(false); }
    else { setStage('success'); setTimeout(() => router.push('/profile'), 2000); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d0d0d] px-4">
      <div className="w-full max-w-sm bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100 dark:border-white/[0.07] p-8 shadow-sm">

        {stage === 'loading' && (
          <p className="text-sm text-slate-400 dark:text-white/40 text-center">Verifying link…</p>
        )}

        {stage === 'invalid' && (
          <div className="text-center">
            <p className="text-slate-700 dark:text-white/70 font-semibold mb-2">Link expired or invalid</p>
            <p className="text-sm text-slate-400 dark:text-white/40 mb-5">Please request a new password reset link.</p>
            <button onClick={() => router.push('/login')} className="text-sm text-brand-primary hover:underline">
              Back to login
            </button>
          </div>
        )}

        {stage === 'form' && (
          <>
            <h1 className="text-xl font-black text-slate-800 dark:text-white mb-1">Set new password</h1>
            <p className="text-sm text-slate-400 dark:text-white/40 mb-6">Choose a strong password for your account.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Confirm password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={saving}
                className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Set password'}
              </button>
            </form>
          </>
        )}

        {stage === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-700 dark:text-white/70 font-semibold mb-1">Password updated</p>
            <p className="text-sm text-slate-400 dark:text-white/40">Redirecting you back…</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d0d0d]">
        <p className="text-sm text-slate-400 dark:text-white/40">Loading…</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
