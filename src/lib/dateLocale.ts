import type { AppLanguage } from '@/store/settingsStore';

/**
 * Maps the in-app language picker value to a BCP-47 locale tag suitable for
 * `Date#toLocaleDateString` / `Intl.*`. Pass through `getDateLocale(language)`
 * everywhere instead of hardcoding 'en-GB' so weekday/month names follow the
 * user's chosen language.
 */
export const APP_LANGUAGE_TO_LOCALE: Record<AppLanguage, string> = {
  en: 'en-GB',
  ro: 'ro-RO',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pl: 'pl-PL',
};

export function getDateLocale(language: AppLanguage): string {
  return APP_LANGUAGE_TO_LOCALE[language] ?? 'en-GB';
}
