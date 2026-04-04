import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const body = await req.json();
    const { fromAccountId, toAccountId, amount, txType, date, startDate, frequency, expenseName, incomeName } = body;

    if (!fromAccountId || !toAccountId)
      return NextResponse.json({ error: 'Both accounts are required' }, { status: 400 });
    if (fromAccountId === toAccountId)
      return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0 || amt > 999_999_999)
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const isRecurring = txType === 'recurring';
    const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

    if (isRecurring) {
      if (!startDate) return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
      if (!frequency || !validFrequencies.includes(frequency))
        return NextResponse.json({ error: 'Valid frequency is required' }, { status: 400 });
    } else {
      if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const nameExpense = String(expenseName ?? 'Transfer').slice(0, 200);
    const nameIncome = String(incomeName ?? 'Transfer').slice(0, 200);

    const supabase = createAdminClient();
    const transferId = randomUUID();

    const sharedFields = { user_id: userId, household_id: householdId, created_by: userId, transfer_id: transferId, amount: amt };
    const dateFields = isRecurring
      ? { type: 'recurring', start_date: startDate, frequency }
      : { type: 'one_off', date };

    // Insert expense on source account
    const { data: expTx, error: expErr } = await supabase
      .from('transactions')
      .insert({ ...sharedFields, ...dateFields, account_id: fromAccountId, name: nameExpense, category: 'expense' })
      .select()
      .single();

    if (expErr) {
      console.error('[POST /api/transfers] expense insert error:', expErr.message);
      return NextResponse.json({ error: expErr.message }, { status: 500 });
    }

    // Insert income on destination account
    const { data: incTx, error: incErr } = await supabase
      .from('transactions')
      .insert({ ...sharedFields, ...dateFields, account_id: toAccountId, name: nameIncome, category: 'income' })
      .select()
      .single();

    if (incErr) {
      // Roll back the expense transaction
      await supabase.from('transactions').delete().eq('id', expTx.id);
      console.error('[POST /api/transfers] income insert error:', incErr.message);
      return NextResponse.json({ error: incErr.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json({ expense: expTx, income: incTx }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transfers] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
