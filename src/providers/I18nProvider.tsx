'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useSettingsStore } from '@/store/settingsStore';
import en from '@/messages/en.json';
import ro from '@/messages/ro.json';
import es from '@/messages/es.json';

const messages = { en, ro, es } as const;

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSettingsStore((s) => s.language) ?? 'en';
  return (
    <NextIntlClientProvider locale={language} messages={messages[language]}>
      {children}
    </NextIntlClientProvider>
  );
}
