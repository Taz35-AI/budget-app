/**
 * Sends a broadcast message to all members of a household via Supabase's
 * Realtime REST API. Plain HTTP POST — no WebSocket handshake, no subscribe
 * dance. Works reliably in serverless (Vercel) environments because it's
 * just one fetch that completes before the function terminates.
 *
 * Browser clients subscribe to the `household:{id}` channel in HouseholdSync
 * and invalidate React Query caches when the `data_changed` event arrives.
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

    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
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
  } catch {
    // best-effort — polling is the fallback
  }
}
