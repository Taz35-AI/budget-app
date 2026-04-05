import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

const VALID_CATEGORIES = ['income', 'expense'];
const VALID_TYPES = ['one_off', 'recurring'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

/**
 * Signature used for duplicate detection. Narrows to the fields a bank CSV
 * can reasonably identify a transaction by — amount, name, date, account.
 */
function signatureFor(r: {
  type?: string; name?: string; amount?: number;
  date?: string | null; start_date?: string | null;
  frequency?: string | null; account_id?: string | null;
}): string {
  const name = String(r.name ?? '').trim().toLowerCase();
  const amount = typeof r.amount === 'number' ? r.amount.toFixed(2) : String(r.amount ?? '');
  const acct = r.account_id ?? '';
  if (r.type === 'recurring') {
    return `recurring|${r.start_date ?? ''}|${amount}|${name}|${r.frequency ?? ''}|${acct}`;
  }
  return `one_off|${r.date ?? ''}|${amount}|${name}|${acct}`;
}

// POST /api/import/bulk
// Body: { transactions: TransactionInput[] }
// Returns: { inserted, errors, duplicates }
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
    const { data: existing } = await supabase
      .from('transactions')
      .select('type, name, amount, date, start_date, frequency, account_id')
      .eq('household_id', householdId);
    const existingSigs = new Set((existing ?? []).map((r) => signatureFor(r as never)));

    const rows = [];
    const skipped: Record<string, unknown>[] = [];
    let duplicates = 0;

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

      const candidate = {
        type: body.type as string,
        name,
        amount,
        date: (body.date as string) ?? null,
        start_date: (body.start_date as string) ?? null,
        frequency: (body.frequency as string) ?? null,
        account_id: (body.account_id as string) ?? null,
      };
      const sig = signatureFor(candidate);
      if (existingSigs.has(sig)) {
        duplicates += 1;
        continue;
      }
      existingSigs.add(sig); // dedup within the incoming batch too

      rows.push({
        user_id: userId,
        household_id: householdId,
        created_by: userId,
        account_id: candidate.account_id,
        parent_id: (body.parent_id as string) || null,
        name,
        amount,
        category: body.category,
        type: body.type,
        tag: body.tag || null,
        date: candidate.date,
        start_date: candidate.start_date,
        end_date: (body.end_date as string) || null,
        frequency: candidate.frequency,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ inserted: 0, errors: skipped.length, duplicates });
    }

    const { data, error } = await supabase.from('transactions').insert(rows).select('id');

    if (error) {
      console.error('[POST /api/import/bulk] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json(
      { inserted: data?.length ?? 0, errors: skipped.length, duplicates },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/import/bulk] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
