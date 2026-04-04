import { createAdminClient } from './supabase/admin';

/**
 * Sends a broadcast message to all members of a household.
 * Called from API routes AFTER successful mutations.
 * Returns a promise that resolves once the broadcast is sent
 * (or after a timeout), so serverless functions stay alive
 * long enough for the message to actually be delivered.
 *
 * The browser clients subscribe to `household:{id}` and
 * invalidate React Query caches when they receive this.
 */
export function notifyHousehold(householdId: string, table: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const supabase = createAdminClient();
      const channel = supabase.channel(`household:${householdId}`);
      const cleanup = () => {
        supabase.removeChannel(channel);
        resolve();
      };

      channel.subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        channel
          .send({
            type: 'broadcast',
            event: 'data_changed',
            payload: { table, ts: Date.now() },
          })
          .then(cleanup)
          .catch(cleanup);
      });

      // Safety: don't hang forever if subscribe never fires
      setTimeout(cleanup, 3000);
    } catch {
      resolve();
    }
  });
}
