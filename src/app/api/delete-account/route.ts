import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext, clearHouseholdCache } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

export async function DELETE() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userId, householdId } = ctx;

  const supabase = createAdminClient();

  // Other members must keep their shared data: only wipe household-wide data
  // when the leaver is the last member. Otherwise delete just the leaver's
  // own rows (transaction_exceptions cascade from transactions).
  const { count } = await supabase
    .from('household_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('household_id', householdId);
  const isLastMember = (count ?? 1) <= 1;

  if (isLastMember) {
    await supabase.from('transactions').delete().eq('household_id', householdId);
    await supabase.from('budget_accounts').delete().eq('household_id', householdId);
    await supabase.from('balance_resets').delete().eq('household_id', householdId);
    // Cascades to household_members and household_invites.
    await supabase.from('households').delete().eq('id', householdId);
  } else {
    await supabase.from('transactions').delete().eq('household_id', householdId).eq('user_id', userId);
    await supabase.from('budget_accounts').delete().eq('household_id', householdId).eq('user_id', userId);
    await supabase.from('balance_resets').delete().eq('household_id', householdId).eq('user_id', userId);
    await supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', userId);
  }

  await supabase.from('user_settings').delete().eq('user_id', userId);
  clearHouseholdCache(userId);

  // Delete the auth user (requires service role key)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!isLastMember) {
    await notifyHousehold(householdId, 'transactions');
  }

  return NextResponse.json({ ok: true });
}
