import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { householdId } = ctx;

    const supabase = createAdminClient();

    // Both queries run in parallel. Exceptions are scoped to the household
    // through an inner join on their parent transaction rather than an
    // `in (every transaction id)` filter: that needed the first query to
    // finish before the second could start, and put every id in the request
    // URL, which stops working once a household has a few thousand rows.
    const [txResult, excResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false }),
      supabase
        .from('transaction_exceptions')
        .select('*, transactions!inner(household_id)')
        .eq('transactions.household_id', householdId),
    ]);

    const { data: transactions, error: txError } = txResult;
    if (txError) {
      console.error('[GET /api/transactions] Supabase error:', txError.message, txError.code);
      return NextResponse.json({ error: txError.message, code: txError.code }, { status: 500 });
    }

    if (excResult.error) {
      console.error('[GET /api/transactions] exceptions error:', excResult.error.message);
    }

    // Drop the join column so the payload keeps its original shape.
    const exceptions = (excResult.data ?? []).map((row) => {
      const { transactions: _parent, ...exception } = row;
      void _parent;
      return exception;
    });

    return NextResponse.json({
      transactions: transactions ?? [],
      exceptions,
    });
  } catch (error) {
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
    if (isNaN(amount) || amount < 0 || amount > 999_999_999) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
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
