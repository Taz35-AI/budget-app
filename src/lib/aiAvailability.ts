/**
 * Single switch for the two Grok-backed features (CSV auto-categorise and
 * monthly insights).
 *
 * Both cost money per call, so they need to be turn-off-able without a code
 * change — an expired xAI balance should hide the buttons, not hand users a
 * feature that always errors.
 *
 * Server-side the deciding factor is whether XAI_API_KEY is set. The client
 * can't read that, so `NEXT_PUBLIC_AI_ENABLED=false` lets the UI hide the
 * entry points too. Unset means enabled, so existing deployments are unchanged.
 */

/** Client-safe: should AI entry points be shown at all? */
export function isAiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_ENABLED !== 'false';
}

/** Server-only: is the upstream actually callable? */
export function hasAiCredentials(): boolean {
  return Boolean(process.env.XAI_API_KEY) && process.env.AI_DISABLED !== 'true';
}

/**
 * True when an upstream failure means "we can't serve this right now" rather
 * than "the request was bad" — no credit, expired key, quota exhausted. These
 * should surface to the user as a temporary outage, never as a 500.
 */
export function isUpstreamUnavailable(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (status === 401 || status === 402 || status === 403 || status === 429) return true;
  if (typeof status === 'number' && status >= 500) return true;

  const message = String((error as { message?: string } | null)?.message ?? '').toLowerCase();
  return (
    message.includes('credit') ||
    message.includes('quota') ||
    message.includes('billing') ||
    message.includes('insufficient') ||
    message.includes('rate limit')
  );
}
