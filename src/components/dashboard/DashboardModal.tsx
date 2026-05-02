'use client';

import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Small muted line under the title — accepts JSX so callers can compose formatted amounts. */
  subtitle?: ReactNode;
  /** Modal body — caller renders inputs, buttons, anything. */
  children: ReactNode;
}

/**
 * Shared dashboard modal shell.
 *
 * Backdrop + centered card + header (title/subtitle/close). The card is
 * full-width-with-margins on mobile and capped at 448px on sm+ screens so it
 * doesn't span an entire desktop viewport.
 *
 * Body content (form fields, action buttons, multi-step confirmations) is
 * passed via children — this component is intentionally a layout shell, not
 * a form wrapper.
 */
export function DashboardModal({ open, onClose, title, subtitle, children }: Props) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 native-backdrop" onClick={onClose} />
      <div
        className="fixed inset-x-4 top-24 z-50 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-white/85 dark:bg-[#0A1F1E]/92 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] border border-black/[0.06] dark:border-white/[0.1] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-2xl text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/8 active:scale-[0.90] transition-all duration-100 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
