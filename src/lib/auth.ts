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

// In-memory cache: userId → householdId (survives for the serverless function lifetime)
const householdCache = new Map<string, string>();

/**
 * Returns userId + householdId for the authenticated user.
 * Auto-creates a household on first call using the database-level
 * ensure_household() function which is race-condition-proof.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  // Check in-memory cache first
  const cached = householdCache.get(userId);
  if (cached) return { userId, householdId: cached };

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
      householdCache.set(userId, row.household_id);
      return { userId, householdId: row.household_id };
    }
    return null;
  }

  const householdId = data as string;
  householdCache.set(userId, householdId);
  return { userId, householdId };
}
