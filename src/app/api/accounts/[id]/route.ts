import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

/**
 * PATCH /api/accounts/[id]
 * Body: { name: string }
 * Renames an account.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { householdId } = ctx;

    const { id } = await params;
    const supabase = createAdminClient();
    const body = await req.json();
    const name = (body.name ?? '').trim();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const validTypes = ['checking', 'savings', 'credit'];
    const updatePayload: Record<string, unknown> = { name, updated_at: new Date().toISOString() };
    if (body.type !== undefined && validTypes.includes(body.type)) {
      updatePayload.type = body.type;
      updatePayload.credit_limit = body.type === 'credit' && body.credit_limit > 0
        ? Number(body.credit_limit)
        : null;
    }

    const { data, error } = await supabase
      .from('budget_accounts')
      .update(updatePayload)
      .eq('id', id)
      .eq('household_id', householdId)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/accounts]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    notifyHousehold(householdId, 'accounts');
    return NextResponse.json({ account: data });
  } catch (err) {
    console.error('[PATCH /api/accounts] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/accounts/[id]
 * Deletes an account. Cascades to transactions and balance_resets via FK.
 * Prevented if this is the last account.
 * Uses user_id check — only delete own accounts.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const { id } = await params;
    const supabase = createAdminClient();

    // Prevent deleting the last account in the household
    const { count } = await supabase
      .from('budget_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId);

    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Cannot delete your only account' }, { status: 400 });
    }

    // Only delete own accounts (user_id = userId)
    const { error } = await supabase
      .from('budget_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[DELETE /api/accounts]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    notifyHousehold(householdId, 'accounts');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/accounts] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
