'use client';

import { CURRENCIES } from '@/lib/constants';
import type { CurrencyCode } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  className?: string;
}

export function CurrencySelector({ value, onChange, className }: Props) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CurrencyCode)}
        className={cn(
          'h-9 pl-3 pr-8 rounded-xl border text-sm font-medium transition-all appearance-none cursor-pointer',
          'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          'dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10',
          'focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/30 focus:border-transparent',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.25rem_center] bg-[length:1.25rem]',
        )}
      >
        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
          <option key={code} value={code}>
            {code} {CURRENCIES[code].symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
