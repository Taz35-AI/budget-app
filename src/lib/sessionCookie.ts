/**
 * Cheap, synchronous "is anyone signed in on this device?" check for client
 * code that would otherwise call an authenticated API just to find out.
 *
 * Supabase's browser client stores the session in `sb-<project>-auth-token`
 * cookies (possibly chunked as `.0`, `.1`), which are readable from script.
 * Presence is a hint, not proof: the server still authenticates every request.
 * It only lets logged-out visitors on public pages skip requests that are
 * guaranteed to fail.
 */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)sb-[^=;]*-auth-token/.test(document.cookie);
}

const noopSubscribe = () => () => {};
const getServerSnapshot = () => false;

/** Arguments for `useSyncExternalStore`, so components can read the hint during render. */
export const sessionCookieStore = [noopSubscribe, hasSessionCookie, getServerSnapshot] as const;
