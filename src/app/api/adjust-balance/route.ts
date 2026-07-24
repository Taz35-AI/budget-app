import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

/**
 * POST /api/adjust-balance
 * Body: { desiredBalance: number, currentBalance: number }
 *
 * Creates a one-off "Balance Adjustment" transaction for today
 * that bridges the gap between computed balance and the user's actual balance.
 * Shows in transaction lists as "User Adjustment".
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const { desiredBalance, currentBalance, accountId } = await req.json();

    const desired = Number(desiredBalance);
    const current = Number(currentBalance);
    if (!Number.isFinite(desired) || !Number.isFinite(current)) {
      return NextResponse.json({ error: 'Invalid balance values' }, { status: 400 });
    }

    const delta = desired - current;
    if (Math.abs(delta) > 999_999_999) {
      return NextResponse.json({ error: 'Adjustment too large' }, { status: 400 });
    }
    if (Math.abs(delta) < 0.01) {
      return NextResponse.json({ message: 'No adjustment needed' });
    }

    const supabase = createAdminClient();
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        household_id: householdId,
        created_by: userId,
        account_id: accountId || null,
        name: 'Balance Adjustment',
        amount: Math.round(Math.abs(delta) * 100) / 100,
        category: delta > 0 ? 'income' : 'expense',
        type: 'one_off',
        date: today,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/adjust-balance]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json({ transaction: data, delta });
  } catch (err) {
    console.error('[POST /api/adjust-balance] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
