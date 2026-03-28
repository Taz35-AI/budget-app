import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUserId } from '@/lib/auth';
import { nextOccurrenceAfter } from '@/engine/recurringResolver';
import type { Frequency } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ExceptionRow {
  id: string;
  effective_from: string;
  name: string | null;
  amount: number | null;
  end_date: string | null;
  is_deleted: boolean;
}

/**
 * Returns the exception row whose values are in effect on or just before `date`.
 * This is used to build "restore" exceptions so that after a this_only edit,
 * the next occurrence reverts to whatever was actually in effect before — not
 * just the original transaction row (which may itself be overridden).
 */
function priorEffectiveException(
  exceptions: ExceptionRow[],
  date: string,
): ExceptionRow | null {
  const before = exceptions
    // strictly before, not equal; exclude deletions — they only affect their own
    // occurrence and must not propagate is_deleted into a restore exception
    .filter((e) => e.effective_from < date && !e.is_deleted)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return before[0] ?? null;
}

/**
 * Deletes all exceptions at or after `fromDate` for a given transaction.
 * Called before writing an all_future exception so that no later override
 * can "peek through" and break the series continuity.
 */
async function clearExceptionsFrom(
  supabase: ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>,
  transactionId: string,
  fromDate: string,
) {
  const { error } = await supabase
    .from('transaction_exceptions')
    .delete()
    .eq('transaction_id', transactionId)
    .gte('effective_from', fromDate);

  if (error) {
    console.error('[clearExceptionsFrom] error:', error.message);
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();
    const supabase = createAdminClient();

    const { editMode, effectiveFrom, ...updates } = body as {
      editMode: 'all' | 'all_future' | 'this_only';
      effectiveFrom?: string;
      [k: string]: unknown;
    };

    const { data: original, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // ── One-off OR edit entire series ─────────────────────────────────────
    if (original.type === 'one_off' || editMode === 'all') {
      // For "edit all": also wipe every exception — the direct row update
      // is now the single source of truth for the whole series.
      if (editMode === 'all') {
        await supabase
          .from('transaction_exceptions')
          .delete()
          .eq('transaction_id', id);
      }

      const { data, error } = await supabase
        .from('transactions')
        .update({
          name: (updates.name as string) || original.name,
          amount: updates.amount ? Number(updates.amount) : original.amount,
          category: (updates.category as string) || original.category,
          tag: 'tag' in updates ? ((updates.tag as string) || null) : original.tag,
          date: (updates.date as string) || original.date,
          start_date: (updates.start_date as string) || original.start_date,
          end_date: (updates.end_date as string) || null,
          frequency: (updates.frequency as string) || original.frequency,
          account_id: 'account_id' in updates ? (updates.account_id as string | null) : original.account_id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[PATCH] direct update error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ transaction: data });
    }

    if (!effectiveFrom) {
      return NextResponse.json({ error: 'effectiveFrom is required for recurring edits' }, { status: 400 });
    }

    // category, frequency, account_id live on the transaction row — exceptions
    // can't store them. Persist any that changed directly on the row now, before
    // writing the exception, so the change is never silently discarded.
    //
    // all_future: all three fields are meaningful to update (the series changes).
    // this_only:  category/frequency would change every occurrence so we skip
    //             them; only account_id (which already row-scoped) is persisted.
    if (editMode === 'all_future') {
      const rowFields: Record<string, unknown> = {};
      if ('account_id' in updates) rowFields.account_id = updates.account_id;
      if ('category'   in updates) rowFields.category   = updates.category;
      if ('frequency'  in updates) rowFields.frequency  = updates.frequency;
      if (Object.keys(rowFields).length > 0) {
        await supabase.from('transactions').update(rowFields).eq('id', id).eq('user_id', userId);
      }
    } else if (editMode === 'this_only' && 'account_id' in updates) {
      await supabase
        .from('transactions')
        .update({ account_id: updates.account_id as string | null })
        .eq('id', id)
        .eq('user_id', userId);
    }

    // ── Edit from this date forward ───────────────────────────────────────
    // Clear all exceptions at/after effectiveFrom so that the new exception
    // is the sole authority from that point — no prior exceptions can override.
    if (editMode === 'all_future') {
      await clearExceptionsFrom(supabase, id, effectiveFrom);

      const { error } = await supabase
        .from('transaction_exceptions')
        .insert({
          transaction_id: id,
          effective_from: effectiveFrom,
          name: (updates.name as string) || null,
          amount: updates.amount ? Number(updates.amount) : null,
          end_date: (updates.end_date as string) || null,
          is_deleted: false,
        });

      if (error) {
        console.error('[PATCH] all_future error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, mode: 'all_future' });
    }

    // ── Edit this occurrence only ─────────────────────────────────────────
    if (editMode === 'this_only') {
      // Fetch all current exceptions so we can compute the prior effective values
      const { data: existingExceptions } = await supabase
        .from('transaction_exceptions')
        .select('id, effective_from, name, amount, end_date, is_deleted')
        .eq('transaction_id', id)
        .order('effective_from', { ascending: false });

      const exceptions = (existingExceptions ?? []) as ExceptionRow[];

      // Write the override for this occurrence
      const { error: excError } = await supabase
        .from('transaction_exceptions')
        .upsert(
          {
            transaction_id: id,
            effective_from: effectiveFrom,
            name: (updates.name as string) || null,
            amount: updates.amount ? Number(updates.amount) : null,
            end_date: (updates.end_date as string) || null,
            is_deleted: false,
          },
          { onConflict: 'transaction_id,effective_from' },
        );

      if (excError) {
        console.error('[PATCH] this_only exception error:', excError.message);
        return NextResponse.json({ error: excError.message }, { status: 500 });
      }

      // Build the restore exception using the PRIOR effective values.
      // If there was already an exception before this date, restore to those values.
      // If not, restore to null (= use original transaction row).
      const prior = priorEffectiveException(exceptions, effectiveFrom);
      const nextDate = nextOccurrenceAfter(
        original.start_date,
        original.frequency as Frequency,
        effectiveFrom,
      );

      const { error: restoreError } = await supabase
        .from('transaction_exceptions')
        .upsert(
          {
            transaction_id: id,
            effective_from: nextDate,
            // Carry forward the prior non-deleted values so the restore
            // lands on exactly what was in effect before this edit
            name: prior?.name ?? null,
            amount: prior?.amount ?? null,
            end_date: prior?.end_date ?? null,
            is_deleted: false,
          },
          { onConflict: 'transaction_id,effective_from' },
        );

      if (restoreError) {
        console.error('[PATCH] this_only restore error:', restoreError.message);
        return NextResponse.json({ error: restoreError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, mode: 'this_only', restoreAt: nextDate });
    }

    return NextResponse.json({ error: 'Invalid editMode' }, { status: 400 });
  } catch (error) {
    console.error('[PATCH /api/transactions/[id]] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const effectiveFrom = searchParams.get('effectiveFrom');
    const deleteMode = (searchParams.get('deleteMode') ?? 'all_future') as
      'all' | 'all_future' | 'this_only';
    const supabase = createAdminClient();

    const { data: original, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // ── One-off OR delete entire series ──────────────────────────────────
    if (original.type === 'one_off' || deleteMode === 'all') {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error('[DELETE] hard delete error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, mode: 'hard_deleted' });
    }

    if (!effectiveFrom) {
      return NextResponse.json({ error: 'effectiveFrom required' }, { status: 400 });
    }

    // ── Delete from this date forward ─────────────────────────────────────
    // Clear subsequent exceptions first — nothing should "revive" the series
    // after this point.
    if (deleteMode === 'all_future') {
      await clearExceptionsFrom(supabase, id, effectiveFrom);

      const { error } = await supabase
        .from('transaction_exceptions')
        .insert({
          transaction_id: id,
          effective_from: effectiveFrom,
          is_deleted: true,
        });

      if (error) {
        console.error('[DELETE] all_future error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, mode: 'all_future' });
    }

    // ── Delete this occurrence only ───────────────────────────────────────
    if (deleteMode === 'this_only') {
      const { data: existingExceptions } = await supabase
        .from('transaction_exceptions')
        .select('id, effective_from, name, amount, end_date, is_deleted')
        .eq('transaction_id', id)
        .order('effective_from', { ascending: false });

      const exceptions = (existingExceptions ?? []) as ExceptionRow[];

      // Mark this occurrence deleted
      const { error: delError } = await supabase
        .from('transaction_exceptions')
        .upsert(
          { transaction_id: id, effective_from: effectiveFrom, is_deleted: true },
          { onConflict: 'transaction_id,effective_from' },
        );

      if (delError) {
        console.error('[DELETE] this_only error:', delError.message);
        return NextResponse.json({ error: delError.message }, { status: 500 });
      }

      // Restore at next occurrence using prior effective values
      const prior = priorEffectiveException(exceptions, effectiveFrom);
      const nextDate = nextOccurrenceAfter(
        original.start_date,
        original.frequency as Frequency,
        effectiveFrom,
      );

      const { error: restoreError } = await supabase
        .from('transaction_exceptions')
        .upsert(
          {
            transaction_id: id,
            effective_from: nextDate,
            name: prior?.name ?? null,
            amount: prior?.amount ?? null,
            end_date: prior?.end_date ?? null,
            is_deleted: false,
          },
          { onConflict: 'transaction_id,effective_from' },
        );

      if (restoreError) {
        console.error('[DELETE] this_only restore error:', restoreError.message);
        return NextResponse.json({ error: restoreError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, mode: 'this_only', restoreAt: nextDate });
    }

    return NextResponse.json({ error: 'Invalid deleteMode' }, { status: 400 });
  } catch (error) {
    console.error('[DELETE /api/transactions/[id]] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
