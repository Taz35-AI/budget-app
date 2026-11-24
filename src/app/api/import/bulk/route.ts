import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';
import { dedupeAgainstExisting } from '@/lib/importDedupe';

const VALID_CATEGORIES = ['income', 'expense'];
const VALID_TYPES = ['one_off', 'recurring'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

// POST /api/import/bulk
// Body: { transactions: TransactionInput[] }
// Returns: { inserted, errors, duplicates, batchId }
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

    // Load existing transactions for this household so we can skip duplicates.
    // Scoped to the household — all members' imports dedup against the shared set.
    const { data: existing, error: existingError } = await supabase
      .from('transactions')
      .select('type, name, amount, date, start_date, frequency, account_id')
      .eq('household_id', householdId);

    // Without the existing rows there is nothing to compare against, and every
    // incoming row would be imported again as new.
    if (existingError) {
      console.error('[POST /api/import/bulk] existing rows error:', existingError.message);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const candidates = [];
    const skipped: Record<string, unknown>[] = [];
    const batchId = crypto.randomUUID();

    for (const body of transactions) {
      const name = String(body.name ?? '').trim().slice(0, 200);
      const amount = Number(body.amount);
      if (
        !name ||
        !VALID_CATEGORIES.includes(body.category as string) ||
        !VALID_TYPES.includes(body.type as string) ||
        // The table requires amount > 0. A zero row (a waived fee, a pending
        // line) used to pass this check and then fail the single insert below,
        // taking the whole import down with it.
        isNaN(amount) || amount <= 0 || amount > 999_999_999 ||
        (body.frequency && !VALID_FREQUENCIES.includes(body.frequency as string))
      ) {
        skipped.push(body);
        continue;
      }

      candidates.push({
        user_id: userId,
        household_id: householdId,
        created_by: userId,
        account_id: (body.account_id as string) ?? null,
        parent_id: (body.parent_id as string) || null,
        name,
        amount,
        category: body.category as string,
        type: body.type as string,
        tag: (body.tag as string) || null,
        date: (body.date as string) ?? null,
        start_date: (body.start_date as string) ?? null,
        end_date: (body.end_date as string) || null,
        frequency: (body.frequency as string) ?? null,
        import_batch_id: batchId,
      });
    }

    // Matched by count, so identical rows within one statement are all kept
    // while a statement imported twice adds nothing. See lib/importDedupe.
    const { fresh: rows, duplicates } = dedupeAgainstExisting(existing ?? [], candidates);

    if (rows.length === 0) {
      return NextResponse.json({ inserted: 0, errors: skipped.length, duplicates, batchId: null });
    }

    const { data, error } = await supabase.from('transactions').insert(rows).select('id');

    if (error) {
      console.error('[POST /api/import/bulk] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json(
      { inserted: data?.length ?? 0, errors: skipped.length, duplicates, batchId },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/import/bulk] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
