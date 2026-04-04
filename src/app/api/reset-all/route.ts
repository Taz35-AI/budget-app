import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

/**
 * DELETE /api/reset-all
 * Wipes all transactions, exceptions, balance resets, and cache for the household.
 */
export async function DELETE() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { householdId } = ctx;

    const supabase = createAdminClient();

    // Delete in order (exceptions cascade from transactions, but cache/resets are independent)
    const [txResult, resetResult, cacheResult] = await Promise.all([
      supabase.from('transactions').delete().eq('household_id', householdId),
      supabase.from('balance_resets').delete().eq('household_id', householdId),
      supabase.from('daily_balance_cache').delete().eq('household_id', householdId),
    ]);

    const errors = [txResult.error, resetResult.error, cacheResult.error].filter(Boolean);
    if (errors.length > 0) {
      console.error('[DELETE /api/reset-all] errors:', errors.map((e) => e!.message));
      return NextResponse.json({ error: errors[0]!.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/reset-all] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
