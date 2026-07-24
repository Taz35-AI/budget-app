import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRequestOrigin } from '@/lib/requestOrigin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Not request.url's origin — see getRequestOrigin.
  const origin = getRequestOrigin(request);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate+with+Google`);
}
