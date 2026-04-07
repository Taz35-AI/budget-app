'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const redirectTo = window.location.hostname === 'localhost'
      ? 'https://spentum.com/auth/callback'
      : `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#042F2E] via-[#0A1F1E] to-[#0F3332] flex flex-col items-center justify-center px-4">
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(13,148,136,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative w-full max-w-sm text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(22,163,74,0.2)]">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-display">Check your email</h2>
          <p className="text-sm text-teal-300/50 mb-6">
            We sent a confirmation link to <span className="text-white font-medium">{email}</span>. Click it to activate your account.
          </p>
          <Link href="/login" className="text-sm text-teal-300/40 hover:text-teal-300 underline active:opacity-70 transition-all duration-200">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#042F2E] via-[#0A1F1E] to-[#0F3332] flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(13,148,136,0.15)_0%,transparent_70%)] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(94,234,212,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Image src="/spentum.png" alt="Spentum" width={200} height={200} className="w-44 h-auto object-contain" priority />
          <p className="text-sm text-teal-300/50 font-display">Create your account</p>
        </div>

        {/* Card */}
        <div className="relative bg-white dark:bg-[#0F3332] rounded-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-white/10">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-12 rounded-full bg-white/80 dark:bg-white/[0.06] border border-white/80 dark:border-white/[0.1] text-brand-text dark:text-white text-sm font-semibold hover:bg-white dark:hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.97] backdrop-blur-sm font-display"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand-primary/15 to-transparent" />
            <span className="text-xs text-brand-text/30 dark:text-white/25 font-display">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand-primary/15 to-transparent" />
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="px-4 py-3 rounded-2xl bg-brand-danger/10 border border-brand-danger/20 text-sm text-brand-danger">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-text/50 dark:text-white/40 font-display">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="h-12 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.04] px-4 text-sm font-medium text-brand-text dark:text-white placeholder:text-brand-text/30 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30 transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-text/50 dark:text-white/40 font-display">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="h-12 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.04] px-4 text-sm font-medium text-brand-text dark:text-white placeholder:text-brand-text/30 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30 transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-sm font-semibold hover:shadow-[0_4px_20px_rgba(13,148,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-1 shadow-[0_2px_12px_rgba(13,148,136,0.3)] active:scale-[0.97] font-display"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-teal-300/40 mt-5 font-display">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-300 hover:text-teal-200 underline transition-colors">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-teal-400/30 mt-3">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="hover:text-teal-300 transition-colors underline">Terms</Link>
          {' and '}
          <Link href="/privacy" className="hover:text-teal-300 transition-colors underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
