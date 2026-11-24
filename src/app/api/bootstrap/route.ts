import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import {
  loadTransactions,
  loadAccounts,
  loadSettings,
  loadMembers,
  loadPendingInvites,
} from '@/lib/dashboardData';

/**
 * GET /api/bootstrap
 *
 * Everything a signed-in page needs on first load, in one request.
 *
 * The dashboard used to open with five separate API calls. Each one
 * authenticated, resolved the household, and queried on its own, and on
 * serverless hosting simultaneous requests tend to land on separate, often
 * cold, instances: calls that take ~0.2s alone were taking 1-2s each together.
 * Here the session and household are resolved once and the five loads run in
 * parallel inside a single invocation.
 *
 * Each slice is independent: if one fails it is simply left out, and the
 * client falls back to that slice's own endpoint. Later refetches (polling,
 * invalidation after a mutation) keep using the individual endpoints.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const supabase = createAdminClient();

    const [transactions, accounts, settings, members, pendingInvites] = await Promise.allSettled([
      loadTransactions(supabase, householdId),
      loadAccounts(supabase, userId, householdId),
      loadSettings(supabase, userId),
      loadMembers(supabase, householdId),
      loadPendingInvites(supabase, userId),
    ]);

    const slices: Record<string, unknown> = {};
    if (transactions.status === 'fulfilled') slices.transactions = transactions.value;
    if (accounts.status === 'fulfilled') slices.accounts = accounts.value;
    // Wrapped, because "no settings yet" is a real answer (null) that must be
    // distinguishable from "this slice failed to load" (absent).
    if (settings.status === 'fulfilled') slices.settings = { settings: settings.value };
    if (members.status === 'fulfilled') slices.members = members.value;
    if (pendingInvites.status === 'fulfilled') slices.pendingInvites = pendingInvites.value;

    return NextResponse.json({ slices });
  } catch (error) {
    console.error('[GET /api/bootstrap] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
