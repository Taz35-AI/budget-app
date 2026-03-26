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
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/accounts',
    label: 'Accounts',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: '/budgets',
    label: 'Budgets',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ─── Shared nav content ───────────────────────────────────────────────────────

function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2.5 py-6 px-4 border-b border-[#1ECB6C]/10 flex-shrink-0">
        <Link href="/dashboard" onClick={onLinkClick}>
          <div className="w-[4.5rem] h-[4.5rem] rounded-2xl overflow-hidden
            shadow-[0_0_20px_rgba(30,203,108,0.2),0_0_0_1px_rgba(30,203,108,0.25)]
            hover:shadow-[0_0_28px_rgba(30,203,108,0.35),0_0_0_1px_rgba(30,203,108,0.45)]
            transition-all duration-300">
            <Image src="/budget-tool.png" alt="BudgetTool" width={72} height={72} className="w-full h-full object-cover" priority />
          </div>
        </Link>
        <div className="text-center">
          <p className="text-xs font-bold text-white/80 tracking-tight leading-none">BudgetTool</p>
          <p className="text-[9px] text-[#1ECB6C]/70 font-medium mt-0.5">Personal Finance</p>
        </div>
      </div>

      {/* Primary nav */}
      <div className="px-3 pt-5 pb-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#D1E3EE]/30 px-2">Menu</p>
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
                  ? 'bg-[#1ECB6C]/15 text-[#1ECB6C] shadow-[inset_0_0_0_1px_rgba(30,203,108,0.2)]'
                  : 'text-[#D1E3EE]/50 hover:bg-white/[0.06] hover:text-[#D1E3EE]/90',
              )}
            >
              <span className={cn('flex-shrink-0', isActive ? 'text-[#1ECB6C]' : '')}>
                {icon}
              </span>
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1ECB6C] shadow-[0_0_6px_rgba(30,203,108,0.8)] flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-5 py-4 border-t border-[#1ECB6C]/10">
        <p className="text-[10px] font-medium text-[#D1E3EE]/20">BudgetTool v1.0</p>
      </div>
    </div>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[230px] z-30
        bg-gradient-to-b from-[#1a4d8a] to-[#123968]
        border-r border-[#1ECB6C]/10
        shadow-[1px_0_20px_rgba(4,13,26,0.5)]">
        <NavContent />
      </aside>

      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-[#040d1a]/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
      />

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col lg:hidden',
          'bg-gradient-to-b from-[#1a4d8a] to-[#123968]',
          'shadow-[4px_0_40px_rgba(4,13,26,0.8)]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-[#D1E3EE]/40 hover:text-white transition-all z-10"
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

// ─── Hamburger button ─────────────────────────────────────────────────────────

export function NavMenuButton() {
  const { toggle } = useNavStore();
  return (
    <button
      onClick={toggle}
      className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl
        bg-[#154265]/10 dark:bg-white/5
        border border-[#154265]/20 dark:border-white/10
        text-[#154265] dark:text-white/50
        hover:bg-[#1ECB6C]/10 dark:hover:bg-white/10
        hover:text-[#1ECB6C] dark:hover:text-white
        hover:border-[#1ECB6C]/30
        transition-all flex-shrink-0"
      aria-label="Open menu"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
