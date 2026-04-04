'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { useBalances } from '@/hooks/useBalances';
import { useCurrency } from '@/hooks/useCurrency';
import Link from 'next/link';

export default function WidgetClient() {
  const t = useTranslations('widget');
  const { balances, dayTransactions } = useBalances();
  const { formatAmount } = useCurrency();

  const today = format(new Date(), 'yyyy-MM-dd');
  const balance = balances.get(today) ?? 0;
  const todayTxs = dayTransactions.get(today) ?? [];
  const lastTx = todayTxs[todayTxs.length - 1];

  const isPositive = balance >= 0;

  return (
    <div className="min-h-screen bg-[#011817] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col items-center gap-4">
          {/* Balance */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">{t('balance')}</p>
            <p className={`text-3xl font-black tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatAmount(balance)}
            </p>
          </div>

          {/* Last transaction */}
          {lastTx && (
            <div className="w-full px-3 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1">{t('lastTransaction')}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white/80 truncate">{lastTx.name}</span>
                <span className={`text-sm font-bold tabular-nums ${lastTx.category === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {lastTx.category === 'income' ? '+' : '\u2212'}{formatAmount(lastTx.amount)}
                </span>
              </div>
            </div>
          )}

          {/* Open app link */}
          <Link
            href="/dashboard"
            className="w-full h-11 rounded-2xl bg-white text-[#042F2E] text-sm font-bold flex items-center justify-center hover:bg-slate-100 active:scale-[0.97] transition-all"
          >
            {t('openApp')}
          </Link>
        </div>
      </div>
    </div>
  );
}
