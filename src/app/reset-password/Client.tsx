'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Stage = 'loading' | 'form' | 'success' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // /auth/confirm verified the token_hash server-side and set a session cookie.
    // Just check if the user is present — if yes, show the form.
    supabase.auth.getUser().then(({ data: { user } }) => {
      setStage(user ? 'form' : 'invalid');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Minimum 6 characters'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      setStage('success');
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#011817] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Image src="/spentum.png" alt="Spentum" width={200} height={200} className="w-44 h-auto object-contain" priority />
          <p className="text-sm text-white/40">
            {stage === 'form' ? 'Choose a new password' : stage === 'success' ? 'All done' : 'Reset password'}
          </p>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">

          {stage === 'loading' && (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              <p className="text-sm text-white/40">Verifying link…</p>
            </div>
          )}

          {stage === 'invalid' && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-white/80 font-semibold mb-1">Link expired or invalid</p>
              <p className="text-sm text-white/40 mb-5">Request a new password reset link and try again.</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full h-10 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-all"
              >
                Back to sign in
              </button>
            </div>
          )}

          {stage === 'form' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  autoFocus
                  className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/60">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1"
              >
                {saving ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}

          {stage === 'success' && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white/80 font-semibold mb-1">Password updated</p>
              <p className="text-sm text-white/40">Taking you to your dashboard…</p>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          <Link href="/terms" className="hover:text-white/70 underline transition-colors">Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-white/70 underline transition-colors">Privacy</Link>
        </p>
      </div>
    </div>
  );
}

