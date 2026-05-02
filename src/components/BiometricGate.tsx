'use client';

/**
 * BiometricGate
 *
 * UI-level lock that hides app content until the user authenticates with
 * Face ID / Touch ID / fingerprint. Mounted inside Providers so it wraps the
 * entire app tree.
 *
 * Behaviour:
 *  - On web → renders children unconditionally (no-op)
 *  - On native + setting OFF → renders children unconditionally
 *  - On native + setting ON → shows lock screen until biometric passes; relocks
 *    automatically whenever the OS backgrounds the app (appStateChange)
 *
 * The Supabase session itself is persisted by the SSR client; this gate only
 * controls *visibility*, not session validity.
 */

import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useSettingsStore } from '@/store/settingsStore';
import { authenticateWithBiometric } from '@/lib/biometric';

interface Props {
  children: React.ReactNode;
}

export function BiometricGate({ children }: Props) {
  const enabled = useSettingsStore((s) => s.biometricEnabled);
  const [isNative, setIsNative] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const promptedOnce = useRef(false);

  // Detect native after mount (avoids SSR mismatch)
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // Relock whenever the app is backgrounded
  useEffect(() => {
    if (!isNative || !enabled) return;
    let cleanup = () => {};
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            setUnlocked(false);
            promptedOnce.current = false;
          }
        });
        cleanup = () => { listener.remove(); };
      } catch { /* native bridge unavailable */ }
    })();
    return () => cleanup();
  }, [isNative, enabled]);

  // Auto-prompt once when locked (subsequent attempts require user tap)
  useEffect(() => {
    if (!isNative || !enabled || unlocked || busy || promptedOnce.current) return;
    promptedOnce.current = true;
    setBusy(true);
    authenticateWithBiometric('Unlock Spentum').then((ok) => {
      setUnlocked(ok);
      setBusy(false);
    });
  }, [isNative, enabled, unlocked, busy]);

  async function tryUnlock() {
    if (busy) return;
    setBusy(true);
    const ok = await authenticateWithBiometric('Unlock Spentum');
    setUnlocked(ok);
    setBusy(false);
  }

  if (!isNative || !enabled || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 bg-brand-bg dark:bg-[#0A1F1E] px-6">
      <div className="flex flex-col items-center gap-2">
        <div className="text-3xl font-bold tracking-tight text-brand-text dark:text-teal-100">
          Spentum
        </div>
        <p className="text-sm text-brand-text/70 dark:text-teal-200/70">
          App locked
        </p>
      </div>

      <button
        type="button"
        onClick={tryUnlock}
        disabled={busy}
        className="rounded-2xl bg-brand-accent px-8 py-3 text-base font-semibold text-white shadow-lg disabled:opacity-50"
      >
        {busy ? 'Verifying…' : 'Unlock'}
      </button>
    </div>
  );
}
