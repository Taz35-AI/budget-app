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
    const channel = supabase.channel(`household:${householdId}`);
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      channel
        .send({
          type: 'broadcast',
          event: 'data_changed',
          payload: { table, ts: Date.now() },
        })
        .then(() => supabase.removeChannel(channel))
        .catch(() => supabase.removeChannel(channel));
    });
    // Safety: clean up if subscribe never fires
    setTimeout(() => supabase.removeChannel(channel), 5000);
  } catch {
    // ignore — sync is best-effort, polling is the fallback
  }
}
