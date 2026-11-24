import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

/**
 * POST /api/household/invite/decline
 * Decline a household invite addressed to the caller.
 * Body: { token }
 *
 * The existing DELETE /api/household/invite revokes an invite from the
 * inviting household's side, and is scoped to that household, so the invitee
 * (who is not a member of it) can't use it. This is the invitee's side: it is
 * authorised by the invite being addressed to the caller's own email, the same
 * check accepting one uses.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === 'string' ? body.token : '';
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: invite } = await supabase
      .from('household_invites')
      .select('id, household_id, invited_email')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found, expired, or already used' },
        { status: 404 },
      );
    }

    const { data: { user } } = await supabase.auth.admin.getUserById(ctx.userId);
    const email = user?.email?.toLowerCase();
    if (!email || email !== invite.invited_email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 },
      );
    }

    // 'revoked' is the only non-accepted terminal status the table allows; it
    // also frees the address to be invited again later.
    const { error } = await supabase
      .from('household_invites')
      .update({ status: 'revoked' })
      .eq('id', invite.id)
      .eq('status', 'pending');

    if (error) {
      console.error('[POST /api/household/invite/decline]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Let the inviting household's pending list update.
    await notifyHousehold(invite.household_id, 'household_members');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/household/invite/decline] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
