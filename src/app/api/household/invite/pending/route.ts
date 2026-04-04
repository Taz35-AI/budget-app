import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/household/invite/pending
 * Returns invitations addressed to the current user's email.
 * This is how the invitee discovers they've been invited.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    // Get the current user's email
    const { data: { user } } = await supabase.auth.admin.getUserById(ctx.userId);
    const email = user?.email?.toLowerCase();
    if (!email) return NextResponse.json({ invites: [] });

    // Find pending, non-expired invitations addressed to this email
    const { data: invites } = await supabase
      .from('household_invites')
      .select('*')
      .eq('invited_email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Enrich with inviter info
    const enriched = await Promise.all(
      (invites ?? []).map(async (inv) => {
        const { data: { user: inviter } } = await supabase.auth.admin.getUserById(inv.invited_by);
        return {
          ...inv,
          inviter_name: inviter?.user_metadata?.full_name ?? inviter?.user_metadata?.name ?? inviter?.email ?? 'Someone',
        };
      }),
    );

    return NextResponse.json({ invites: enriched });
  } catch (err) {
    console.error('[GET /api/household/invite/pending]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
