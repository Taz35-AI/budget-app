import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';

/**
 * GET /api/household/invite
 * List pending invites for the caller's household.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    const { data: invites, error } = await supabase
      .from('household_invites')
      .select('*')
      .eq('household_id', ctx.householdId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/household/invite]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invites: invites ?? [] });
  } catch (err) {
    console.error('[GET /api/household/invite] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/household/invite
 * Create a new invite. Body: { email, displayName? }
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const body = await req.json();
    const email = (body.email ?? '').trim().toLowerCase();
    const displayName = (body.displayName ?? '').trim() || null;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get caller's email to prevent self-invite
    const { data: { user: callerUser } } = await supabase.auth.admin.getUserById(ctx.userId);
    if (callerUser?.email?.toLowerCase() === email) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    // Check if already a member
    // Look up user by email first
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const targetUser = users?.find((u) => u.email?.toLowerCase() === email);

    if (targetUser) {
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('user_id', targetUser.id)
        .eq('household_id', ctx.householdId)
        .single();

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member of this household' }, { status: 400 });
      }
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('household_invites')
      .select('id')
      .eq('household_id', ctx.householdId)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'A pending invite already exists for this email' }, { status: 400 });
    }

    // Create the invite with a 7-day expiry
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error } = await supabase
      .from('household_invites')
      .insert({
        household_id: ctx.householdId,
        invited_by: ctx.userId,
        email,
        display_name: displayName,
        token,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/household/invite]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/household/invite] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/household/invite
 * Revoke a pending invite. Body: { inviteId }
 */
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const body = await req.json();
    const inviteId = body.inviteId;

    if (!inviteId) {
      return NextResponse.json({ error: 'inviteId is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('household_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .eq('household_id', ctx.householdId);

    if (error) {
      console.error('[DELETE /api/household/invite]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/household/invite] unexpected:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
