/**
 * Sends a broadcast message to all members of a household via Supabase's
 * Realtime REST API. Plain HTTP POST — no WebSocket handshake required.
 *
 * Fires with a 1.5s timeout so it can never block the API route. If the
 * broadcast fails, household members will pick up the change from the
 * 3s polling fallback in useTransactions.
 */
export async function notifyHousehold(householdId: string, table: string): Promise<void> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const key = (serviceKey && serviceKey !== 'your-service-role-key-here')
      ? serviceKey
      : anonKey;

    if (!url || !key) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    try {
      await fetch(`${url}/realtime/v1/api/broadcast`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              topic: `household:${householdId}`,
              event: 'data_changed',
              payload: { table, ts: Date.now() },
              private: false,
            },
          ],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // best-effort — polling is the fallback
  }
}
