import { after } from 'next/server';

/**
 * Tells the other members of a household that data changed.
 *
 * The broadcast is scheduled with `after()` so it runs once the response has
 * been sent: the person who made the change no longer waits on an extra HTTP
 * round trip (up to the 1.5s timeout) before their request completes. Callers
 * may still `await` this; it resolves immediately.
 */
export async function notifyHousehold(householdId: string, table: string): Promise<void> {
  try {
    after(() => sendBroadcast(householdId, table));
  } catch {
    // Outside a request scope (scripts, tests) there is no response to wait
    // for; send it without blocking the caller.
    void sendBroadcast(householdId, table);
  }
}

/**
 * Sends a broadcast message to all members of a household via Supabase's
 * Realtime REST API. Plain HTTP POST — no WebSocket handshake required.
 *
 * Best-effort with a 1.5s timeout. If it fails, household members pick up the
 * change from the polling fallback in useTransactions.
 */
async function sendBroadcast(householdId: string, table: string): Promise<void> {
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
