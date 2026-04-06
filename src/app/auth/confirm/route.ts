import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'email' | 'recovery' | null;
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/dashboard');

  if (token_hash && type) {
    const cookieStore = await cookies();

    // Collect cookies so we can set them on the redirect response
    const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Update the cookie store so later reads see the new values
              try { cookieStore.set(name, value, options); } catch { /* no-op */ }
              pendingCookies.push({ name, value, options: options as Record<string, unknown> });
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // Attach session cookies to the redirect so the browser is logged in
      pendingCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options),
      );
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+verify+email`);
}
