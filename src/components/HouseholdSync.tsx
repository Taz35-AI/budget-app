'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useHouseholdMembers } from '@/hooks/useHousehold';

export function HouseholdSync() {
  const qc = useQueryClient();
  const { data } = useHouseholdMembers();
  const householdId = data?.householdId;
  const memberCount = data?.members?.length ?? 0;

  useEffect(() => {
    if (!householdId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`household:${householdId}`)
      .on('broadcast', { event: 'data_changed' }, (msg) => {
        const table = msg.payload?.table;
        if (table === 'transactions' || table === 'transaction_exceptions') {
          qc.invalidateQueries({ queryKey: ['transactions'] });
        }
        if (table === 'balance_resets') {
          qc.invalidateQueries({ queryKey: ['balance-reset'] });
          qc.invalidateQueries({ queryKey: ['transactions'] });
        }
        if (table === 'budget_accounts') {
          qc.invalidateQueries({ queryKey: ['accounts'] });
        }
        if (table === 'household_members') {
          qc.invalidateQueries({ queryKey: ['household-members'] });
          qc.invalidateQueries({ queryKey: ['accounts'] });
          qc.invalidateQueries({ queryKey: ['transactions'] });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, memberCount, qc]);

  return null;
}
