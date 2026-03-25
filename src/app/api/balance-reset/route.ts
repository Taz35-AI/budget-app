import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUserId } from '@/lib/auth';

export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const resetDate = format(new Date(), 'yyyy-MM-dd');

    // Delete any future cache from today forward (will be recomputed with new baseline)
    await supabase
      .from('daily_balance_cache')
      .delete()
      .eq('user_id', userId)
      .gte('date', resetDate);

    // Insert reset marker
    const { data, error } = await supabase
      .from('balance_resets')
      .insert({ user_id: userId, reset_date: resetDate })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ reset: data });
  } catch (error) {
    console.error('POST /api/balance-reset error:', error);
    return NextResponse.json({ error: 'Failed to reset balance' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('balance_resets')
      .select('*')
      .eq('user_id', userId)
      .order('reset_date', { ascending: false })
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ reset: data?.[0] ?? null });
  } catch (error) {
    console.error('GET /api/balance-reset error:', error);
    return NextResponse.json({ error: 'Failed to fetch reset' }, { status: 500 });
  }
}
