import { NextRequest, NextResponse } from 'next/server';
import { format, addDays } from 'date-fns';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeBalances } from '@/engine/balanceEngine';
import { SEVEN_YEARS_DAYS } from '@/lib/constants';
import { getAuthUserId } from '@/lib/auth';
import type { Transaction, TransactionException } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = from ?? format(today, 'yyyy-MM-dd');
    const toDate = to ?? format(addDays(today, SEVEN_YEARS_DAYS), 'yyyy-MM-dd');

    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    // ── 1. Try cache first ───────────────────────────────────────────────
    const { data: cached } = await supabase
      .from('daily_balance_cache')
      .select('date, balance')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });

    // Check if cache is complete for the requested range
    // A simple heuristic: if we have at least 90% of expected days, trust the cache
    const expectedDays = daysBetween(fromDate, toDate) + 1;
    const cachedDays = cached?.length ?? 0;

    if (cachedDays >= expectedDays * 0.9) {
      const balanceMap: Record<string, number> = {};
      for (const row of cached!) {
        balanceMap[row.date] = Number(row.balance);
      }
      return NextResponse.json({ balances: balanceMap, source: 'cache' });
    }

    // ── 2. Cache miss — compute inline ──────────────────────────────────
    const [txResult, excResult, resetResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('transaction_exceptions')
        .select('*')
        .in(
          'transaction_id',
          // sub-select would be cleaner but this works for now
          (await supabase.from('transactions').select('id').eq('user_id', userId))
            .data?.map((t) => t.id) ?? [],
        ),
      supabase
        .from('balance_resets')
        .select('reset_date')
        .eq('user_id', userId)
        .order('reset_date', { ascending: false })
        .limit(1),
    ]);

    const transactions: Transaction[] = txResult.data ?? [];
    const exceptions: TransactionException[] = excResult.data ?? [];
    const resetDate = resetResult.data?.[0]?.reset_date ?? null;

    const { balances: balanceMap } = computeBalances({
      transactions,
      exceptions,
      resetDate,
      fromDate,
      toDate,
    });

    // Serialize map to plain object
    const result: Record<string, number> = {};
    balanceMap.forEach((balance, date) => {
      result[date] = balance;
    });

    // ── 3. Write to cache asynchronously (don't block response) ─────────
    void writeToCache(userId, result);

    return NextResponse.json({ balances: result, source: 'computed' });
  } catch (error) {
    console.error('GET /api/balances error:', error);
    return NextResponse.json({ error: 'Failed to compute balances' }, { status: 500 });
  }
}

async function writeToCache(userId: string, balances: Record<string, number>) {
  try {
    const supabase = createAdminClient();
    const rows = Object.entries(balances).map(([date, balance]) => ({
      user_id: userId,
      date,
      balance,
    }));

    // Batch upsert in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      await supabase
        .from('daily_balance_cache')
        .upsert(rows.slice(i, i + chunkSize), { onConflict: 'user_id,date' });
    }

    await supabase
      .from('balance_cache_status')
      .upsert(
        { user_id: userId, dirty_from: null, is_computing: false, last_computed: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
  } catch (err) {
    console.error('Cache write error:', err);
  }
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
