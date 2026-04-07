'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Opens a Supabase Realtime subscription so that any change to transactions
 * or transaction_exceptions in Postgres is immediately reflected on this device
 * without a manual refresh — regardless of which device made the change.
 *
 * Requires Realtime to be enabled for these tables in Supabase:
 *   Dashboard → Database → Replication → supabase_realtime publication
 *   → toggle on `transactions` and `transaction_exceptions`
 */
export function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // No per-row filters — avoids REPLICA IDENTITY requirement.
    // The API layer enforces RLS so each client only ever fetches its own data.
    channel = supabase
      .channel('realtime:transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          qc.invalidateQueries({ queryKey: ['transactions'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transaction_exceptions' },
        () => {
          qc.invalidateQueries({ queryKey: ['transactions'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'balance_resets' },
        () => {
          qc.invalidateQueries({ queryKey: ['balance-reset'] });
          qc.invalidateQueries({ queryKey: ['transactions'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'household_members' },
        () => {
          qc.invalidateQueries({ queryKey: ['household-members'] });
          qc.invalidateQueries({ queryKey: ['accounts'] });
          qc.invalidateQueries({ queryKey: ['transactions'] });
        },
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  return <>{children}</>;
}
