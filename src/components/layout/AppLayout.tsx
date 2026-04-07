'use client';

import { useTranslations } from 'next-intl';
import { NavSidebar } from './NavSidebar';
import { useIsOnline } from '@/hooks/useIsOnline';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isOnline = useIsOnline();
  const tc = useTranslations('common');

  return (
    <>
      <NavSidebar />

      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-[999] flex items-center justify-center gap-2 px-4 py-2.5
          bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600
          backdrop-blur-sm
          text-white text-xs font-semibold tracking-wide
          shadow-[0_2px_12px_rgba(245,158,11,0.3)]">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          {tc('offlineBanner')}
        </div>
      )}

      {/* lg:pl-[250px] = sidebar width; pb-20 = mobile floating bottom nav height + spacing */}
      <div className="lg:pl-[250px] pb-20 lg:pb-0">
        {children}
      </div>
    </>
  );
}
