import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const body = await req.json();

    if (!Array.isArray(body?.transactions)) {
      return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Stamp household_id + created_by on every imported transaction
    const txPayload = body.transactions.map((tx: Record<string, unknown>) => ({
      ...tx,
      user_id: userId,
      household_id: householdId,
      created_by: userId,
    }));

    const { error: txError } = await supabase
      .from('transactions')
      .upsert(txPayload, { onConflict: 'id' });

    if (txError) {
      console.error('[POST /api/backup] transactions upsert error:', txError.message);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    if (Array.isArray(body.exceptions) && body.exceptions.length > 0) {
      const excPayload = body.exceptions.map((ex: Record<string, unknown>) => ({
        ...ex,
      }));
      const { error: excError } = await supabase
        .from('transaction_exceptions')
        .upsert(excPayload, { onConflict: 'id' });

      if (excError) {
        console.error('[POST /api/backup] exceptions upsert error:', excError.message);
        return NextResponse.json({ error: excError.message }, { status: 500 });
      }
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json({ success: true, imported: txPayload.length });
  } catch (err) {
    console.error('[POST /api/backup]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
