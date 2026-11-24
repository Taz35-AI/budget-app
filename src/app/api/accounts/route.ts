import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';
import { loadAccounts, LoadError } from '@/lib/dashboardData';

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

    const accounts = await loadAccounts(supabase, userId, householdId);
    return NextResponse.json({ accounts });
  } catch (err) {
    if (err instanceof LoadError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
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

    // Enforce max 10 accounts per household
    const { count } = await supabase
      .from('budget_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId);

    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: 'Maximum of 10 accounts allowed' }, { status: 400 });
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
