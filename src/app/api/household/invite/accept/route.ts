import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';

/**
 * POST /api/household/invite/accept
 * Accept a household invite by token.
 * Body: { token, displayName?, mergeData?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const body = await req.json();
    const { token, displayName, mergeData } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find the invite by token — must be pending and not expired
    const { data: invite, error: inviteErr } = await supabase
      .from('household_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json(
        { error: 'Invite not found, expired, or already used' },
        { status: 404 },
      );
    }

    // Verify current user's email matches the invite
    const { data: { user: currentUser } } = await supabase.auth.admin.getUserById(ctx.userId);
    const userEmail = currentUser?.email?.toLowerCase();

    if (!userEmail || userEmail !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 },
      );
    }

    const newHouseholdId = invite.household_id;
    const oldHouseholdId = ctx.householdId;
    const isChangingHousehold = oldHouseholdId !== newHouseholdId;

    // If user is in a different household, handle migration
    if (isChangingHousehold) {
      if (mergeData) {
        // Move user's data to the new household
        await Promise.all([
          supabase
            .from('transactions')
            .update({ household_id: newHouseholdId })
            .eq('household_id', oldHouseholdId)
            .eq('user_id', ctx.userId),
          supabase
            .from('budget_accounts')
            .update({ household_id: newHouseholdId })
            .eq('household_id', oldHouseholdId)
            .eq('user_id', ctx.userId),
          supabase
            .from('balance_resets')
            .update({ household_id: newHouseholdId })
            .eq('household_id', oldHouseholdId)
            .eq('user_id', ctx.userId),
        ]);
      }

      // Remove from old household
      await supabase
        .from('household_members')
        .delete()
        .eq('user_id', ctx.userId)
        .eq('household_id', oldHouseholdId);

      // If old household has no members left, delete it
      const { count } = await supabase
        .from('household_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('household_id', oldHouseholdId);

      if (count === 0) {
        await supabase
          .from('households')
          .delete()
          .eq('id', oldHouseholdId);
      }
    }

    // Insert into the new household (or update if already exists somehow)
    const { error: memberErr } = await supabase
      .from('household_members')
      .upsert(
        {
          user_id: ctx.userId,
          household_id: newHouseholdId,
          role: 'member',
          display_name: (displayName ?? '').trim() || invite.display_name || null,
        },
        { onConflict: 'user_id' },
      );

    if (memberErr) {
      console.error('[POST /api/household/invite/accept] member upsert:', memberErr.message);
      return NextResponse.json({ error: memberErr.message }, { status: 500 });
    }

    // Mark invite as accepted
    await supabase
      .from('household_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/household/invite/accept] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
