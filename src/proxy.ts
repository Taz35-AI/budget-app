import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Inactivity timeout: 7 days in seconds
const SESSION_TIMEOUT_S = 7 * 24 * 60 * 60;

// Auth-check cache window. supabase.auth.getUser() does a network round-trip
// to /auth/v1/user on every call (~150-400ms from a mobile client). For 60s
// after a successful check we trust an httpOnly cookie instead, cutting that
// latency from every subsequent navigation and API call. Tradeoff: a session
// revoked elsewhere stays "authed" in this proxy for up to 60s — accepted
// because downstream API routes do their own row-level auth via Supabase RLS
// and would 401 anyway.
const AUTH_CACHE_KEY = 'spentum_auth_check';
const AUTH_CACHE_TTL_S = 60;

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

  const pathname = request.nextUrl.pathname;
  const now = Math.floor(Date.now() / 1000);

  // Hot path: trust the auth-check cookie if it was set in the last 60s
  const cachedTs = request.cookies.get(AUTH_CACHE_KEY)?.value;
  const cacheValid = !!cachedTs && now - Number(cachedTs) < AUTH_CACHE_TTL_S;

  let user: { id: string } | null = null;
  if (cacheValid) {
    // Synthetic user object — downstream logic only branches on truthiness
    user = { id: 'cached' };
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      response.cookies.set(AUTH_CACHE_KEY, String(now), {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: AUTH_CACHE_TTL_S,
      });
    } else {
      response.cookies.delete(AUTH_CACHE_KEY);
    }
  }

  // ── Session inactivity timeout ──────────────────────────────────────────────
  if (user) {
    const lastActive = request.cookies.get('spentum_last_active')?.value;

    if (lastActive && now - Number(lastActive) > SESSION_TIMEOUT_S) {
      // Session expired due to inactivity — sign out (uncached path so the
      // network signOut actually fires)
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('reason', 'timeout');
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.delete('spentum_last_active');
      redirectResponse.cookies.delete(AUTH_CACHE_KEY);
      return redirectResponse;
    }

    // Refresh the activity timestamp
    response.cookies.set('spentum_last_active', String(now), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TIMEOUT_S,
    });
  }

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
    pathname.startsWith('/widget') ||
    pathname.startsWith('/invite') ||
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
