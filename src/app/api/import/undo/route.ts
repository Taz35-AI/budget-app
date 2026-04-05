import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth';
import { notifyHousehold } from '@/lib/household-sync';

// POST /api/import/undo
// Body: { batchId: string }
// Deletes all transactions inserted under the given import_batch_id within
// the caller's household. Only the user who ran the import can undo it.
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, householdId } = ctx;

    const { batchId } = await req.json() as { batchId?: string };
    if (!batchId || typeof batchId !== 'string') {
      return NextResponse.json({ error: 'batchId required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Delete only rows that were inserted by this user in this household
    // as part of the given batch. Scoping by all three prevents deleting
    // anyone else's data even if the batchId is leaked/guessed.
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('import_batch_id', batchId)
      .eq('household_id', householdId)
      .eq('created_by', userId)
      .select('id');

    if (error) {
      console.error('[POST /api/import/undo] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await notifyHousehold(householdId, 'transactions');
    return NextResponse.json({ deleted: data?.length ?? 0 });
  } catch (error) {
    console.error('[POST /api/import/undo] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
