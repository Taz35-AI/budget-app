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
          bg-amber-500/95 dark:bg-amber-600/95 backdrop-blur-sm
          text-white text-xs font-semibold tracking-wide shadow-md">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          {tc('offlineBanner')}
        </div>
      )}

      {/* lg:pl-[230px] = sidebar width; pb-16 = mobile bottom nav height */}
      <div className="lg:pl-[230px] pb-16 lg:pb-0">
        {children}
      </div>
    </>
  );
}
