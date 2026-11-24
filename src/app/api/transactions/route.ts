import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';
import { loadTransactions, LoadError } from '@/lib/dashboardData';

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { householdId } = ctx;

    const supabase = createAdminClient();

    return NextResponse.json(await loadTransactions(supabase, householdId));
  } catch (error) {
    if (error instanceof LoadError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
    console.error('[GET /api/transactions] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const body = await req.json();
    const supabase = createAdminClient();

    const VALID_CATEGORIES = ['income', 'expense'];
    const VALID_TYPES = ['one_off', 'recurring'];
    const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

    const name = String(body.name ?? '').trim().slice(0, 200);
    const amount = Number(body.amount);
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!VALID_CATEGORIES.includes(body.category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    if (!VALID_TYPES.includes(body.type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    // The table requires amount > 0; reject zero here with a 400 rather than
    // letting the insert fail with a database error.
    if (isNaN(amount) || amount <= 0 || amount > 999_999_999) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    if (body.frequency && !VALID_FREQUENCIES.includes(body.frequency)) return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });

    const payload = {
      user_id: userId,
      household_id: householdId,
      created_by: userId,
      account_id: body.account_id || null,
      parent_id: body.parent_id || null,
      name,
      amount,
      category: body.category,
      type: body.type,
      tag: body.tag || null,
      date: body.date || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      frequency: body.frequency || null,
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/transactions] Supabase error:', error.message, error.code, error.details);
      return NextResponse.json(
        { error: error.message, code: error.code, hint: error.hint },
        { status: error.code === '42501' ? 403 : 500 },
      );
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transactions] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
