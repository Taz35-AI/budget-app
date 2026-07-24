import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Finds an auth user by email address.
 *
 * `listUsers()` returns one page at a time, so a single call silently misses
 * everyone past the first page once the project grows. Pages until the email
 * is found or the listing is exhausted.
 */
async function findUserByEmail(supabase: AdminClient, email: string) {
  const PER_PAGE = 200;
  const MAX_PAGES = 50; // 10k users — beyond that, switch to a users table lookup
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) {
      console.error('[findUserByEmail] listUsers failed:', error.message);
      return null;
    }
    const users = data?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (users.length < PER_PAGE) return null; // last page
  }
  return null;
}

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
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 254);
    const displayName = String(body.displayName ?? '').trim().slice(0, 60) || null;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    // Get caller's email to prevent self-invite
    const { data: { user: callerUser } } = await supabase.auth.admin.getUserById(ctx.userId);
    if (callerUser?.email?.toLowerCase() === email) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    // Check if already a member. listUsers() is paginated (50/page by default),
    // so walk the pages instead of only checking the first one.
    const targetUser = await findUserByEmail(supabase, email);

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
      .eq('invited_email', email)
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
        invited_email: email,
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
