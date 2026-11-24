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
  const { count, error: countError } = await supabase
    .from('household_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('household_id', householdId);

  // The member count decides between "delete my rows" and "delete everyone's".
  // If it can't be read, the answer is unknown, and guessing "last member"
  // (as a `?? 1` default did) would erase a shared household's data for every
  // other member on a transient database error. Stop instead.
  if (countError || count === null) {
    console.error('[DELETE /api/delete-account] member count failed:', countError?.message);
    return NextResponse.json(
      { error: 'Could not verify household membership. Nothing was deleted; please try again.' },
      { status: 500 },
    );
  }
  const isLastMember = count <= 1;

  // Run the deletions in order and stop at the first failure. The auth user is
  // removed last and only if everything before it succeeded, so a failed
  // attempt leaves an account the person can still sign in to and retry from,
  // rather than orphaned data with no owner.
  const steps: Array<[string, () => PromiseLike<{ error: { message: string } | null }>]> = isLastMember
    ? [
        ['transactions', () => supabase.from('transactions').delete().eq('household_id', householdId)],
        ['budget_accounts', () => supabase.from('budget_accounts').delete().eq('household_id', householdId)],
        ['balance_resets', () => supabase.from('balance_resets').delete().eq('household_id', householdId)],
        // Cascades to household_members and household_invites.
        ['households', () => supabase.from('households').delete().eq('id', householdId)],
      ]
    : [
        ['transactions', () => supabase.from('transactions').delete().eq('household_id', householdId).eq('user_id', userId)],
        ['budget_accounts', () => supabase.from('budget_accounts').delete().eq('household_id', householdId).eq('user_id', userId)],
        ['balance_resets', () => supabase.from('balance_resets').delete().eq('household_id', householdId).eq('user_id', userId)],
        ['household_members', () => supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', userId)],
      ];
  steps.push(['user_settings', () => supabase.from('user_settings').delete().eq('user_id', userId)]);

  for (const [table, run] of steps) {
    const { error } = await run();
    if (error) {
      console.error(`[DELETE /api/delete-account] ${table} delete failed:`, error.message);
      clearHouseholdCache(userId);
      return NextResponse.json(
        { error: 'Account deletion did not complete. Please try again.' },
        { status: 500 },
      );
    }
  }

  clearHouseholdCache(userId);

  // Delete the auth user (requires service role key)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!isLastMember) {
    await notifyHousehold(householdId, 'transactions');
  }

  return NextResponse.json({ ok: true });
}
