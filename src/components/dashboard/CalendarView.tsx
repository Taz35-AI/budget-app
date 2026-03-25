'use client';

import { useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, addDays } from 'date-fns';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { DayCellContentArg, EventContentArg, DatesSetArg } from '@fullcalendar/core';
import { DayCellContent } from './DayCellContent';
import { cn } from '@/lib/utils';
import type { DayTransaction } from '@/types';

interface Props {
  balances: Map<string, number>;
  dayTransactions: Map<string, DayTransaction[]>;
  selectedDate: string | null;
  onDateClick: (date: string) => void;
  formatAmount: (n: number, opts?: { compact?: boolean }) => string;
  isLoading: boolean;
  onMonthChange?: (date: Date) => void;
  firstDayOfWeek?: 0 | 1;
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
}: Props) {
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastReportedMonth = useRef<string | null>(null);

  // Navigate to today on mount
  useEffect(() => {
    calendarRef.current?.getApi().today();
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
      // Only trigger if clearly horizontal swipe (not scroll)
      if (Math.abs(dx) > 60 && dy < 40) {
        const api = calendarRef.current?.getApi();
        if (!api) return;
        if (dx < 0) {
          api.next();
        } else {
          api.prev();
        }
      }
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [],
  );

  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 365 * 7 + 2), 'yyyy-MM-dd');

  return (
    <div
      className={cn(
        'calendar-wrapper w-full transition-opacity duration-300',
        isLoading && 'opacity-60 pointer-events-none',
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        firstDay={firstDayOfWeek}
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next',
        }}
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
        // Disable default event display — we render everything in cells
        events={[]}
        eventContent={() => null}
        // Notify parent when visible month changes (deduplicated to avoid infinite loop)
        datesSet={(args: DatesSetArg) => {
          if (!onMonthChange) return;
          const monthKey = format(args.view.currentStart, 'yyyy-MM');
          if (monthKey !== lastReportedMonth.current) {
            lastReportedMonth.current = monthKey;
            onMonthChange(args.view.currentStart);
          }
        }}
        // Style overrides via className
        dayCellClassNames={(args) => {
          const dateStr = format(args.date, 'yyyy-MM-dd');
          return selectedDate === dateStr ? 'fc-day-selected' : '';
        }}
      />
    </div>
  );
}
