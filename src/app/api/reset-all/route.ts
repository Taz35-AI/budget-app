import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUserId } from '@/lib/auth';

/**
 * DELETE /api/reset-all
 * Wipes all transactions, exceptions, balance resets, and cache for the authenticated user.
 */
export async function DELETE() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    // Delete in order (exceptions cascade from transactions, but cache/resets are independent)
    const [txResult, resetResult, cacheResult] = await Promise.all([
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('balance_resets').delete().eq('user_id', userId),
      supabase.from('daily_balance_cache').delete().eq('user_id', userId),
    ]);

    const errors = [txResult.error, resetResult.error, cacheResult.error].filter(Boolean);
    if (errors.length > 0) {
      console.error('[DELETE /api/reset-all] errors:', errors.map((e) => e!.message));
      return NextResponse.json({ error: errors[0]!.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/reset-all] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
