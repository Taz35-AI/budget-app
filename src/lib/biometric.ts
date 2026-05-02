/**
 * biometric.ts
 *
 * Thin wrapper around @aparajita/capacitor-biometric-auth.
 *
 * Used as a UI-level app lock: the Supabase session is already persisted by
 * the browser client; this wrapper only gates *visibility* of the UI behind
 * Face ID / fingerprint. We do NOT store the refresh token ourselves.
 *
 * Every public function starts with a `Capacitor.isNativePlatform()` guard so
 * web (browser / Vercel preview) gets a silent no-op fallback.
 */

import { Capacitor } from '@capacitor/core';

export interface BiometricStatus {
  available: boolean;
  /** human-readable reason when unavailable (debug only) */
  reason?: string;
}

export async function checkBiometricAvailable(): Promise<BiometricStatus> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, reason: 'web' };
  }
  try {
    const mod = await import('@aparajita/capacitor-biometric-auth');
    const result = await mod.BiometricAuth.checkBiometry();
    return {
      available: result.isAvailable === true,
      reason: result.reason,
    };
  } catch (err) {
    return { available: false, reason: String(err) };
  }
}

/**
 * Prompts the user to authenticate via biometric.
 * Returns true on success, false if cancelled / failed / unavailable.
 *
 * On web, always returns true (no-op) so the gate doesn't block development.
 */
export async function authenticateWithBiometric(reason: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const mod = await import('@aparajita/capacitor-biometric-auth');
    await mod.BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancel',
      androidTitle: 'Spentum',
      androidSubtitle: "Confirm it's you",
      androidConfirmationRequired: false,
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}
