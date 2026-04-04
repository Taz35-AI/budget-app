import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/mortgages/[id]
 * Update a mortgage. Only the owner can modify their mortgage.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;
    const { id } = await params;

    const body = await req.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      const name = String(body.name).trim().slice(0, 100);
      if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      patch.name = name;
    }
    if (body.principal !== undefined) {
      const principal = Number(body.principal);
      if (!Number.isFinite(principal) || principal <= 0 || principal > 100_000_000)
        return NextResponse.json({ error: 'Invalid principal' }, { status: 400 });
      patch.principal = principal;
    }
    if (body.interest_rate !== undefined) {
      const rate = Number(body.interest_rate);
      if (!Number.isFinite(rate) || rate < 0 || rate >= 1)
        return NextResponse.json({ error: 'Invalid interest rate' }, { status: 400 });
      patch.interest_rate = rate;
    }
    if (body.term_months !== undefined) {
      const term = Number(body.term_months);
      if (!Number.isInteger(term) || term <= 0 || term > 600)
        return NextResponse.json({ error: 'Invalid term' }, { status: 400 });
      patch.term_months = term;
    }
    if (body.start_date !== undefined) {
      const start = String(body.start_date).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start))
        return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
      patch.start_date = start;
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('mortgages')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('household_id', householdId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 });
    }

    await notifyHousehold(householdId, 'mortgages');
    return NextResponse.json({ mortgage: data });
  } catch (err) {
    console.error('[PATCH /api/mortgages/[id]] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/mortgages/[id]
 * Delete a mortgage. Only the owner can delete.
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;
    const { id } = await params;

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('mortgages')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('household_id', householdId);

    if (error) {
      console.error('[DELETE /api/mortgages/[id]]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'mortgages');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/mortgages/[id]] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
