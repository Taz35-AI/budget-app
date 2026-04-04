import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';

export async function DELETE() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userId, householdId } = ctx;

  const supabase = createAdminClient();

  // Delete all household shared data
  await supabase.from('transactions').delete().eq('household_id', householdId);
  await supabase.from('transaction_exceptions').delete().eq('household_id', householdId);
  await supabase.from('budget_accounts').delete().eq('household_id', householdId);
  await supabase.from('balance_resets').delete().eq('household_id', householdId);
  await supabase.from('user_settings').delete().eq('user_id', userId);

  // Delete the auth user (requires service role key)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
