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

// In-memory cache: userId → { householdId, timestamp }.
// TTL prevents stale entries on server instances that didn't process the
// invite-accept/leave/remove — those instances never see clearHouseholdCache().
const CACHE_TTL_MS = 60_000; // 60 seconds
const householdCache = new Map<string, { householdId: string; ts: number }>();

/**
 * Drop a user's cached household mapping. MUST be called whenever a user's
 * household_id changes in the database (e.g. after accepting an invite,
 * leaving a household, or being removed). Only affects this server instance;
 * other instances rely on the TTL to expire stale entries.
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

  // Check in-memory cache first (with TTL)
  const cached = householdCache.get(userId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { userId, householdId: cached.householdId };
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
      householdCache.set(userId, { householdId: row.household_id, ts: Date.now() });
      return { userId, householdId: row.household_id };
    }
    return null;
  }

  const householdId = data as string;
  householdCache.set(userId, { householdId, ts: Date.now() });
  return { userId, householdId };
}
