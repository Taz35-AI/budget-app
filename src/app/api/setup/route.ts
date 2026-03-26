import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DUMMY_USER_ID } from '@/lib/constants';

/**
 * Diagnostic + seed endpoint — dev only.
 * Blocked in production to avoid accidental data exposure.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasServiceKey = !!serviceKey && serviceKey !== 'your-service-role-key-here';
  const key = hasServiceKey ? serviceKey! : anonKey;

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const report: Record<string, unknown> = {
    hasServiceKey,
    keyType: hasServiceKey ? 'service_role (bypasses RLS ✓)' : 'anon (blocked by RLS unless 002_dev_rls.sql was run)',
  };

  // ── 1. Can we read transactions? ─────────────────────────────────────
  const { data: rows, error: readErr } = await supabase
    .from('transactions')
    .select('id')
    .limit(1);

  report.canRead = !readErr;
  report.readError = readErr?.message ?? null;
  report.existingRows = rows?.length ?? 0;

  // ── 2. Can we write? ──────────────────────────────────────────────────
  const testDate = new Date().toISOString().split('T')[0];
  const { data: inserted, error: writeErr } = await supabase
    .from('transactions')
    .insert({
      user_id: DUMMY_USER_ID,
      name: '__setup_test__',
      amount: 1,
      category: 'income',
      type: 'one_off',
      date: testDate,
    })
    .select('id')
    .single();

  report.canWrite = !writeErr;
  report.writeError = writeErr?.message ?? null;

  // Clean up test row
  if (inserted?.id) {
    await supabase.from('transactions').delete().eq('id', inserted.id);
  }

  // ── 3. Seed if writable and empty ─────────────────────────────────────
  let seeded = false;
  if (!writeErr && rows?.length === 0) {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fiveDaysOut = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { error: seedErr } = await supabase.from('transactions').insert([
      { user_id: DUMMY_USER_ID, name: 'Monthly Salary',    amount: 3200, category: 'income',  type: 'recurring', start_date: twoMonthsAgo, frequency: 'monthly' },
      { user_id: DUMMY_USER_ID, name: 'Rent',              amount: 1200, category: 'expense', type: 'recurring', start_date: twoMonthsAgo, frequency: 'monthly' },
      { user_id: DUMMY_USER_ID, name: 'Groceries',         amount: 80,   category: 'expense', type: 'recurring', start_date: twoMonthsAgo, frequency: 'weekly'  },
      { user_id: DUMMY_USER_ID, name: 'Streaming',         amount: 15,   category: 'expense', type: 'recurring', start_date: twoMonthsAgo, frequency: 'monthly' },
      { user_id: DUMMY_USER_ID, name: 'Freelance Payment', amount: 500,  category: 'income',  type: 'one_off',   date: fiveDaysOut },
    ]);
    seeded = !seedErr;
    report.seedError = seedErr?.message ?? null;
  }
  report.seeded = seeded;

  // ── 4. Instructions ───────────────────────────────────────────────────
  const instructions: string[] = [];

  if (writeErr?.code === '42501') {
    instructions.push(
      '🔴 RLS is blocking writes. Do ONE of the following:',
      '',
      'OPTION A — Run this SQL in Supabase SQL Editor (supabase.com → your project → SQL Editor):',
      '',
      `  DROP POLICY IF EXISTS "users_own_transactions"      ON transactions;`,
      `  DROP POLICY IF EXISTS "users_own_exceptions"        ON transaction_exceptions;`,
      `  DROP POLICY IF EXISTS "users_own_resets"            ON balance_resets;`,
      `  DROP POLICY IF EXISTS "users_own_cache"             ON daily_balance_cache;`,
      `  DROP POLICY IF EXISTS "users_own_cache_status"      ON balance_cache_status;`,
      `  CREATE POLICY "dev_allow_all" ON transactions           FOR ALL USING (true) WITH CHECK (true);`,
      `  CREATE POLICY "dev_allow_all" ON transaction_exceptions FOR ALL USING (true) WITH CHECK (true);`,
      `  CREATE POLICY "dev_allow_all" ON balance_resets         FOR ALL USING (true) WITH CHECK (true);`,
      `  CREATE POLICY "dev_allow_all" ON daily_balance_cache    FOR ALL USING (true) WITH CHECK (true);`,
      `  CREATE POLICY "dev_allow_all" ON balance_cache_status   FOR ALL USING (true) WITH CHECK (true);`,
      '',
      'OPTION B — Add your service_role key to .env.local:',
      '  SUPABASE_SERVICE_ROLE_KEY=<key from Supabase Dashboard → Settings → API → service_role>',
      '  Then restart the dev server and call /api/setup again.',
    );
  } else if (!readErr && !writeErr) {
    instructions.push('✅ Everything is working. Refresh the dashboard.');
  }

  report.instructions = instructions;
  return NextResponse.json(report, { status: 200 });
}
