'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAcceptInvite } from '@/hooks/useHousehold';

export default function InviteClient() {
  const t = useTranslations('invite');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const acceptInvite = useAcceptInvite();

  const [displayName, setDisplayName] = useState('');
  const [mergeData, setMergeData] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#011817]">
        <div className="rounded-3xl bg-[#0a2e2d] p-8 text-center text-white shadow-xl">
          <p className="text-lg">{t('invalidLink')}</p>
        </div>
      </div>
    );
  }

  async function handleAccept() {
    setStatus('loading');
    setErrorMsg('');

    try {
      await acceptInvite.mutateAsync({
        token: token!,
        displayName: displayName.trim(),
        mergeData,
      });
      setStatus('success');
      // Hard navigation (not router.push) destroys the entire React Query
      // cache so the dashboard fetches everything fresh for the new household.
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : t('genericError'));
    }
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#011817]">
        <div className="w-full max-w-md rounded-3xl bg-[#0a2e2d] p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">{t('successTitle')}</h2>
          <p className="mt-2 text-sm text-gray-400">{t('redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#011817] px-4">
      <div className="w-full max-w-md rounded-3xl bg-[#0a2e2d] p-8 shadow-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20">
            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-400">{t('subtitle')}</p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Display name */}
          <div>
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-gray-300">
              {t('yourName')}
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full rounded-xl border border-gray-600 bg-[#011817] px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Merge data toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-600 bg-[#011817] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{t('bringData')}</p>
              <p className="text-xs text-gray-400">{t('bringDataDesc')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={mergeData}
              onClick={() => setMergeData(!mergeData)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                mergeData ? 'bg-indigo-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  mergeData ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Error */}
          {status === 'error' && errorMsg && (
            <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleAccept}
            disabled={status === 'loading'}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {status === 'loading' ? t('accepting') : t('acceptButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
