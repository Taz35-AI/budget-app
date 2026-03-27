import type { Frequency } from '@/types';

/**
 * Returns true if a recurring transaction with the given start_date and frequency
 * fires on the target date.
 *
 * All dates are YYYY-MM-DD strings for zero-dependency fast comparison.
 */
export function firesOnDate(
  startDate: string,
  frequency: Frequency,
  targetDate: string,
): boolean {
  if (targetDate < startDate) return false;

  const start = parseDate(startDate);
  const target = parseDate(targetDate);

  switch (frequency) {
    case 'daily':
      return true;

    case 'weekly': {
      const diff = daysBetween(start, target);
      return diff % 7 === 0;
    }

    case 'biweekly': {
      const diff = daysBetween(start, target);
      return diff % 14 === 0;
    }

    case 'monthly':
      return sameMonthDay(start, target, 1);

    case 'quarterly':
      return sameMonthDay(start, target, 3);

    case 'semiannual':
      return sameMonthDay(start, target, 6);

    case 'annual':
      return sameMonthDay(start, target, 12);

    default:
      return false;
  }
}

/**
 * Returns the next date after `fromDate` on which a recurring transaction fires.
 * Used to place a "restore" exception when editing/deleting a single occurrence.
 *
 * For daily: tomorrow.
 * For weekly/biweekly: next week/fortnight aligned to startDate.
 * For month-based: same day next interval month.
 */
export function nextOccurrenceAfter(
  startDate: string,
  frequency: Frequency,
  fromDate: string, // the occurrence we just edited/deleted
): string {
  const start = parseDate(startDate);
  const from = parseDate(fromDate);

  switch (frequency) {
    case 'daily': {
      return addDaysToStr(fromDate, 1);
    }
    case 'weekly': {
      return addDaysToStr(fromDate, 7);
    }
    case 'biweekly': {
      return addDaysToStr(fromDate, 14);
    }
    case 'monthly':
    case 'quarterly':
    case 'semiannual':
    case 'annual': {
      const intervalMonths =
        frequency === 'monthly' ? 1 :
        frequency === 'quarterly' ? 3 :
        frequency === 'semiannual' ? 6 : 12;

      // From "from" month, add intervalMonths
      let nextMonth = from.month + intervalMonths;
      let nextYear = from.year;
      while (nextMonth > 12) { nextMonth -= 12; nextYear++; }

      const nextDay = clampDay(start.day, nextYear, nextMonth);
      return `${String(nextYear).padStart(4,'0')}-${String(nextMonth).padStart(2,'0')}-${String(nextDay).padStart(2,'0')}`;
    }
    default:
      return addDaysToStr(fromDate, 1);
  }
}

function addDaysToStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface SimpleDate {
  year: number;
  month: number; // 1-12
  day: number;
}

function parseDate(dateStr: string): SimpleDate {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

function daysBetween(a: SimpleDate, b: SimpleDate): number {
  const msA = Date.UTC(a.year, a.month - 1, a.day);
  const msB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((msB - msA) / 86400000);
}

/**
 * Returns true if target falls on an N-month interval from start.
 * Handles end-of-month clamping (e.g. Jan 31 → Feb 28).
 */
function sameMonthDay(start: SimpleDate, target: SimpleDate, intervalMonths: number): boolean {
  // Total months from start to target
  const totalMonths =
    (target.year - start.year) * 12 + (target.month - start.month);

  if (totalMonths < 0) return false;
  if (totalMonths % intervalMonths !== 0) return false;

  // Check the day matches (with end-of-month clamping)
  const expectedDay = clampDay(start.day, target.year, target.month);
  return target.day === expectedDay;
}

/** Returns the last valid day of the month if start.day exceeds the month's length */
function clampDay(day: number, year: number, month: number): number {
  const lastDay = new Date(year, month, 0).getDate(); // day 0 = last day of prev month
  return Math.min(day, lastDay);
}

// ─── Recurrence count helpers ────────────────────────────────────────────────

/**
 * Computes the end_date (YYYY-MM-DD) for the Nth (last) occurrence.
 *
 * The 1st occurrence fires on startDate; the Nth fires on startDate + (N-1) intervals.
 * recurrences must be ≥ 1.
 */
export function computeEndDateFromRecurrences(
  startDate: string,
  frequency: Frequency,
  recurrences: number,
): string {
  if (recurrences <= 1) return startDate;
  const n = recurrences - 1; // number of intervals to advance
  const start = parseDate(startDate);

  switch (frequency) {
    case 'daily':
      return addDaysToStr(startDate, n);
    case 'weekly':
      return addDaysToStr(startDate, n * 7);
    case 'biweekly':
      return addDaysToStr(startDate, n * 14);
    case 'monthly':
    case 'quarterly':
    case 'semiannual':
    case 'annual': {
      const intervalMonths =
        frequency === 'monthly'    ? 1  :
        frequency === 'quarterly'  ? 3  :
        frequency === 'semiannual' ? 6  : 12;
      const totalMonths = n * intervalMonths;
      let endMonth = start.month + totalMonths;
      let endYear  = start.year;
      while (endMonth > 12) { endMonth -= 12; endYear++; }
      const endDay = clampDay(start.day, endYear, endMonth);
      return (
        `${String(endYear).padStart(4, '0')}-` +
        `${String(endMonth).padStart(2, '0')}-` +
        `${String(endDay).padStart(2, '0')}`
      );
    }
    default:
      return startDate;
  }
}

/**
 * Back-computes the number of occurrences implied by a known end_date.
 *
 * Returns undefined when end_date doesn't land on an exact occurrence boundary
 * (e.g. the end_date was set manually to an arbitrary date).
 */
export function computeRecurrencesFromEndDate(
  startDate: string,
  frequency: Frequency,
  endDate: string,
): number | undefined {
  if (endDate < startDate) return undefined;
  if (endDate === startDate) return 1;

  const start = parseDate(startDate);
  const end   = parseDate(endDate);

  switch (frequency) {
    case 'daily': {
      const d = daysBetween(start, end);
      return d + 1;
    }
    case 'weekly': {
      const d = daysBetween(start, end);
      return d % 7 === 0 ? d / 7 + 1 : undefined;
    }
    case 'biweekly': {
      const d = daysBetween(start, end);
      return d % 14 === 0 ? d / 14 + 1 : undefined;
    }
    case 'monthly':
    case 'quarterly':
    case 'semiannual':
    case 'annual': {
      const intervalMonths =
        frequency === 'monthly'    ? 1  :
        frequency === 'quarterly'  ? 3  :
        frequency === 'semiannual' ? 6  : 12;
      const totalMonths = (end.year - start.year) * 12 + (end.month - start.month);
      if (totalMonths < 0 || totalMonths % intervalMonths !== 0) return undefined;
      const expectedDay = clampDay(start.day, end.year, end.month);
      if (end.day !== expectedDay) return undefined;
      return totalMonths / intervalMonths + 1;
    }
    default:
      return undefined;
  }
}
