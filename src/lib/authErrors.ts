/**
 * Maps Supabase auth failures to translation keys in the `auth` namespace.
 *
 * Raw `AuthApiError` messages are written for developers ("Invalid login
 * credentials", "AuthApiError: request rate limit reached") and leak
 * implementation detail to users, so every known failure gets friendly,
 * translated copy. Anything unrecognised falls back to `errGeneric`.
 */

export type AuthErrorKey =
  | 'errInvalidCredentials'
  | 'errEmailNotConfirmed'
  | 'errRateLimit'
  | 'errUserExists'
  | 'errWeakPassword'
  | 'errInvalidEmail'
  | 'errNetwork'
  | 'errGeneric';

interface SupabaseAuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
}

/**
 * Prefers the stable `code` field; falls back to message matching for older
 * error shapes that don't carry one.
 */
export function authErrorKey(error: SupabaseAuthErrorLike | null | undefined): AuthErrorKey {
  if (!error) return 'errGeneric';

  switch (error.code) {
    case 'invalid_credentials':
      return 'errInvalidCredentials';
    case 'email_not_confirmed':
      return 'errEmailNotConfirmed';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'errRateLimit';
    case 'user_already_exists':
    case 'email_exists':
      return 'errUserExists';
    case 'weak_password':
      return 'errWeakPassword';
    case 'validation_failed':
      return 'errInvalidEmail';
  }

  if (error.status === 429) return 'errRateLimit';

  // Network failures surface as a TypeError from fetch, not an AuthApiError.
  if (error.name === 'TypeError' || error.name === 'AuthRetryableFetchError') {
    return 'errNetwork';
  }

  const message = (error.message ?? '').toLowerCase();
  if (!message) return 'errGeneric';

  if (message.includes('invalid login credentials')) return 'errInvalidCredentials';
  if (message.includes('email not confirmed')) return 'errEmailNotConfirmed';
  if (message.includes('rate limit') || message.includes('too many requests')) return 'errRateLimit';
  if (message.includes('already registered') || message.includes('already exists')) return 'errUserExists';
  if (message.includes('password should be') || message.includes('weak password')) return 'errWeakPassword';
  if (message.includes('unable to validate email') || message.includes('invalid email')) return 'errInvalidEmail';
  if (message.includes('failed to fetch') || message.includes('network')) return 'errNetwork';

  return 'errGeneric';
}
