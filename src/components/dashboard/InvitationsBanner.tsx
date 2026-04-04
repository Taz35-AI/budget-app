'use client';

import { useTranslations } from 'next-intl';
import { usePendingInvites, useAcceptInvite } from '@/hooks/useHousehold';
import { cn } from '@/lib/utils';

export function InvitationsBanner() {
  const t = useTranslations('sharing');
  const { data: invites, isLoading } = usePendingInvites();
  const acceptMutation = useAcceptInvite();

  if (isLoading || !invites?.length) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {invites.map((inv) => (
        <div
          key={inv.id}
          className={cn(
            'native-card rounded-3xl p-4 overflow-hidden',
            'border-l-4 border-l-indigo-500 dark:border-l-indigo-400',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 dark:text-white/75 leading-snug">
                <span className="font-semibold text-slate-900 dark:text-white">{inv.inviter_name ?? 'Someone'}</span>
                {' '}{t('invitationFrom')}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={() => acceptMutation.mutate({ token: inv.token, mergeData: true })}
                disabled={acceptMutation.isPending}
                className="h-8 px-3.5 rounded-2xl text-xs font-semibold bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-400 active:scale-[0.96] transition-all duration-100 disabled:opacity-50"
              >
                {t('acceptInvitation')}
              </button>
              <button
                className="h-8 px-3.5 rounded-2xl text-xs font-semibold text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/8 active:scale-[0.96] transition-all duration-100"
              >
                {t('declineInvitation')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
