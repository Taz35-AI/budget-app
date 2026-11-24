/**
 * Validates a "where to go next" value taken from a URL before redirecting.
 *
 * These parameters are attacker-controllable, and the redirect is built as
 * `${origin}${next}`. Without a check, `next=@evil.example` produces
 * `https://www.spentum.com@evil.example` (the real host becomes the username
 * part of the URL) and `next=.evil.example` produces a different hostname
 * entirely: a link that looks like ours, signs the person in, and lands them
 * on someone else's site.
 *
 * Only same-site paths are allowed: a single leading slash, then anything that
 * can't be reinterpreted as a host.
 */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (typeof next !== 'string' || next.length === 0) return fallback;
  // Must be an absolute path on this site.
  if (!next.startsWith('/')) return fallback;
  // `//host` and `/\host` are protocol-relative URLs to another origin.
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  // Control characters and backslashes are normalised inconsistently by
  // browsers; nothing legitimate needs them.
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}
