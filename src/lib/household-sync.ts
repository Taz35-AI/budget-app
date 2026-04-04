import { createAdminClient } from './supabase/admin';

/**
 * Sends a broadcast message to all members of a household.
 * Called from API routes AFTER successful mutations.
 * Fire-and-forget — never blocks the HTTP response.
 *
 * The browser clients subscribe to `household:{id}` and
 * invalidate React Query caches when they receive this.
 */
export function notifyHousehold(householdId: string, table: string) {
  try {
    const supabase = createAdminClient();
    supabase
      .channel(`household:${householdId}`)
      .send({
        type: 'broadcast',
        event: 'data_changed',
        payload: { table, ts: Date.now() },
      })
      .catch(() => {}); // best-effort, never throw
  } catch {
    // ignore — sync is best-effort, polling is the fallback
  }
}
