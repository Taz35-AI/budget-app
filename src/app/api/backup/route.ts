import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

// ─── GET — download full backup as JSON ───────────────────────────────────────

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { householdId } = ctx;

    const supabase = createAdminClient();

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true });

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

    const txIds = (transactions ?? []).map((t) => t.id);
    const { data: exceptions } = txIds.length > 0
      ? await supabase.from('transaction_exceptions').select('*').in('transaction_id', txIds)
      : { data: [] };

    const today = new Date().toISOString().slice(0, 10);
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions: transactions ?? [],
      exceptions: exceptions ?? [],
    };

    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="budget-backup-${today}.json"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/backup]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ─── POST — restore from backup JSON ─────────────────────────────────────────
// Strategy: upsert by ID so restoring the same backup twice is idempotent.
//
// The admin client bypasses RLS, so ids coming from the file must never be
// allowed to touch rows outside the caller's household. Any incoming id that
// already exists in a DIFFERENT household is re-keyed to a fresh UUID before
// the upsert (the common case: restoring a backup taken in a household the
// user has since left). Exceptions are re-parented through the same mapping
// and upserted on (transaction_id, effective_from), never by raw id.

const VALID_CATEGORIES = ['income', 'expense'];
const VALID_TYPES = ['one_off', 'recurring'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const asUuid = (v: unknown): string | null => (typeof v === 'string' && UUID_RE.test(v) ? v : null);
const asDate = (v: unknown): string | null => (typeof v === 'string' && DATE_RE.test(v) ? v : null);

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const body = await req.json();

    if (!Array.isArray(body?.transactions)) {
      return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
    }
    if (body.transactions.length > 50_000) {
      return NextResponse.json({ error: 'Backup file too large' }, { status: 413 });
    }

    const supabase = createAdminClient();

    // ── 1. Validate + whitelist every transaction row ────────────────────
    let skipped = 0;
    type CleanTx = {
      id: string; account_id: string | null; parent_id: string | null;
      transfer_id: string | null; name: string; amount: number;
      category: string; type: string; tag: string | null;
      date: string | null; start_date: string | null; end_date: string | null;
      frequency: string | null;
    };
    const cleaned: CleanTx[] = [];
    for (const raw of body.transactions as Record<string, unknown>[]) {
      const name = String(raw.name ?? '').trim().slice(0, 200);
      const amount = Number(raw.amount);
      const frequency = typeof raw.frequency === 'string' ? raw.frequency : null;
      if (
        !name ||
        !VALID_CATEGORIES.includes(raw.category as string) ||
        !VALID_TYPES.includes(raw.type as string) ||
        !Number.isFinite(amount) || amount < 0 || amount > 999_999_999 ||
        (frequency && !VALID_FREQUENCIES.includes(frequency))
      ) {
        skipped += 1;
        continue;
      }
      cleaned.push({
        id: asUuid(raw.id) ?? randomUUID(),
        account_id: asUuid(raw.account_id),
        parent_id: asUuid(raw.parent_id),
        transfer_id: asUuid(raw.transfer_id),
        name,
        amount,
        category: raw.category as string,
        type: raw.type as string,
        tag: typeof raw.tag === 'string' ? raw.tag.slice(0, 100) : null,
        date: asDate(raw.date),
        start_date: asDate(raw.start_date),
        end_date: asDate(raw.end_date),
        frequency,
      });
    }

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'No valid transactions in backup file' }, { status: 400 });
    }

    // ── 2. Re-key ids that exist in another household ────────────────────
    const incomingIds = cleaned.map((t) => t.id);
    const foreignIds = new Set<string>();
    for (let i = 0; i < incomingIds.length; i += 500) {
      const { data: existing } = await supabase
        .from('transactions')
        .select('id, household_id')
        .in('id', incomingIds.slice(i, i + 500));
      for (const row of existing ?? []) {
        if (row.household_id !== householdId) foreignIds.add(row.id);
      }
    }

    const idMap = new Map<string, string>(); // old id → new id
    for (const tx of cleaned) {
      if (foreignIds.has(tx.id)) {
        const fresh = randomUUID();
        idMap.set(tx.id, fresh);
        tx.id = fresh;
      }
    }
    for (const tx of cleaned) {
      if (tx.parent_id && idMap.has(tx.parent_id)) tx.parent_id = idMap.get(tx.parent_id)!;
    }

    // ── 3. Drop references that would break FKs in this household ────────
    const { data: ownAccounts } = await supabase
      .from('budget_accounts')
      .select('id')
      .eq('household_id', householdId);
    const ownAccountIds = new Set((ownAccounts ?? []).map((a) => a.id));
    const restoredIds = new Set(cleaned.map((t) => t.id));

    for (const tx of cleaned) {
      if (tx.account_id && !ownAccountIds.has(tx.account_id)) tx.account_id = null;
      if (tx.parent_id && !restoredIds.has(tx.parent_id) && foreignIds.has(tx.parent_id)) {
        tx.parent_id = null;
      }
    }

    // ── 4. Upsert transactions, stamped to the caller ────────────────────
    const txPayload = cleaned.map((tx) => ({
      ...tx,
      user_id: userId,
      household_id: householdId,
      created_by: userId,
    }));

    for (let i = 0; i < txPayload.length; i += 500) {
      const { error: txError } = await supabase
        .from('transactions')
        .upsert(txPayload.slice(i, i + 500), { onConflict: 'id' });
      if (txError) {
        console.error('[POST /api/backup] transactions upsert error:', txError.message);
        return NextResponse.json({ error: txError.message }, { status: 500 });
      }
    }

    // ── 5. Restore exceptions — only for transactions restored above ─────
    if (Array.isArray(body.exceptions) && body.exceptions.length > 0) {
      const excPayload = [];
      for (const raw of body.exceptions as Record<string, unknown>[]) {
        const mappedId = asUuid(raw.transaction_id);
        const txId = mappedId ? (idMap.get(mappedId) ?? mappedId) : null;
        const effectiveFrom = asDate(raw.effective_from);
        if (!txId || !restoredIds.has(txId) || !effectiveFrom) continue;
        const amount = raw.amount === null || raw.amount === undefined ? null : Number(raw.amount);
        excPayload.push({
          transaction_id: txId,
          effective_from: effectiveFrom,
          name: typeof raw.name === 'string' ? raw.name.slice(0, 200) : null,
          amount: Number.isFinite(amount as number) ? amount : null,
          end_date: asDate(raw.end_date),
          is_deleted: raw.is_deleted === true,
        });
      }

      for (let i = 0; i < excPayload.length; i += 500) {
        const { error: excError } = await supabase
          .from('transaction_exceptions')
          .upsert(excPayload.slice(i, i + 500), { onConflict: 'transaction_id,effective_from' });
        if (excError) {
          console.error('[POST /api/backup] exceptions upsert error:', excError.message);
          return NextResponse.json({ error: excError.message }, { status: 500 });
        }
      }
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json({ success: true, imported: txPayload.length, skipped });
  } catch (err) {
    console.error('[POST /api/backup]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
