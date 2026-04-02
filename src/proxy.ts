import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // ── Preview password gate ──────────────────────────────────────────────────
  const previewPassword = process.env.PREVIEW_PASSWORD;
  const isGateExempt =
    pathname.startsWith('/preview') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/preview-auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons');

  if (previewPassword && !isGateExempt) {
    const cookie = request.cookies.get('preview_access');
    if (cookie?.value !== 'granted') {
      const url = request.nextUrl.clone();
      url.pathname = '/preview';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/preview') ||
    pathname.startsWith('/api/preview-auth') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/blog') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt';

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|xml|txt|webmanifest)$).*)',
  ],
};
