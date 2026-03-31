'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { CurrencySelector } from './CurrencySelector';
import { ExportButton } from './ExportButton';
import { ResetAllButton } from './ResetAllButton';
import type { CurrencyCode } from '@/types';

interface Props {
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
}

export function HeaderOverflowMenu({ currency, onCurrencyChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
        aria-label="More options"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#15152E] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden min-w-[220px]">
          {/* Theme row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
            <span className="text-sm text-slate-600 dark:text-white/60 font-medium">Theme</span>
            <ThemeToggle />
          </div>

          {/* Currency row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
            <span className="text-sm text-slate-600 dark:text-white/60 font-medium">Currency</span>
            <CurrencySelector value={currency} onChange={(v) => { onCurrencyChange(v); }} />
          </div>

          {/* Export */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06]">
            <ExportButton />
          </div>

          {/* Reset */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06]">
            <ResetAllButton />
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>
      )}
    </div>
  );
}
