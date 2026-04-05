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
            'native-card rounded-3xl overflow-hidden',
            'border-l-4 border-l-teal-500 dark:border-l-teal-400',
          )}
        >
          {/* Family illustration band */}
          <div className="bg-gradient-to-r from-teal-50 via-teal-100/60 to-transparent dark:from-teal-900/25 dark:via-teal-800/15 dark:to-transparent px-4 pt-3 pb-2 flex items-center justify-center">
            <img src="/shared-household.svg" alt="" aria-hidden className="w-full max-w-[220px] h-auto" />
          </div>
          {/* Invitation content */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-white/[0.06]">
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
