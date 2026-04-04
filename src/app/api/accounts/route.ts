import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

/**
 * GET /api/accounts
 * Returns the household's accounts. Auto-creates a default "Main Account" if none exist,
 * and backfills any un-assigned transactions to it.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const supabase = createAdminClient();

    let { data: accounts, error } = await supabase
      .from('budget_accounts')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GET /api/accounts]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-create a default account if the household has none
    if (!accounts || accounts.length === 0) {
      const { data: created, error: createErr } = await supabase
        .from('budget_accounts')
        .insert({ user_id: userId, household_id: householdId, name: 'Main Account' })
        .select()
        .single();

      if (createErr) {
        console.error('[GET /api/accounts] auto-create error:', createErr.message);
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }

      accounts = [created];

      // Backfill any existing transactions that have no account_id
      await supabase
        .from('transactions')
        .update({ account_id: created.id })
        .eq('household_id', householdId)
        .is('account_id', null);

      // Backfill balance_resets too
      await supabase
        .from('balance_resets')
        .update({ account_id: created.id })
        .eq('household_id', householdId)
        .is('account_id', null);
    }

    return NextResponse.json({ accounts });
  } catch (err) {
    console.error('[GET /api/accounts] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/accounts
 * Body: { name: string }
 * Creates a new account. Max 5 per household.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const supabase = createAdminClient();
    const body = await req.json();
    const name = (body.name ?? '').trim().slice(0, 100);
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const validTypes = ['checking', 'savings', 'credit'];
    const type = validTypes.includes(body.type) ? body.type : 'checking';
    const credit_limit = type === 'credit' && body.credit_limit > 0 ? Number(body.credit_limit) : null;

    // Enforce max 5 accounts per household
    const { count } = await supabase
      .from('budget_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId);

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'Maximum of 5 accounts allowed' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('budget_accounts')
      .insert({ user_id: userId, household_id: householdId, name, type, credit_limit })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/accounts]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'accounts');
    return NextResponse.json({ account: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/accounts] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
