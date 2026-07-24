import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (first-time user)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data?.settings ?? null);
}

/** Postgres jsonb can hold far more, but a settings blob this big is a bug. */
const MAX_SETTINGS_BYTES = 512 * 1024;

export async function PUT(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
  }
  if (JSON.stringify(body).length > MAX_SETTINGS_BYTES) {
    return NextResponse.json({ error: 'Settings payload too large' }, { status: 413 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings: body }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
