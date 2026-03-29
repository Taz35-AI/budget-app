import { NextRequest, NextResponse } from 'next/server';

const PREVIEW_PASSWORD = process.env.PREVIEW_PASSWORD;
const COOKIE = 'preview_access';

// Paths that are always public
function isPublic(pathname: string) {
  return (
    pathname.startsWith('/preview') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/public')
  );
}

export function middleware(request: NextRequest) {
  // If no PREVIEW_PASSWORD is set, gate is disabled — let everything through
  if (!PREVIEW_PASSWORD) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const cookie = request.cookies.get(COOKIE);
  if (cookie?.value === PREVIEW_PASSWORD) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/preview';
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
