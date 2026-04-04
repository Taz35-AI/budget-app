import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

/**
 * GET /api/mortgages
 * Returns all mortgages for the caller's household (any owner).
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    const { data: mortgages, error } = await supabase
      .from('mortgages')
      .select('*')
      .eq('household_id', ctx.householdId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GET /api/mortgages]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mortgages: mortgages ?? [] });
  } catch (err) {
    console.error('[GET /api/mortgages] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/mortgages
 * Body: { name, principal, interest_rate, term_months, start_date, tag_id }
 * Creates a new mortgage owned by the caller.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const body = await req.json();
    const name = String(body.name ?? '').trim().slice(0, 100);
    const principal = Number(body.principal);
    const interest_rate = Number(body.interest_rate);
    const term_months = Number(body.term_months);
    const start_date = String(body.start_date ?? '').slice(0, 10);
    const tag_id = String(body.tag_id ?? '').trim().slice(0, 100);

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!Number.isFinite(principal) || principal <= 0 || principal > 100_000_000)
      return NextResponse.json({ error: 'Invalid principal' }, { status: 400 });
    if (!Number.isFinite(interest_rate) || interest_rate < 0 || interest_rate >= 1)
      return NextResponse.json({ error: 'Interest rate must be between 0 and 1 (e.g. 0.045)' }, { status: 400 });
    if (!Number.isInteger(term_months) || term_months <= 0 || term_months > 600)
      return NextResponse.json({ error: 'Invalid term (1-600 months)' }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date))
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    if (!tag_id) return NextResponse.json({ error: 'Tag id is required' }, { status: 400 });

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('mortgages')
      .insert({
        user_id: userId,
        household_id: householdId,
        name,
        principal,
        interest_rate,
        term_months,
        start_date,
        tag_id,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/mortgages]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'mortgages');
    return NextResponse.json({ mortgage: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/mortgages] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
