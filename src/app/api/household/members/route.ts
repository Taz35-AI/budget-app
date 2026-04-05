import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext, clearHouseholdCache } from '@/lib/auth';

/**
 * GET /api/household/members
 * List all members of the caller's household, enriched with email/display_name.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    const { data: rows, error } = await supabase
      .from('household_members')
      .select('user_id, household_id, role, display_name, joined_at')
      .eq('household_id', ctx.householdId);

    if (error) {
      console.error('[GET /api/household/members]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich each member with email and display name from auth
    const members = await Promise.all(
      (rows ?? []).map(async (row) => {
        try {
          const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id);
          return {
            ...row,
            email: user?.email ?? null,
            auth_display_name: user?.user_metadata?.display_name ?? user?.user_metadata?.full_name ?? null,
          };
        } catch {
          return { ...row, email: null, auth_display_name: null };
        }
      }),
    );

    return NextResponse.json({ members, householdId: ctx.householdId });
  } catch (err) {
    console.error('[GET /api/household/members] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/household/members
 * Remove a member from the household. Caller must be owner. Cannot remove self.
 * Body: { userId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const body = await req.json();
    const memberUserId = body.userId;

    if (!memberUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (memberUserId === ctx.userId) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    // Verify caller is owner
    const { data: callerRow } = await supabase
      .from('household_members')
      .select('role')
      .eq('user_id', ctx.userId)
      .eq('household_id', ctx.householdId)
      .single();

    if (callerRow?.role !== 'owner') {
      return NextResponse.json({ error: 'Only the household owner can remove members' }, { status: 403 });
    }

    // Delete the member
    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('user_id', memberUserId)
      .eq('household_id', ctx.householdId);

    if (error) {
      console.error('[DELETE /api/household/members]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Removed member now has no household — clear their cache so the next
    // getAuthContext() call auto-creates them a fresh solo household via
    // ensure_household().
    clearHouseholdCache(memberUserId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/household/members] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
