import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Gets the authenticated user's ID from the session.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export interface AuthContext {
  userId: string;
  householdId: string;
}

/**
 * No-op kept for backwards compatibility — callers in the invite-accept
 * flow still reference it. Previously cleared an in-memory cache that
 * caused stale-household bugs across serverless instances.
 */
export function clearHouseholdCache(_userId: string): void {}

/**
 * Returns userId + householdId for the authenticated user.
 * Auto-creates a household on first call using the database-level
 * ensure_household() function which is race-condition-proof.
 *
 * Always queries the DB — no in-memory cache. The DB call adds ~10ms
 * on top of the ~100ms getUser() call and eliminates an entire class
 * of stale-household bugs in multi-instance serverless environments.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const supabase = createAdminClient();

  // Call the database function — handles race conditions via PK constraint
  const { data, error } = await supabase.rpc('ensure_household', { p_user_id: userId });

  if (error) {
    console.error('[getAuthContext] ensure_household failed:', error.message);
    // Fallback: try a direct select
    const { data: row } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .single();
    if (row) return { userId, householdId: row.household_id };
    return null;
  }

  return { userId, householdId: data as string };
}
