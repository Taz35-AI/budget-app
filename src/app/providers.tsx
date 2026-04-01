'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, createContext, useContext, useEffect } from 'react';
import { SettingsSyncProvider } from '@/components/SettingsSyncProvider';
import { RealtimeSyncProvider } from '@/components/RealtimeSyncProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { CapacitorAuthHandler } from '@/components/CapacitorAuthHandler';
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

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('budgetapp_theme') as Theme | null;
    const initial = saved ?? 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('budgetapp_theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Keyboard height CSS variable ───────────────────────────────────────────────
// Sets --kb on :root so any component can use it for keyboard-aware positioning.
// Only runs on native (Android/iOS) — no-op on web.

function KeyboardProvider() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const show = Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty('--kb', `${info.keyboardHeight}px`);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--kb', '0px');
    });
    return () => {
      show.then((h) => h.remove());
      hide.then((h) => h.remove());
    };
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
              <KeyboardProvider />
              <CapacitorAuthHandler />
              {children}
            </SettingsSyncProvider>
          </RealtimeSyncProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
