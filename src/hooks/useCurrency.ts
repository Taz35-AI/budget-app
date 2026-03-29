'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CurrencyCode } from '@/types';
import { CURRENCIES } from '@/lib/constants';

const STORAGE_KEY = 'budgetapp_currency';

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>('GBP');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (saved && saved in CURRENCIES) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
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
