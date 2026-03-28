'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, addDays } from 'date-fns';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { DayCellContentArg, EventContentArg, DatesSetArg } from '@fullcalendar/core';
import { DayCellContent } from './DayCellContent';
import { cn } from '@/lib/utils';
import type { DayTransaction, BudgetAccount } from '@/types';

export interface CalendarNavHandle {
  today: () => void;
}

interface Props {
  balances: Map<string, number>;
  dayTransactions: Map<string, DayTransaction[]>;
  selectedDate: string | null;
  onDateClick: (date: string) => void;
  formatAmount: (n: number, opts?: { compact?: boolean }) => string;
  isLoading: boolean;
  onMonthChange?: (date: Date) => void;
  firstDayOfWeek?: 0 | 1;
  // Account tabs (replaces prev/next arrows)
  accounts?: BudgetAccount[];
  activeAccountId?: string;
  onAccountChange?: (id: string) => void;
  // Exposed handle so parent can imperatively call today()
  calendarNavRef?: React.MutableRefObject<CalendarNavHandle | null>;
}

export function CalendarView({
  balances,
  dayTransactions,
  selectedDate,
  onDateClick,
  formatAmount,
  isLoading,
  onMonthChange,
  firstDayOfWeek = 1,
  accounts,
  activeAccountId,
  onAccountChange,
  calendarNavRef,
}: Props) {
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastReportedMonth = useRef<string | null>(null);

  const [monthTitle, setMonthTitle] = useState(() => format(new Date(), 'MMMM yyyy'));
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Navigate to today on mount
  useEffect(() => {
    calendarRef.current?.getApi().today();
  }, []);

  // Expose today() to parent
  useEffect(() => {
    if (calendarNavRef) {
      calendarNavRef.current = {
        today: () => calendarRef.current?.getApi().today(),
      };
    }
  }, [calendarNavRef]);

  // Show swipe hint on touch devices, first visit only
  useEffect(() => {
    try {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const seen = localStorage.getItem('bt_swipe_hint') === 'done';
      if (isTouch && !seen) setShowSwipeHint(true);
    } catch {}
  }, []);

  const handleSwipeHintEnd = useCallback(() => {
    setShowSwipeHint(false);
    try { localStorage.setItem('bt_swipe_hint', 'done'); } catch {}
  }, []);

  const handleDateClick = useCallback(
    (info: DateClickArg) => {
      onDateClick(format(info.date, 'yyyy-MM-dd'));
    },
    [onDateClick],
  );

  // Swipe to navigate months (mobile)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (Math.abs(dx) > 60 && dy < 40) {
        const api = calendarRef.current?.getApi();
        if (!api) return;
        if (dx < 0) api.next(); else api.prev();
      }
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [],
  );

  const maxDate = format(addDays(new Date(), 365 * 7 + 2), 'yyyy-MM-dd');
  const showTabs = (accounts?.length ?? 0) >= 2;

  return (
    <div
      className={cn(
        'calendar-wrapper w-full transition-opacity duration-300',
        isLoading && 'opacity-60 pointer-events-none',
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Custom toolbar: account tabs (left) + month name (right) ── */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-[#B2CFCE]/40 dark:border-white/[0.06]">

        {/* Account tabs — left, scrollable */}
        {showTabs && (
          <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
            <button
              onClick={() => onAccountChange?.('combined')}
              className={cn(
                'flex-shrink-0 h-6 px-2.5 rounded-lg text-[10px] font-semibold transition-all border',
                activeAccountId === 'combined'
                  ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                  : 'bg-white dark:bg-white/5 text-brand-text/55 dark:text-white/45 border-brand-primary/15 dark:border-white/10 hover:border-brand-primary/30',
              )}
            >
              Combined
            </button>
            {accounts!.map((acct) => (
              <button
                key={acct.id}
                onClick={() => onAccountChange?.(acct.id)}
                className={cn(
                  'flex-shrink-0 h-6 px-2.5 rounded-lg text-[10px] font-semibold transition-all border',
                  activeAccountId === acct.id
                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                    : 'bg-white dark:bg-white/5 text-brand-text/55 dark:text-white/45 border-brand-primary/15 dark:border-white/10 hover:border-brand-primary/30',
                )}
              >
                {acct.name}
              </button>
            ))}
          </div>
        )}

        {/* Month name + desktop prev/next chevrons — right side */}
        <div className={cn('flex items-center gap-1 flex-shrink-0', !showTabs && 'ml-auto')}>
          <button
            onClick={() => calendarRef.current?.getApi().prev()}
            aria-label="Previous month"
            className="hidden sm:flex w-6 h-6 items-center justify-center rounded-lg text-brand-text/30 dark:text-white/25 hover:bg-brand-primary/8 dark:hover:bg-white/[0.06] hover:text-brand-primary transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-bold text-brand-text dark:text-white tracking-tight whitespace-nowrap">
            {monthTitle}
          </span>
          <button
            onClick={() => calendarRef.current?.getApi().next()}
            aria-label="Next month"
            className="hidden sm:flex w-6 h-6 items-center justify-center rounded-lg text-brand-text/30 dark:text-white/25 hover:bg-brand-primary/8 dark:hover:bg-white/[0.06] hover:text-brand-primary transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Calendar grid ────────────────────────────────────────────── */}
      <div className="relative">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          firstDay={firstDayOfWeek}
          headerToolbar={false}
          height="auto"
          dateClick={handleDateClick}
          validRange={{ end: maxDate }}
          dayCellContent={(args: DayCellContentArg) => {
            const dateStr = format(args.date, 'yyyy-MM-dd');
            const balance = balances.get(dateStr);
            const txs = dayTransactions.get(dateStr) ?? [];
            return (
              <DayCellContent
                date={args.date}
                balance={balance}
                transactions={txs}
                formatAmount={formatAmount}
                isSelected={selectedDate === dateStr}
              />
            );
          }}
          events={[]}
          eventContent={(_args: EventContentArg) => null}
          datesSet={(args: DatesSetArg) => {
            const monthKey = format(args.view.currentStart, 'yyyy-MM');
            setMonthTitle(format(args.view.currentStart, 'MMMM yyyy'));
            if (onMonthChange && monthKey !== lastReportedMonth.current) {
              lastReportedMonth.current = monthKey;
              onMonthChange(args.view.currentStart);
            }
          }}
          dayCellClassNames={(args) => {
            const dateStr = format(args.date, 'yyyy-MM-dd');
            return selectedDate === dateStr ? 'fc-day-selected' : '';
          }}
        />

        {/* Swipe hint — touch devices, shown once on first visit */}
        {showSwipeHint && (
          <>
            <div
              className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-20"
              style={{ animation: 'swipeHintBlink 1.1s ease-in-out 3 forwards' }}
              onAnimationEnd={handleSwipeHintEnd}
            >
              <Image
                src="/swipe-left.png"
                alt=""
                width={56}
                height={56}
                className="w-14 h-14 object-contain drop-shadow-xl"
              />
            </div>
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-20"
              style={{ animation: 'swipeHintBlink 1.1s ease-in-out 3 forwards' }}
            >
              <Image
                src="/swipe-right.png"
                alt=""
                width={56}
                height={56}
                className="w-14 h-14 object-contain drop-shadow-xl"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
