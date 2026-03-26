'use client';

import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  arrow?: 'top' | 'bottom';
  className?: string;
}

export function OnboardingTip({ children, arrow = 'top', className }: Props) {
  return (
    <div className={cn('flex flex-col items-center pointer-events-none select-none', className)}>
      {arrow === 'top' && (
        <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[8px] border-l-transparent border-r-transparent border-b-indigo-500" />
      )}
      <div className="bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg shadow-indigo-500/30 max-w-[190px] text-center leading-relaxed animate-pulse-slow">
        {children}
      </div>
      {arrow === 'bottom' && (
        <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[8px] border-l-transparent border-r-transparent border-t-indigo-500" />
      )}
    </div>
  );
}
