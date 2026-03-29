import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (txError) {
      console.error('[GET /api/transactions] Supabase error:', txError.message, txError.code);
      return NextResponse.json({ error: txError.message, code: txError.code }, { status: 500 });
    }

    const txIds = transactions?.map((t) => t.id) ?? [];
    const exceptions = txIds.length > 0
      ? await supabase.from('transaction_exceptions').select('*').in('transaction_id', txIds)
      : { data: [], error: null };

    if (exceptions.error) {
      console.error('[GET /api/transactions] exceptions error:', exceptions.error.message);
    }

    return NextResponse.json({
      transactions: transactions ?? [],
      exceptions: exceptions.data ?? [],
    });
  } catch (error) {
    console.error('[GET /api/transactions] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const supabase = createAdminClient();

    const payload = {
      user_id: userId,
      account_id: body.account_id || null,
      parent_id: body.parent_id || null,
      name: body.name,
      amount: Number(body.amount),
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

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transactions] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
