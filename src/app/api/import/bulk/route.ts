import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

const VALID_CATEGORIES = ['income', 'expense'];
const VALID_TYPES = ['one_off', 'recurring'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

// POST /api/import/bulk
// Body: { transactions: TransactionInput[] }
// Returns: { inserted: number; errors: number }
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const { transactions } = await req.json() as { transactions: Record<string, unknown>[] };
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'transactions array required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const rows = [];
    const skipped = [];

    for (const body of transactions) {
      const name = String(body.name ?? '').trim().slice(0, 200);
      const amount = Number(body.amount);
      if (
        !name ||
        !VALID_CATEGORIES.includes(body.category as string) ||
        !VALID_TYPES.includes(body.type as string) ||
        isNaN(amount) || amount < 0 || amount > 999_999_999 ||
        (body.frequency && !VALID_FREQUENCIES.includes(body.frequency as string))
      ) {
        skipped.push(body);
        continue;
      }

      rows.push({
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
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ inserted: 0, errors: skipped.length });
    }

    const { data, error } = await supabase.from('transactions').insert(rows).select('id');

    if (error) {
      console.error('[POST /api/import/bulk] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    notifyHousehold(householdId, 'transactions');
    return NextResponse.json({ inserted: data?.length ?? 0, errors: skipped.length }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/import/bulk] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
