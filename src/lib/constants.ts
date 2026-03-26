import type { CurrencyCode, Frequency } from '@/types';

export const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000001';

export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string; locale: string }> = {
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', locale: 'de-CH' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  DKK: { symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  PLN: { symbol: 'zł', name: 'Polish Złoty', locale: 'pl-PL' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint', locale: 'hu-HU' },
  RON: { symbol: 'lei', name: 'Romanian Leu', locale: 'ro-RO' },
  BGN: { symbol: 'лв', name: 'Bulgarian Lev', locale: 'bg-BG' },
  HRK: { symbol: 'kn', name: 'Croatian Kuna', locale: 'hr-HR' },
};

export const FREQUENCIES: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Every 3 months',
  semiannual: 'Every 6 months',
  annual: 'Yearly',
};

export const SEVEN_YEARS_DAYS = 365 * 7 + 2; // +2 for leap years

export const TAGS: Record<string, { label: string; color: string; category: 'income' | 'expense' | 'both' }> = {
  // ── Expense ──────────────────────────────────────────────────────────────────
  food:          { label: 'Food & Drink',   color: '#f97316', category: 'expense' },
  transport:     { label: 'Transport',       color: '#3b82f6', category: 'expense' },
  housing:       { label: 'Housing',         color: '#8b5cf6', category: 'expense' },
  utilities:     { label: 'Utilities',       color: '#eab308', category: 'expense' },
  entertainment: { label: 'Entertainment',   color: '#ec4899', category: 'expense' },
  health:        { label: 'Health',          color: '#ef4444', category: 'expense' },
  shopping:      { label: 'Shopping',        color: '#14b8a6', category: 'expense' },
  // ── Income ───────────────────────────────────────────────────────────────────
  salary:        { label: 'Salary',          color: '#22c55e', category: 'income'  },
  freelance:     { label: 'Freelance',       color: '#10b981', category: 'income'  },
  investment:    { label: 'Investment',      color: '#6366f1', category: 'income'  },
  // ── Both ─────────────────────────────────────────────────────────────────────
  savings:       { label: 'Savings',         color: '#8b5cf6', category: 'both'    },
  other:         { label: 'Other',           color: '#6b7280', category: 'both'    },
};
