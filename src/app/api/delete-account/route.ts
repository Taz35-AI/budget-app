import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUserId } from '@/lib/auth';

export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();

  // Delete all user data first
  await supabase.from('transactions').delete().eq('user_id', userId);
  await supabase.from('transaction_exceptions').delete().eq('user_id', userId);
  await supabase.from('budget_accounts').delete().eq('user_id', userId);
  await supabase.from('balance_resets').delete().eq('user_id', userId);
  await supabase.from('user_settings').delete().eq('user_id', userId);

  // Delete the auth user (requires service role key)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
