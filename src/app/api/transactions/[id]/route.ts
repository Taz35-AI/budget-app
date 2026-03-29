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
 */
function priorEffectiveException(
  exceptions: ExceptionRow[],
  date: string,
): ExceptionRow | null {
  const before = exceptions
    .filter((e) => e.effective_from < date && !e.is_deleted)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return before[0] ?? null;
}

/**
 * Deletes all exceptions at or after `fromDate` for a given transaction.
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

/**
 * Returns one day before the given YYYY-MM-DD date string.
 */
function dayBefore(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
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
      if (editMode === 'all') {
        // Wipe every exception — direct row is now single source of truth.
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

    // ── Edit from this date forward ───────────────────────────────────────
    if (editMode === 'all_future') {
      // Persist row-level fields (category, frequency, account_id) that
      // exceptions can't store.
      const rowFields: Record<string, unknown> = {};
      if ('account_id' in updates) rowFields.account_id = updates.account_id;
      if ('category'   in updates) rowFields.category   = updates.category;
      if ('frequency'  in updates) rowFields.frequency  = updates.frequency;
      if (Object.keys(rowFields).length > 0) {
        await supabase.from('transactions').update(rowFields).eq('id', id).eq('user_id', userId);
      }

      // Clear all exceptions at/after effectiveFrom on the original series.
      await clearExceptionsFrom(supabase, id, effectiveFrom);

      const newDate = updates.newDate as string | undefined;
      const isDateChange = newDate && newDate !== effectiveFrom;

      if (isDateChange) {
        // ── SPLIT: original series ends just before effectiveFrom,
        //    a new series starts at newDate. ───────────────────────────────
        const rootId = (original.parent_id as string | null) ?? original.id;

        // 1. Cap the original series so it stops before effectiveFrom.
        const { error: capError } = await supabase
          .from('transactions')
          .update({ end_date: dayBefore(effectiveFrom) })
          .eq('id', id);

        if (capError) {
          console.error('[PATCH] all_future split cap error:', capError.message);
          return NextResponse.json({ error: capError.message }, { status: 500 });
        }

        // 2. Create the new series starting at newDate, inheriting fields
        //    the user didn't explicitly change.
        const { data: newTx, error: createError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            account_id: ('account_id' in updates ? updates.account_id : original.account_id) as string | null,
            parent_id: rootId,
            name: (updates.name as string) || original.name,
            amount: updates.amount ? Number(updates.amount) : original.amount,
            category: (updates.category as string) || original.category,
            type: 'recurring',
            tag: original.tag,
            start_date: newDate,
            end_date: (updates.end_date as string) || null,
            frequency: (updates.frequency as string) || original.frequency,
          })
          .select()
          .single();

        if (createError) {
          console.error('[PATCH] all_future split create error:', createError.message);
          return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, mode: 'all_future_split', newTransaction: newTx });
      }

      // No date change — write a standard forward-exception.
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
      if ('account_id' in updates) {
        await supabase
          .from('transactions')
          .update({ account_id: updates.account_id as string | null })
          .eq('id', id)
          .eq('user_id', userId);
      }

      const newDate = updates.newDate as string | undefined;
      const isDateChange = newDate && newDate !== effectiveFrom;

      // Fetch existing exceptions for restore-exception logic.
      const { data: existingExceptions } = await supabase
        .from('transaction_exceptions')
        .select('id, effective_from, name, amount, end_date, is_deleted')
        .eq('transaction_id', id)
        .order('effective_from', { ascending: false });

      const exceptions = (existingExceptions ?? []) as ExceptionRow[];
      const prior = priorEffectiveException(exceptions, effectiveFrom);
      const nextDate = nextOccurrenceAfter(
        original.start_date,
        original.frequency as Frequency,
        effectiveFrom,
      );

      if (isDateChange) {
        // ── MOVE: delete this occurrence, spawn a one-off at newDate. ─────
        const rootId = (original.parent_id as string | null) ?? original.id;

        // 1. Mark the original occurrence as deleted.
        const { error: delError } = await supabase
          .from('transaction_exceptions')
          .upsert(
            { transaction_id: id, effective_from: effectiveFrom, is_deleted: true },
            { onConflict: 'transaction_id,effective_from' },
          );

        if (delError) {
          console.error('[PATCH] this_only move delete error:', delError.message);
          return NextResponse.json({ error: delError.message }, { status: 500 });
        }

        // 2. Restore the next occurrence to what it was before this edit.
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
          console.error('[PATCH] this_only move restore error:', restoreError.message);
          return NextResponse.json({ error: restoreError.message }, { status: 500 });
        }

        // 3. Create a one-off transaction on the new date.
        const { data: newTx, error: createError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            account_id: ('account_id' in updates ? updates.account_id : original.account_id) as string | null,
            parent_id: rootId,
            name: (updates.name as string) || original.name,
            amount: updates.amount ? Number(updates.amount) : original.amount,
            category: original.category,
            type: 'one_off',
            tag: original.tag,
            date: newDate,
          })
          .select()
          .single();

        if (createError) {
          console.error('[PATCH] this_only move create error:', createError.message);
          return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, mode: 'this_only_moved', newTransaction: newTx, movedTo: newDate });
      }

      // No date change — standard this_only override.
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

    // ── One-off: simple single delete (even if it has parent_id) ─────────
    if (original.type === 'one_off') {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error('[DELETE] one_off delete error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, mode: 'hard_deleted' });
    }

    // ── Delete entire series (recurring) — wipe the whole family ─────────
    if (deleteMode === 'all') {
      // Resolve root: if this transaction itself has a parent, that's the root.
      // Otherwise this IS the root.
      const rootId = (original.parent_id as string | null) ?? original.id;

      // Find every transaction in this family (root + all splits/spawns).
      const { data: family } = await supabase
        .from('transactions')
        .select('id')
        .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
        .eq('user_id', userId);

      const familyIds = (family ?? []).map((t) => t.id);
      // Safety: make sure the triggered id is included even if query missed it.
      if (!familyIds.includes(id)) familyIds.push(id);

      // transaction_exceptions has ON DELETE CASCADE, but we delete explicitly
      // for clarity and to handle any edge cases.
      await supabase
        .from('transaction_exceptions')
        .delete()
        .in('transaction_id', familyIds);

      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', familyIds)
        .eq('user_id', userId);

      if (error) {
        console.error('[DELETE] family delete error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, mode: 'family_deleted', count: familyIds.length });
    }

    if (!effectiveFrom) {
      return NextResponse.json({ error: 'effectiveFrom required' }, { status: 400 });
    }

    // ── Delete from this date forward ─────────────────────────────────────
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
