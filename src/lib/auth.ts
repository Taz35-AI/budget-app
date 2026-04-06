import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

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

// In-memory cache: userId → { householdId, timestamp }.
// 30s TTL ensures revoked users stop seeing stale data quickly — we can't
// set a cookie on their browser since the removal is done by another user.
const CACHE_TTL_MS = 30_000;
const householdCache = new Map<string, { id: string; ts: number }>();

/**
 * Drop a user's cached household mapping. MUST be called whenever a user's
 * household_id changes in the database (e.g. after accepting an invite,
 * leaving a household, or being removed). Otherwise getAuthContext() keeps
 * returning the stale household and the user sees wrong data.
 */
export function clearHouseholdCache(userId: string): void {
  householdCache.delete(userId);
}

/**
 * Returns userId + householdId for the authenticated user.
 * Auto-creates a household on first call using the database-level
 * ensure_household() function which is race-condition-proof.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  // If the user just changed households (invite accept/leave), a cookie
  // tells us to bypass the in-memory cache — it may be stale on this instance.
  let skipCache = false;
  try {
    const cookieStore = await cookies();
    skipCache = cookieStore.get('household_changed')?.value === '1';
  } catch { /* outside request context */ }

  const cached = householdCache.get(userId);
  if (cached && !skipCache && (Date.now() - cached.ts < CACHE_TTL_MS)) {
    return { userId, householdId: cached.id };
  }

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
    if (row) {
      householdCache.set(userId, { id: row.household_id, ts: Date.now() });
      return { userId, householdId: row.household_id };
    }
    return null;
  }

  const householdId = data as string;
  householdCache.set(userId, { id: householdId, ts: Date.now() });
  return { userId, householdId };
}
