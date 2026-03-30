import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUserId } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fromAccountId, toAccountId, amount, date, expenseName, incomeName } = body;

    if (!fromAccountId || !toAccountId)
      return NextResponse.json({ error: 'Both accounts are required' }, { status: 400 });
    if (fromAccountId === toAccountId)
      return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0 || amt > 999_999_999)
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    if (!date)
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    const nameExpense = String(expenseName ?? 'Transfer').slice(0, 200);
    const nameIncome = String(incomeName ?? 'Transfer').slice(0, 200);

    const supabase = createAdminClient();
    const transferId = randomUUID();

    // Insert expense on source account
    const { data: expTx, error: expErr } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        account_id: fromAccountId,
        transfer_id: transferId,
        name: nameExpense,
        amount: amt,
        category: 'expense',
        type: 'one_off',
        date,
      })
      .select()
      .single();

    if (expErr) {
      console.error('[POST /api/transfers] expense insert error:', expErr.message);
      return NextResponse.json({ error: expErr.message }, { status: 500 });
    }

    // Insert income on destination account
    const { data: incTx, error: incErr } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        account_id: toAccountId,
        transfer_id: transferId,
        name: nameIncome,
        amount: amt,
        category: 'income',
        type: 'one_off',
        date,
      })
      .select()
      .single();

    if (incErr) {
      // Roll back the expense transaction
      await supabase.from('transactions').delete().eq('id', expTx.id);
      console.error('[POST /api/transfers] income insert error:', incErr.message);
      return NextResponse.json({ error: incErr.message }, { status: 500 });
    }

    return NextResponse.json({ expense: expTx, income: incTx }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transfers] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
