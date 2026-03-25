'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useResetBalance } from '@/hooks/useResetBalance';

export function ResetBalanceButton() {
  const [confirming, setConfirming] = useState(false);
  const { mutate, isPending } = useResetBalance();

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 hidden sm:inline">Reset from today?</span>
        <Button
          size="sm"
          variant="danger"
          loading={isPending}
          onClick={() => {
            mutate(undefined, { onSuccess: () => setConfirming(false) });
          }}
        >
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => setConfirming(true)}
      className="gap-1.5"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Reset Balance
    </Button>
  );
}
