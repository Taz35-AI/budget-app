import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS entirely.
 * ONLY use in server-side API routes.
 *
 * Falls back to anon key if SUPABASE_SERVICE_ROLE_KEY is not set.
 * In that case you must run the dev RLS migration (002_dev_rls.sql)
 * so the anon key can read/write without auth context.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

  const key = serviceKey && serviceKey !== 'your-service-role-key-here'
    ? serviceKey
    : anonKey;

  if (!key) throw new Error('Missing Supabase key');

  if (!serviceKey || serviceKey === 'your-service-role-key-here') {
    console.warn(
      '[BudgetTool] SUPABASE_SERVICE_ROLE_KEY not set — using anon key.\n' +
      'Run supabase/migrations/002_dev_rls.sql to allow anon key to read/write.',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
