/**
 * Tests for the recurrence maths — pure string/date logic with no I/O.
 *
 * The tricky cases are all end-of-month: a series starting on the 31st must
 * clamp to 28/29/30 in short months WITHOUT drifting (i.e. it clamps for
 * display but the anchor day stays 31).
 */

import { describe, it, expect } from 'vitest';
import {
  firesOnDate,
  nextOccurrenceAfter,
  computeEndDateFromRecurrences,
  computeRecurrencesFromEndDate,
} from './recurringResolver';

describe('firesOnDate', () => {
  it('never fires before the start date', () => {
    expect(firesOnDate('2026-03-10', 'daily', '2026-03-09')).toBe(false);
    expect(firesOnDate('2026-03-10', 'monthly', '2026-02-10')).toBe(false);
  });

  it('fires on the start date itself for every frequency', () => {
    const freqs = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'] as const;
    for (const f of freqs) {
      expect(firesOnDate('2026-03-10', f, '2026-03-10')).toBe(true);
    }
  });

  it('handles daily / weekly / biweekly intervals', () => {
    expect(firesOnDate('2026-03-01', 'daily', '2026-03-02')).toBe(true);
    expect(firesOnDate('2026-03-01', 'weekly', '2026-03-08')).toBe(true);
    expect(firesOnDate('2026-03-01', 'weekly', '2026-03-07')).toBe(false);
    expect(firesOnDate('2026-03-01', 'biweekly', '2026-03-15')).toBe(true);
    expect(firesOnDate('2026-03-01', 'biweekly', '2026-03-08')).toBe(false);
  });

  it('handles monthly / quarterly / semiannual / annual intervals', () => {
    expect(firesOnDate('2026-01-15', 'monthly', '2026-02-15')).toBe(true);
    expect(firesOnDate('2026-01-15', 'quarterly', '2026-04-15')).toBe(true);
    expect(firesOnDate('2026-01-15', 'quarterly', '2026-03-15')).toBe(false);
    expect(firesOnDate('2026-01-15', 'semiannual', '2026-07-15')).toBe(true);
    expect(firesOnDate('2026-01-15', 'annual', '2027-01-15')).toBe(true);
    expect(firesOnDate('2026-01-15', 'annual', '2026-07-15')).toBe(false);
  });

  it('clamps a 31st monthly series into short months without drifting', () => {
    // Feb 2026 has 28 days → fires on the 28th, but only the 28th
    expect(firesOnDate('2026-01-31', 'monthly', '2026-02-28')).toBe(true);
    expect(firesOnDate('2026-01-31', 'monthly', '2026-02-27')).toBe(false);
    // April has 30 days → the 30th
    expect(firesOnDate('2026-01-31', 'monthly', '2026-04-30')).toBe(true);
    // March has 31 → back to the 31st, proving no permanent drift
    expect(firesOnDate('2026-01-31', 'monthly', '2026-03-31')).toBe(true);
    expect(firesOnDate('2026-01-31', 'monthly', '2026-03-28')).toBe(false);
  });

  it('handles Feb 29 in a leap year', () => {
    expect(firesOnDate('2024-01-31', 'monthly', '2024-02-29')).toBe(true);
    expect(firesOnDate('2024-01-31', 'monthly', '2024-02-28')).toBe(false);
  });

  it('crosses year boundaries', () => {
    expect(firesOnDate('2025-11-15', 'monthly', '2026-01-15')).toBe(true);
    expect(firesOnDate('2025-12-31', 'monthly', '2026-01-31')).toBe(true);
  });
});

describe('nextOccurrenceAfter', () => {
  it('advances by one interval for day-based frequencies', () => {
    expect(nextOccurrenceAfter('2026-03-01', 'daily', '2026-03-05')).toBe('2026-03-06');
    expect(nextOccurrenceAfter('2026-03-01', 'weekly', '2026-03-08')).toBe('2026-03-15');
    expect(nextOccurrenceAfter('2026-03-01', 'biweekly', '2026-03-15')).toBe('2026-03-29');
  });

  it('advances month-based frequencies using the anchor day', () => {
    expect(nextOccurrenceAfter('2026-01-15', 'monthly', '2026-03-15')).toBe('2026-04-15');
    expect(nextOccurrenceAfter('2026-01-15', 'quarterly', '2026-04-15')).toBe('2026-07-15');
    expect(nextOccurrenceAfter('2026-01-15', 'annual', '2026-01-15')).toBe('2027-01-15');
  });

  it('clamps to the last day when the next month is shorter', () => {
    expect(nextOccurrenceAfter('2026-01-31', 'monthly', '2026-01-31')).toBe('2026-02-28');
    // The anchor stays the 31st, so March returns to 31
    expect(nextOccurrenceAfter('2026-01-31', 'monthly', '2026-02-28')).toBe('2026-03-31');
  });

  it('rolls over the year boundary', () => {
    expect(nextOccurrenceAfter('2026-01-10', 'monthly', '2026-12-10')).toBe('2027-01-10');
  });
});

describe('computeEndDateFromRecurrences', () => {
  it('returns the start date for a single occurrence', () => {
    expect(computeEndDateFromRecurrences('2026-03-01', 'monthly', 1)).toBe('2026-03-01');
    expect(computeEndDateFromRecurrences('2026-03-01', 'monthly', 0)).toBe('2026-03-01');
  });

  it('advances N-1 intervals', () => {
    expect(computeEndDateFromRecurrences('2026-03-01', 'daily', 5)).toBe('2026-03-05');
    expect(computeEndDateFromRecurrences('2026-03-01', 'weekly', 3)).toBe('2026-03-15');
    expect(computeEndDateFromRecurrences('2026-01-15', 'monthly', 12)).toBe('2026-12-15');
    expect(computeEndDateFromRecurrences('2026-01-15', 'annual', 3)).toBe('2028-01-15');
  });

  it('clamps the final date into a short month', () => {
    expect(computeEndDateFromRecurrences('2026-01-31', 'monthly', 2)).toBe('2026-02-28');
  });
});

describe('computeRecurrencesFromEndDate', () => {
  it('round-trips with computeEndDateFromRecurrences', () => {
    const cases = [
      ['2026-03-01', 'daily', 10],
      ['2026-03-01', 'weekly', 6],
      ['2026-03-01', 'biweekly', 4],
      ['2026-01-15', 'monthly', 12],
      ['2026-01-15', 'quarterly', 4],
      ['2026-01-15', 'annual', 3],
    ] as const;

    for (const [start, freq, n] of cases) {
      const end = computeEndDateFromRecurrences(start, freq, n);
      expect(computeRecurrencesFromEndDate(start, freq, end)).toBe(n);
    }
  });

  it('returns 1 when end equals start, undefined when end precedes start', () => {
    expect(computeRecurrencesFromEndDate('2026-03-01', 'monthly', '2026-03-01')).toBe(1);
    expect(computeRecurrencesFromEndDate('2026-03-01', 'monthly', '2026-02-01')).toBeUndefined();
  });

  it('returns undefined for a date that is not on an occurrence boundary', () => {
    expect(computeRecurrencesFromEndDate('2026-03-01', 'weekly', '2026-03-10')).toBeUndefined();
    expect(computeRecurrencesFromEndDate('2026-01-15', 'monthly', '2026-03-20')).toBeUndefined();
    expect(computeRecurrencesFromEndDate('2026-01-15', 'quarterly', '2026-02-15')).toBeUndefined();
  });
});
