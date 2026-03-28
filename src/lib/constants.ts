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
  dining:        { label: 'Dining Out',      color: '#fb923c', category: 'expense' },
  insurance:     { label: 'Insurance',       color: '#64748b', category: 'expense' },
  clothing:      { label: 'Clothing',        color: '#a855f7', category: 'expense' },
  personal_care: { label: 'Personal Care',   color: '#f43f5e', category: 'expense' },
  travel:        { label: 'Travel',          color: '#0ea5e9', category: 'expense' },
  education:     { label: 'Education',       color: '#2563eb', category: 'expense' },
  gifts:         { label: 'Gifts',           color: '#e879f9', category: 'expense' },
  tech:          { label: 'Tech & Gadgets',  color: '#06b6d4', category: 'expense' },
  childcare:     { label: 'Childcare',       color: '#f59e0b', category: 'expense' },
  pets:          { label: 'Pets',            color: '#84cc16', category: 'expense' },
  // ── Income ───────────────────────────────────────────────────────────────────
  salary:        { label: 'Salary',          color: '#22c55e', category: 'income'  },
  freelance:     { label: 'Freelance',       color: '#10b981', category: 'income'  },
  investment:    { label: 'Investment',      color: '#6366f1', category: 'income'  },
  bonus:         { label: 'Bonus',           color: '#4ade80', category: 'income'  },
  rental:        { label: 'Rental Income',   color: '#34d399', category: 'income'  },
  pension:       { label: 'Pension',         color: '#2dd4bf', category: 'income'  },
  benefits:      { label: 'Benefits',        color: '#38bdf8', category: 'income'  },
  cashback:      { label: 'Cashback',        color: '#a3e635', category: 'income'  },
  dividends:     { label: 'Dividends',       color: '#818cf8', category: 'income'  },
  side_hustle:   { label: 'Side Hustle',     color: '#fb7185', category: 'income'  },
  gift_received: { label: 'Gift Received',   color: '#f472b6', category: 'income'  },
  tax_refund:    { label: 'Tax Refund',      color: '#60a5fa', category: 'income'  },
  business:      { label: 'Business',        color: '#c084fc', category: 'income'  },
  // ── Both ─────────────────────────────────────────────────────────────────────
  savings:       { label: 'Savings',         color: '#8b5cf6', category: 'both'    },
  other:         { label: 'Other',           color: '#6b7280', category: 'both'    },
};
