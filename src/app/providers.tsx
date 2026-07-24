'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { SettingsSyncProvider } from '@/components/SettingsSyncProvider';
import { RealtimeSyncProvider } from '@/components/RealtimeSyncProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { CapacitorAuthHandler } from '@/components/CapacitorAuthHandler';
import { BiometricGate } from '@/components/BiometricGate';
import { HouseholdSync } from '@/components/HouseholdSync';
import { useOfflinePersist } from '@/hooks/useOfflinePersist';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

// ── Theme ──────────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: 'dark', toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

const THEME_KEY = 'budgetapp_theme';

// Subscribers in this tab; the `storage` event only fires in other tabs.
const themeListeners = new Set<() => void>();

function subscribeTheme(onChange: () => void) {
  themeListeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    themeListeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getThemeSnapshot(): Theme {
  try {
    return (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'dark';
  } catch {
    return 'dark';
  }
}

const getThemeServerSnapshot = (): Theme => 'dark';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read the stored theme during render instead of copying it into state from
  // an effect — that removes the extra render pass (and the flash of the wrong
  // theme it caused) and keeps every tab in sync.
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  // Applying the class is a DOM side effect, so it belongs in an effect.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = getThemeSnapshot() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    themeListeners.forEach((l) => l());
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Keyboard height CSS variable ───────────────────────────────────────────────
// Sets --kb on :root so any component can use it for keyboard-aware positioning.
// Only runs on native (Android/iOS) — no-op on web.

// ── Offline cache hydrator/persister ───────────────────────────────────────────
// Must live inside QueryClientProvider so it has access to the query client.

function OfflinePersistRunner() {
  useOfflinePersist();
  return null;
}

function KeyboardProvider() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const show = Keyboard.addListener('keyboardDidShow', (info) => {
      document.documentElement.style.setProperty('--kb', `${info.keyboardHeight}px`);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      document.documentElement.style.setProperty('--kb', '0px');
    });
    return () => {
      show.then((h) => h.remove());
      hide.then((h) => h.remove());
    };
  }, []);
  return null;
}

// ── Recovery redirect ──────────────────────────────────────────────────────────
// Supabase sometimes appends the recovery token as a hash to the site URL
// (e.g. https://spentum.com/#access_token=...&type=recovery) when the
// redirectTo URL isn't resolved correctly. This detects it client-side and
// forwards the user to the reset-password page before they see the landing page.

function RecoveryRedirectHandler() {
  useEffect(() => {
    // Only intercept on the root path — anywhere else we leave the page alone
    if (window.location.pathname !== '/') return;

    // Hash-based implicit flow: #access_token=...&type=recovery
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Use a real browser navigation so the hash is preserved intact
      window.location.replace('/reset-password' + hash);
      return;
    }

    // PKCE flow: Supabase sent ?code= to the site root instead of redirectTo
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      window.location.replace('/reset-password?code=' + code);
    }
  }, []);

  return null;
}

// ── App Providers ──────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <RealtimeSyncProvider>
            <SettingsSyncProvider>
              <HouseholdSync />
              <RecoveryRedirectHandler />
              <KeyboardProvider />
              <CapacitorAuthHandler />
              <OfflinePersistRunner />
              <BiometricGate>{children}</BiometricGate>
            </SettingsSyncProvider>
          </RealtimeSyncProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
