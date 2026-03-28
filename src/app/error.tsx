'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[BudgetTool error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0C1F1E] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-sm text-white/40 mb-8 max-w-xs">
        An unexpected error occurred. Try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="h-9 px-4 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="h-9 px-4 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors inline-flex items-center"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
