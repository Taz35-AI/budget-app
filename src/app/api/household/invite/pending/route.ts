import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadPendingInvites } from '@/lib/dashboardData';

/**
 * GET /api/household/invite/pending
 * Returns invitations addressed to the current user's email.
 * This is how the invitee discovers they've been invited.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invites = await loadPendingInvites(createAdminClient(), ctx.userId);
    return NextResponse.json({ invites });
  } catch (err) {
    console.error('[GET /api/household/invite/pending]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
