'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('nav');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 h-9 px-3 rounded-2xl transition-all duration-100 active:scale-[0.95] border border-brand-danger/15 dark:border-brand-danger/20 bg-brand-danger/6 dark:bg-brand-danger/10 text-brand-danger/70 dark:text-brand-danger/80 hover:bg-brand-danger/12 dark:hover:bg-brand-danger/18 hover:text-brand-danger text-sm font-bold"
      title="Sign out"
      aria-label="Sign out"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span>{t('logout')}</span>
    </button>
  );
}
