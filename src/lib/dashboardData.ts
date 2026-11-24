import type { createAdminClient } from '@/lib/supabase/admin';

/**
 * Server-side loaders for the data every signed-in page needs.
 *
 * Each one is the body of a GET route (`/api/transactions`, `/api/accounts`,
 * `/api/settings`, `/api/household/members`, `/api/household/invite/pending`)
 * lifted out so that `/api/bootstrap` can run them together in one request.
 * The individual routes still call these, so there is one implementation of
 * each query, not two that can drift apart.
 *
 * A loader throws `LoadError` when its primary query fails; callers decide how
 * that maps to an HTTP response.
 */

type AdminClient = ReturnType<typeof createAdminClient>;

export class LoadError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = 'LoadError';
  }
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function loadTransactions(supabase: AdminClient, householdId: string) {
  // Both queries run in parallel. Exceptions are scoped to the household
  // through an inner join on their parent transaction rather than an
  // `in (every transaction id)` filter: that needed the first query to
  // finish before the second could start, and put every id in the request
  // URL, which stops working once a household has a few thousand rows.
  const [txResult, excResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false }),
    supabase
      .from('transaction_exceptions')
      .select('*, transactions!inner(household_id)')
      .eq('transactions.household_id', householdId),
  ]);

  if (txResult.error) {
    console.error('[loadTransactions] Supabase error:', txResult.error.message, txResult.error.code);
    throw new LoadError(txResult.error.message, txResult.error.code);
  }

  if (excResult.error) {
    console.error('[loadTransactions] exceptions error:', excResult.error.message);
  }

  // Drop the join column so the payload keeps its original shape.
  const exceptions = (excResult.data ?? []).map((row) => {
    const { transactions: _parent, ...exception } = row;
    void _parent;
    return exception;
  });

  return { transactions: txResult.data ?? [], exceptions };
}

// ─── Accounts ────────────────────────────────────────────────────────────────

/**
 * Returns the household's accounts. Auto-creates a default "Main Account" if
 * none exist, and backfills any un-assigned transactions to it.
 */
export async function loadAccounts(supabase: AdminClient, userId: string, householdId: string) {
  const { data, error } = await supabase
    .from('budget_accounts')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[loadAccounts]', error.message);
    throw new LoadError(error.message);
  }

  if (data && data.length > 0) return data;

  // Auto-create a default account if the household has none
  const { data: created, error: createErr } = await supabase
    .from('budget_accounts')
    .insert({ user_id: userId, household_id: householdId, name: 'Main Account' })
    .select()
    .single();

  if (createErr) {
    console.error('[loadAccounts] auto-create error:', createErr.message);
    throw new LoadError(createErr.message);
  }

  // Backfill any existing transactions that have no account_id
  await supabase
    .from('transactions')
    .update({ account_id: created.id })
    .eq('household_id', householdId)
    .is('account_id', null);

  // Backfill balance_resets too
  await supabase
    .from('balance_resets')
    .update({ account_id: created.id })
    .eq('household_id', householdId)
    .is('account_id', null);

  return [created];
}

// ─── Settings ────────────────────────────────────────────────────────────────

/** The user's saved settings blob, or null for a first-time user. */
export async function loadSettings(supabase: AdminClient, userId: string): Promise<unknown> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single();

  // PGRST116 = no rows found (first-time user)
  if (error && error.code !== 'PGRST116') {
    throw new LoadError(error.message, error.code);
  }

  return data?.settings ?? null;
}

// ─── Household members ───────────────────────────────────────────────────────

/** All members of the household, enriched with email/display name from auth. */
export async function loadMembers(supabase: AdminClient, householdId: string) {
  const { data: rows, error } = await supabase
    .from('household_members')
    .select('user_id, household_id, role, display_name, joined_at')
    .eq('household_id', householdId);

  if (error) {
    console.error('[loadMembers]', error.message);
    throw new LoadError(error.message);
  }

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

  return { members, householdId };
}

// ─── Pending invites (addressed to the current user) ─────────────────────────

/** Invitations addressed to the current user's email: how an invitee finds out. */
export async function loadPendingInvites(supabase: AdminClient, userId: string) {
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const email = user?.email?.toLowerCase();
  if (!email) return [];

  // Find pending, non-expired invitations addressed to this email
  const { data: invites } = await supabase
    .from('household_invites')
    .select('*')
    .eq('invited_email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  // Enrich with inviter info
  return Promise.all(
    (invites ?? []).map(async (inv) => {
      const { data: { user: inviter } } = await supabase.auth.admin.getUserById(inv.invited_by);
      return {
        ...inv,
        inviter_name: inviter?.user_metadata?.full_name ?? inviter?.user_metadata?.name ?? inviter?.email ?? 'Someone',
      };
    }),
  );
}
