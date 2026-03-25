'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavStore } from '@/store/navStore';

// ─── Nav data ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const COMING_SOON = [
  {
    label: 'Reports',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Accounts',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: 'Budgets',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

// ─── Shared nav content ───────────────────────────────────────────────────────

function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center py-6 px-5 border-b border-slate-100 dark:border-white/[0.05] flex-shrink-0">
        <Link href="/dashboard" onClick={onLinkClick}>
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-2 ring-black/[0.06] dark:ring-white/10 hover:ring-indigo-300 dark:hover:ring-indigo-500/40 transition-all">
            <Image src="/budget-tool.png" alt="BudgetTool" width={80} height={80} className="w-full h-full object-cover" priority />
          </div>
        </Link>
      </div>

      {/* Primary nav */}
      <div className="px-4 pt-5 pb-1.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-white/25">Menu</p>
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/[0.12] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-white/80',
              )}
            >
              <span className={cn('flex-shrink-0', isActive ? 'text-indigo-500 dark:text-indigo-400' : '')}>
                {icon}
              </span>
              {label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 h-px bg-slate-100 dark:bg-white/[0.05]" />

      {/* Coming soon */}
      <div className="px-4 pb-1.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300 dark:text-white/15">Coming soon</p>
      </div>
      <div className="flex flex-col gap-0.5 px-3">
        {COMING_SOON.map(({ label, icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 dark:text-white/20 cursor-not-allowed select-none"
          >
            <span className="flex-shrink-0">{icon}</span>
            {label}
            <span className="ml-auto text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-300 dark:text-white/20">
              Soon
            </span>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="mt-auto px-5 py-4 border-t border-slate-100 dark:border-white/[0.05]">
        <p className="text-[10px] font-medium text-slate-300 dark:text-white/20">BudgetTool v1.0</p>
      </div>
    </>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

export function NavSidebar() {
  const { isOpen, close } = useNavStore();
  const pathname = usePathname();

  // Close mobile drawer on navigation
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* ── Desktop sidebar (lg+) ───────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex flex-col',
        'fixed left-0 top-0 h-full w-[220px] z-30',
        'bg-white dark:bg-[#0d1629]',
        'border-r border-slate-200/80 dark:border-white/[0.06]',
        'shadow-[1px_0_16px_rgba(0,0,0,0.04)] dark:shadow-[1px_0_0_rgba(255,255,255,0.04)]',
      )}>
        <NavContent />
      </aside>

      {/* ── Mobile drawer (< lg) ────────────────────────────────────── */}

      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col lg:hidden',
          'bg-white dark:bg-[#0d1629]',
          'shadow-[4px_0_32px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_32px_rgba(0,0,0,0.6)]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-all z-10"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <NavContent onLinkClick={close} />
      </div>
    </>
  );
}

// ─── Hamburger button (used in page headers) ──────────────────────────────────

export function NavMenuButton() {
  const { toggle } = useNavStore();
  return (
    <button
      onClick={toggle}
      className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-all flex-shrink-0"
      aria-label="Open menu"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
