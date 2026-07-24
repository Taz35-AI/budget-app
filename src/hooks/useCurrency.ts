'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { CurrencyCode } from '@/types';
import { CURRENCIES } from '@/lib/constants';

const STORAGE_KEY = 'budgetapp_currency';
const DEFAULT_CURRENCY: CurrencyCode = 'GBP';

// Subscribers in this tab. The `storage` event only fires in OTHER tabs, so
// same-tab writes have to notify explicitly.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSnapshot(): CurrencyCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && saved in CURRENCIES ? (saved as CurrencyCode) : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

const getServerSnapshot = (): CurrencyCode => DEFAULT_CURRENCY;

export function useCurrency() {
  // Read straight from storage during render instead of copying it into state
  // via an effect — that avoids the extra render pass and keeps every mounted
  // component (and every open tab) on the same currency.
  const currency = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCurrency = useCallback((code: CurrencyCode) => {
    localStorage.setItem(STORAGE_KEY, code);
    listeners.forEach((l) => l());
  }, []);

  const formatAmount = useCallback(
    (amount: number, options?: { compact?: boolean }) => {
      const { symbol, locale } = CURRENCIES[currency];
      const sign = amount < 0 ? '-' : '';
      const abs = Math.abs(amount);
      if (options?.compact && abs >= 1000) {
        const formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        }).format(abs / 1000);
        return `${sign}${symbol}${formatted}k`;
      }
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(abs);
      return `${sign}${symbol}${formatted}`;
    },
    [currency],
  );

  return {
    currency,
    setCurrency,
    symbol: CURRENCIES[currency].symbol,
    formatAmount,
    currencyInfo: CURRENCIES[currency],
  };
}
