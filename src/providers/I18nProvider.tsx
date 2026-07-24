'use client';

import { useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useSettingsStore } from '@/store/settingsStore';
import type { AppLanguage } from '@/store/settingsStore';
import en from '@/messages/en.json';
import ro from '@/messages/ro.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import pl from '@/messages/pl.json';

const messages = { en, ro, es, fr, de, pl } as const;

const SUPPORTED = Object.keys(messages) as AppLanguage[];

/** Matches `navigator.languages` against the languages we ship, e.g. de-AT → de. */
function detectBrowserLanguage(): AppLanguage | null {
  if (typeof navigator === 'undefined') return null;
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    const base = tag?.split('-')[0]?.toLowerCase();
    const match = SUPPORTED.find((l) => l === base);
    if (match) return match;
  }
  return null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSettingsStore((s) => s.language) ?? 'en';
  const languageChosen = useSettingsStore((s) => s.languageChosen);
  const setDetectedLanguage = useSettingsStore((s) => s.setDetectedLanguage);

  // Until the user picks a language in Settings, follow the browser — otherwise
  // the login screen (which renders before any saved settings load) is always
  // English. Runs after mount so it can't cause a hydration mismatch.
  useEffect(() => {
    if (languageChosen) return;
    const detected = detectBrowserLanguage();
    if (detected && detected !== language) setDetectedLanguage(detected);
  }, [languageChosen, language, setDetectedLanguage]);

  // Without an explicit timeZone, next-intl warns and falls back to the
  // runtime's zone — which differs between the server render and the browser,
  // producing hydration mismatches on any formatted date. UTC on the server,
  // the user's real zone once we're in the browser.
  const timeZone = typeof window === 'undefined'
    ? 'UTC'
    : Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <NextIntlClientProvider locale={language} timeZone={timeZone} messages={messages[language]}>
      {children}
    </NextIntlClientProvider>
  );
}
