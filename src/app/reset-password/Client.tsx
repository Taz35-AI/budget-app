'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { authErrorKey } from '@/lib/authErrors';

type Stage = 'loading' | 'form' | 'success' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const tAuth = useTranslations('auth');
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
    if (password !== confirm) { setError(tAuth('passwordsDoNotMatch')); return; }
    if (password.length < 6) { setError(tAuth('minSixCharacters')); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(tAuth(authErrorKey(error)));
      setSaving(false);
    } else {
      setStage('success');
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FDFB] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Image src="/spentum.png" alt="Spentum" width={200} height={200} className="w-44 h-auto object-contain" priority />
          <p className="text-sm text-slate-500">
            {stage === 'form' ? tAuth('chooseNewPassword') : stage === 'success' ? tAuth('allDone') : tAuth('resetPassword')}
          </p>
        </div>

        <div className="bg-white border border-brand-primary/[0.08] rounded-3xl p-7 shadow-[0_4px_24px_rgba(13,148,136,0.08)]">

          {stage === 'loading' && (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              <p className="text-sm text-slate-500">{tAuth('verifyingLink')}</p>
            </div>
          )}

          {stage === 'invalid' && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-slate-900 font-semibold mb-1">{tAuth('linkExpired')}</p>
              <p className="text-sm text-slate-500 mb-5">{tAuth('linkExpiredDesc')}</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full h-12 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:bg-[#0F766E] transition-all duration-100 shadow-[0_2px_8px_rgba(13,148,136,0.25)] active:scale-[0.97] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
              >
                {tAuth('backToSignIn')}
              </button>
            </div>
          )}

          {stage === 'form' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div role="alert" className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-password" className="text-sm font-semibold text-slate-600">{tAuth('newPassword')}</label>
                <PasswordInput
                  id="reset-password"
                  name="new-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  autoFocus
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-transparent transition-all duration-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-confirm" className="text-sm font-semibold text-slate-600">{tAuth('confirmPassword')}</label>
                <PasswordInput
                  id="reset-confirm"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-transparent transition-all duration-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="h-12 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:bg-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 mt-1 shadow-[0_2px_8px_rgba(13,148,136,0.25)] active:scale-[0.97] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
              >
                {saving ? tAuth('saving') : tAuth('setNewPassword')}
              </button>
            </form>
          )}

          {stage === 'success' && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-900 font-semibold mb-1">{tAuth('passwordUpdated')}</p>
              <p className="text-sm text-slate-500">{tAuth('takingYouToDashboard')}</p>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          <Link href="/terms" className="hover:text-slate-700 underline transition-colors">{tAuth('terms')}</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-slate-700 underline transition-colors">{tAuth('privacy')}</Link>
        </p>
      </div>
    </div>
  );
}

