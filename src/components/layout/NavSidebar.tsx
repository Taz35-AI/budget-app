'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useNavStore } from '@/store/navStore';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { UserBadge } from '@/components/layout/UserBadge';
import { LogoutButton } from '@/components/dashboard/LogoutButton';

// ─── Nav items ────────────────────────────────────────────────────────────────

function getNavItems(t: ReturnType<typeof useTranslations<'nav'>>) {
  return [
    {
      href: '/dashboard',
      label: t('dashboard'),
      bottomNav: true,
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/reports',
      label: t('reports'),
      bottomNav: true,
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: '/accounts',
      label: t('accounts'),
      bottomNav: false,
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      href: '/budgets',
      label: t('budgets'),
      bottomNav: true,
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/import',
      label: t('import'),
      bottomNav: false,
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
    },
    {
      href: '/settings',
      label: t('settings'),
      bottomNav: true,
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
// Light mode: Teal 100 (#CCFBF1) bg — spec Option B (approved)
// Dark mode:  Teal 900 (#042F2E) bg — derived dark equivalent
// Active item: white card + 3px Teal 700 left indicator bar (per spec)

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const navItems = getNavItems(t);

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center justify-center px-4 pt-5 pb-4 flex-shrink-0">
        <Link href="/dashboard" onClick={onLinkClick} className="block w-1/2">
          <Image src="/spentum.png" alt="Spentum" width={200} height={200} className="w-full h-auto object-contain" priority />
        </Link>
      </div>

      {/* Menu section label */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[7px] font-semibold uppercase tracking-[0.09em] text-teal-700 dark:text-teal-400/70 px-2 mb-1">{t('menu')}</p>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 overflow-hidden',
                isActive
                  ? 'bg-white dark:bg-teal-700 text-teal-900 dark:text-white font-semibold shadow-sm'
                  : 'text-teal-900 dark:text-teal-400 font-medium hover:bg-white/70 dark:hover:bg-teal-700/30 hover:text-teal-900 dark:hover:text-teal-200',
              )}
            >
              {/* 3px active indicator bar — per spec */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-teal-700 dark:bg-teal-400 rounded-r-[3px]" />
              )}
              <span className="flex-shrink-0">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-2 h-px bg-teal-300/60 dark:bg-teal-700/50" />

      {/* Utility section */}
      <div className="flex-shrink-0 px-2 pb-4 pt-1 space-y-1">
        {/* Options label */}
        <p className="text-[7px] font-semibold uppercase tracking-[0.09em] text-teal-700 dark:text-teal-400/70 px-3 mb-2">{t('options')}</p>

        {/* Logged-in user */}
        <div className="px-1 mb-2">
          <UserBadge />
        </div>

        {/* Theme toggle */}
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle />
          <span className="text-xs text-teal-900 dark:text-teal-400 font-medium">{t('toggleTheme')}</span>
        </div>

        {/* Export */}
        <div className="px-1 [&>button]:w-full [&>button]:justify-start">
          <ExportButton />
        </div>

        {/* Logout */}
        <div className="px-1 [&>button]:w-full [&>button]:justify-start">
          <LogoutButton />
        </div>
      </div>

      {/* Version */}
      <div className="px-5 pb-4 border-t border-teal-300/60 dark:border-teal-700/50 pt-3">
        <p className="text-[10px] font-medium text-teal-700 dark:text-teal-400/50">Spentum v1.0</p>
      </div>
    </div>
  );
}

// ─── Main NavSidebar component ────────────────────────────────────────────────

export function NavSidebar() {
  const { isOpen, close } = useNavStore();
  const pathname = usePathname();

  useEffect(() => { close(); }, [pathname, close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      {/* Spec: bg #CCFBF1 (Teal 100), right border #99F6E4 (Teal 200), width 240px */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[240px] z-30
        bg-teal-100 dark:bg-teal-900
        border-r border-teal-200 dark:border-teal-700/50
        shadow-[2px_0_16px_rgba(4,47,46,0.06)] dark:shadow-[2px_0_16px_rgba(1,24,23,0.4)]">
        <SidebarContent />
      </aside>

      {/* ── Mobile: backdrop ────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
      />

      {/* ── Mobile: left drawer ──────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col lg:hidden',
          'bg-teal-100 dark:bg-teal-900',
          'shadow-[4px_0_24px_rgba(4,47,46,0.12)] dark:shadow-[4px_0_24px_rgba(1,24,23,0.6)]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-teal-200 dark:hover:bg-teal-700 text-teal-600 dark:text-teal-400 hover:text-teal-900 dark:hover:text-white transition-all z-10"
          aria-label="Close menu"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent onLinkClick={close} />
      </div>

      {/* ── Mobile: bottom tab bar ───────────────────────────────── */}
      <MobileBottomNav />
    </>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const bottomNavItems = getNavItems(t).filter((i) => i.bottomNav);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around px-1"
      style={{ height: '54px' }}>
      {/* Background */}
      <div className="absolute inset-0 bg-white/97 dark:bg-[#011817]/97 backdrop-blur-xl border-t border-teal-200 dark:border-teal-700/30 shadow-[0_-2px_16px_rgba(4,47,46,0.06)]" />
      {bottomNavItems.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px] z-10',
              isActive ? 'text-teal-700' : 'text-teal-600/60 dark:text-teal-400/50 hover:text-teal-700',
            )}
          >
            <span className={cn('transition-transform duration-150', isActive && 'scale-110')}>{icon}</span>
            <span className={cn('text-[10px] font-semibold leading-none tracking-tight', isActive && 'font-bold')}>
              {label}
            </span>
            {isActive && (
              <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-teal-700" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── NavMenuButton ────────────────────────────────────────────────────────────

export function NavMenuButton() {
  const { toggle } = useNavStore();
  return (
    <button
      onClick={toggle}
      className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl
        bg-teal-100 dark:bg-teal-900/50
        border border-teal-200 dark:border-teal-700/50
        text-teal-700 dark:text-teal-400
        hover:bg-teal-200 dark:hover:bg-teal-800 hover:text-teal-900
        transition-all flex-shrink-0"
      aria-label="Open menu"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

// ─── MobileLogo ───────────────────────────────────────────────────────────────

export function MobileLogo() {
  return (
    <div className="lg:hidden flex-shrink-0 pointer-events-none">
      <Image
        src="/spentum.png"
        alt="Spentum"
        width={360}
        height={144}
        className="h-[65px] w-auto"
        priority
      />
    </div>
  );
}
