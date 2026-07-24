import type { NextRequest } from 'next/server';

/**
 * The origin the browser actually used, for building absolute redirects.
 *
 * `new URL(request.url).origin` reflects the address the server is BOUND to,
 * not the one the client asked for. The dev script runs `next dev -H 0.0.0.0`,
 * so that origin comes back as `http://0.0.0.0:3000` — a bind address, not a
 * routable destination. Redirecting a real browser there fails, which looked
 * exactly like "login bounced me back": the session cookie was set correctly,
 * then the follow-up navigation went nowhere.
 *
 * Behind a proxy (Vercel) the client-facing values arrive in x-forwarded-*,
 * so prefer those, then the Host header, and only fall back to request.url.
 */
export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host');

  if (host && !host.startsWith('0.0.0.0')) {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const proto = forwardedProto ?? (host.startsWith('localhost') || /^\d/.test(host) ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}
