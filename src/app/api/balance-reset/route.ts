import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const body = await req.json().catch(() => ({}));
    const accountId: string | null = body.accountId ?? null;

    const supabase = createAdminClient();
    const resetDate = format(new Date(), 'yyyy-MM-dd');

    // Delete any future cache from today forward (will be recomputed with new baseline)
    await supabase
      .from('daily_balance_cache')
      .delete()
      .eq('household_id', householdId)
      .gte('date', resetDate);

    // Insert reset marker (per-account or global)
    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      household_id: householdId,
      created_by: userId,
      reset_date: resetDate,
      account_id: accountId,
    };

    const { data, error } = await supabase
      .from('balance_resets')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    await notifyHousehold(householdId, 'balance_resets');
    return NextResponse.json({ reset: data });
  } catch (error) {
    console.error('POST /api/balance-reset error:', error);
    return NextResponse.json({ error: 'Failed to reset balance' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { householdId } = ctx;

    const accountId = req.nextUrl.searchParams.get('accountId');

    const supabase = createAdminClient();

    let query = supabase
      .from('balance_resets')
      .select('*')
      .eq('household_id', householdId)
      .order('reset_date', { ascending: false })
      .limit(1);

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ reset: data?.[0] ?? null });
  } catch (error) {
    console.error('GET /api/balance-reset error:', error);
    return NextResponse.json({ error: 'Failed to fetch reset' }, { status: 500 });
  }
}
