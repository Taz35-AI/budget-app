'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavStore } from '@/store/navStore';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { ResetAllButton } from '@/components/dashboard/ResetAllButton';
import { LogoutButton } from '@/components/dashboard/LogoutButton';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    bottomNav: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Reports',
    bottomNav: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/accounts',
    label: 'Accounts',
    bottomNav: false,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: '/budgets',
    label: 'Budgets',
    bottomNav: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    bottomNav: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((i) => i.bottomNav);

// ─── Sidebar content (shared between desktop sidebar + mobile drawer) ─────────

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center justify-center px-4 pt-4 pb-3 border-b border-white/[0.07] flex-shrink-0">
        <Link href="/dashboard" onClick={onLinkClick} className="block w-1/2">
          <Image src="/budget-tool.png" alt="Budget App" width={200} height={200} className="w-full h-auto object-contain" priority />
        </Link>
      </div>

      {/* Nav links */}
      <div className="px-2.5 pt-4 pb-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/20 px-2 mb-2">Menu</p>
      </div>
      <nav className="flex flex-col gap-0.5 px-2.5 flex-1">
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
                  ? 'bg-brand-primary text-white shadow-[0_2px_8px_rgba(59,122,120,0.4)]'
                  : 'text-white/45 hover:bg-white/[0.07] hover:text-white/90',
              )}
            >
              <span className="flex-shrink-0 opacity-90">{icon}</span>
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Utility section */}
      <div className="flex-shrink-0 px-2.5 pb-4 pt-3 border-t border-white/[0.07] space-y-1.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/20 px-2 mb-2">Options</p>

        {/* Theme toggle */}
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle />
          <span className="text-xs text-white/35 font-medium">Toggle theme</span>
        </div>

        {/* Export */}
        <div className="px-1 [&>button]:w-full [&>button]:justify-start">
          <ExportButton />
        </div>

        {/* Reset */}
        <div className="px-1 [&>button]:w-full [&>button]:justify-start [&>div]:w-full">
          <ResetAllButton />
        </div>

        {/* Logout */}
        <div className="px-1 [&>button]:w-full [&>button]:justify-start">
          <LogoutButton />
        </div>
      </div>

      {/* Version */}
      <div className="px-5 pb-3">
        <p className="text-[10px] font-medium text-white/15">Budget App v1.0</p>
      </div>
    </div>
  );
}

// ─── Main NavSidebar component ────────────────────────────────────────────────

export function NavSidebar() {
  const { isOpen, close } = useNavStore();
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { close(); }, [pathname, close]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* ── Desktop sidebar (always visible, left-fixed) ────────────── */}
      {/* Force dark class so sidebar always renders with dark styles */}
      <aside className="dark hidden lg:flex flex-col fixed left-0 top-0 h-full w-[230px] z-30
        bg-[#1e3a38]
        border-r border-white/[0.06]
        shadow-[2px_0_24px_rgba(12,31,30,0.35)]">
        <SidebarContent />
      </aside>

      {/* ── Mobile: backdrop ────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
      />

      {/* ── Mobile: slim left drawer ─────────────────────────────────── */}
      <div
        className={cn(
          'dark fixed inset-y-0 left-0 z-50 w-52 flex flex-col lg:hidden',
          'bg-[#1e3a38]',
          'shadow-[4px_0_32px_rgba(12,31,30,0.6)]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-white/30 hover:text-white transition-all z-10"
          aria-label="Close menu"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent onLinkClick={close} />
      </div>

      {/* ── Mobile: bottom tab bar ───────────────────────────────────── */}
      <MobileBottomNav />
    </>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 z-30
      bg-brand-card/97 dark:bg-[#1e3a38]/97
      backdrop-blur-xl
      border-t border-black/[0.07] dark:border-brand-primary/[0.15]
      shadow-[0_-2px_16px_rgba(22,48,47,0.08)]
      flex items-center justify-around px-1">
      {BOTTOM_NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]',
              isActive ? 'text-brand-primary' : 'text-brand-text/38 dark:text-white/32 hover:text-brand-primary',
            )}
          >
            <span className={cn('transition-transform duration-150', isActive && 'scale-110')}>{icon}</span>
            <span className={cn('text-[10px] font-semibold leading-none tracking-tight', isActive && 'font-bold')}>
              {label}
            </span>
            {isActive && (
              <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-brand-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── NavMenuButton — opens the left drawer on mobile (hidden on desktop) ──────

export function NavMenuButton() {
  const { toggle } = useNavStore();
  return (
    <button
      onClick={toggle}
      className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl
        bg-brand-primary/10 dark:bg-white/5
        border border-brand-primary/20 dark:border-white/10
        text-brand-primary dark:text-white/50
        hover:bg-brand-primary/20 hover:text-brand-primary
        transition-all flex-shrink-0"
      aria-label="Open menu"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

// ─── MobileLogo — centered logo shown in every page's mobile header ────────────

export function MobileLogo() {
  return (
    <div className="lg:hidden flex-shrink-0 pointer-events-none">
      <Image
        src="/budget-tool.png"
        alt="Budget App"
        width={360}
        height={144}
        className="h-[72px] w-auto"
        priority
      />
    </div>
  );
}
