/**
 * Tests for the notification scheduling logic.
 *
 * We can't test the Capacitor bridge calls (those require a native device),
 * but we CAN test the pure JS logic:
 *   - Bill reminder construction over a 30-day window (buildBillReminders)
 *   - reminderFireTime: eve-before vs morning-of vs skip
 *   - Edge cases: ended transactions, one-off transactions, missing fields,
 *     iOS pending cap, ordering
 */

import { describe, it, expect } from 'vitest';
import {
  buildBillReminders,
  reminderFireTime,
  monthlyRecapTime,
  BILL_LOOKAHEAD_DAYS,
  MAX_BILL_NOTIFICATIONS,
} from './notificationScheduler';
import { firesOnDate } from '@/engine/recurringResolver';
import type { Transaction } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id:         'tx-1',
    user_id:    'user-1',
    name:       'Netflix',
    amount:     15,
    category:   'expense',
    type:       'recurring',
    start_date: '2026-01-01',
    frequency:  'monthly',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── reminderFireTime ────────────────────────────────────────────────────────

describe('reminderFireTime', () => {
  it('uses 8pm the evening before when there is time', () => {
    const now = new Date('2026-03-28T09:00:00');
    const slot = reminderFireTime('2026-03-30', now);
    expect(slot).not.toBeNull();
    expect(slot!.isEveBefore).toBe(true);
    expect(slot!.fireAt.getDate()).toBe(29);
    expect(slot!.fireAt.getHours()).toBe(20);
  });

  it('falls back to 8am morning-of when eve-before is past', () => {
    const now = new Date('2026-03-28T21:00:00'); // already past 8pm
    const slot = reminderFireTime('2026-03-29', now);
    expect(slot).not.toBeNull();
    expect(slot!.isEveBefore).toBe(false);
    expect(slot!.fireAt.getDate()).toBe(29);
    expect(slot!.fireAt.getHours()).toBe(8);
  });

  it('returns null when both slots are past (bill is now)', () => {
    const now = new Date('2026-03-28T09:30:00'); // past 8am today
    expect(reminderFireTime('2026-03-28', now)).toBeNull();
  });

  it('returns null when due date is in the past entirely', () => {
    const now = new Date('2026-03-30T12:00:00');
    expect(reminderFireTime('2026-03-25', now)).toBeNull();
  });
});

// ─── buildBillReminders ──────────────────────────────────────────────────────

describe('buildBillReminders', () => {
  it('returns empty for no transactions', () => {
    const now = new Date('2026-03-01T09:00:00');
    expect(buildBillReminders([], now)).toEqual([]);
  });

  it('skips one-off transactions', () => {
    const now = new Date('2026-03-01T09:00:00');
    const tx = makeTx({ type: 'one_off', date: '2026-03-15' });
    expect(buildBillReminders([tx], now)).toEqual([]);
  });

  it('skips recurring transactions missing start_date or frequency', () => {
    const now = new Date('2026-03-01T09:00:00');
    expect(buildBillReminders([makeTx({ start_date: undefined })], now)).toEqual([]);
    expect(buildBillReminders([makeTx({ frequency: undefined })], now)).toEqual([]);
  });

  it('skips ended recurrings whose end_date is before all upcoming due dates', () => {
    const now = new Date('2026-03-01T09:00:00');
    const tx = makeTx({
      start_date: '2025-01-15',
      frequency:  'monthly',
      end_date:   '2025-12-15',
    });
    expect(buildBillReminders([tx], now)).toEqual([]);
  });

  it('schedules a single reminder for a monthly bill due once in the window', () => {
    const now = new Date('2026-03-01T09:00:00');
    const tx = makeTx({ start_date: '2026-01-15', frequency: 'monthly' });
    const result = buildBillReminders([tx], now);
    expect(result).toHaveLength(1);
    expect(result[0].dueDate).toBe('2026-03-15');
    expect(result[0].isEveBefore).toBe(true);
    expect(result[0].fireAt.getDate()).toBe(14);
    expect(result[0].fireAt.getHours()).toBe(20);
  });

  it('schedules multiple reminders for a weekly bill across the lookahead window', () => {
    const now = new Date('2026-03-01T09:00:00');
    const tx = makeTx({ start_date: '2026-03-02', frequency: 'weekly' });
    // Due dates within 30 days of 2026-03-01: 03-02, 03-09, 03-16, 03-23, 03-30
    const result = buildBillReminders([tx], now);
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.dueDate)).toEqual([
      '2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23', '2026-03-30',
    ]);
  });

  it('orders reminders by fireAt ascending', () => {
    const now = new Date('2026-03-01T09:00:00');
    const txs = [
      makeTx({ id: 'a', name: 'Late',     start_date: '2026-03-25', frequency: 'monthly' }),
      makeTx({ id: 'b', name: 'Early',    start_date: '2026-03-05', frequency: 'monthly' }),
      makeTx({ id: 'c', name: 'Middle',   start_date: '2026-03-15', frequency: 'monthly' }),
    ];
    const result = buildBillReminders(txs, now);
    expect(result.map((r) => r.tx.name)).toEqual(['Early', 'Middle', 'Late']);
  });

  it(`caps the result at MAX_BILL_NOTIFICATIONS (${MAX_BILL_NOTIFICATIONS})`, () => {
    const now = new Date('2026-03-01T09:00:00');
    // 60 daily bills, each generating 31 reminders → ~1800 candidates
    const txs: Transaction[] = Array.from({ length: 60 }, (_, i) =>
      makeTx({ id: `tx-${i}`, name: `Bill ${i}`, start_date: '2026-03-01', frequency: 'daily' }),
    );
    const result = buildBillReminders(txs, now);
    expect(result).toHaveLength(MAX_BILL_NOTIFICATIONS);
  });

  it('respects BILL_LOOKAHEAD_DAYS — does not schedule beyond the window', () => {
    const now = new Date('2026-03-01T09:00:00');
    const tx = makeTx({ start_date: '2026-04-15', frequency: 'monthly' });
    // 2026-04-15 is 45 days away — past 30-day lookahead
    expect(BILL_LOOKAHEAD_DAYS).toBe(30);
    expect(buildBillReminders([tx], now)).toEqual([]);
  });

  it('uses morning-of copy when eve-before slot is past', () => {
    const now = new Date('2026-03-14T21:00:00'); // 9pm, eve before due
    const tx = makeTx({ start_date: '2026-01-15', frequency: 'monthly' });
    const result = buildBillReminders([tx], now);
    expect(result).toHaveLength(1);
    expect(result[0].dueDate).toBe('2026-03-15');
    expect(result[0].isEveBefore).toBe(false);
    expect(result[0].fireAt.getHours()).toBe(8);
  });

  it('skips occurrences whose reminder slots are entirely past', () => {
    const now = new Date('2026-03-15T09:30:00'); // past 8am day-of
    const tx = makeTx({ start_date: '2026-01-15', frequency: 'monthly' });
    const result = buildBillReminders([tx], now);
    // 2026-03-15 is past both slots; next occurrence 2026-04-15 is outside 30d window
    expect(result).toEqual([]);
  });

  it('handles end_date that lands exactly on an upcoming due date (last occurrence)', () => {
    const now = new Date('2026-03-01T09:00:00');
    const tx = makeTx({
      start_date: '2026-01-15',
      frequency:  'monthly',
      end_date:   '2026-03-15',
    });
    const result = buildBillReminders([tx], now);
    expect(result).toHaveLength(1);
    expect(result[0].dueDate).toBe('2026-03-15');
  });
});

// ─── monthlyRecapTime ────────────────────────────────────────────────────────

describe('monthlyRecapTime', () => {
  it('schedules today at 9am when called early on the 1st', () => {
    const now = new Date('2026-03-01T08:30:00');
    const { fireAt, recapMonthName } = monthlyRecapTime(now);
    expect(fireAt.getDate()).toBe(1);
    expect(fireAt.getMonth()).toBe(2); // March
    expect(fireAt.getHours()).toBe(9);
    // Recap is for February (month immediately before the firing date)
    expect(recapMonthName).toBe('February');
  });

  it('schedules next month when called past 9am on the 1st', () => {
    const now = new Date('2026-03-01T09:30:00');
    const { fireAt, recapMonthName } = monthlyRecapTime(now);
    expect(fireAt.getDate()).toBe(1);
    expect(fireAt.getMonth()).toBe(3); // April
    expect(fireAt.getHours()).toBe(9);
    expect(recapMonthName).toBe('March');
  });

  it('schedules next month when called mid-month', () => {
    const now = new Date('2026-03-15T14:00:00');
    const { fireAt, recapMonthName } = monthlyRecapTime(now);
    expect(fireAt.getDate()).toBe(1);
    expect(fireAt.getMonth()).toBe(3); // April
    expect(recapMonthName).toBe('March');
  });

  it('rolls year over correctly when scheduling Jan recap from Dec', () => {
    const now = new Date('2026-12-15T14:00:00');
    const { fireAt, recapMonthName } = monthlyRecapTime(now);
    expect(fireAt.getDate()).toBe(1);
    expect(fireAt.getMonth()).toBe(0); // January
    expect(fireAt.getFullYear()).toBe(2027);
    expect(recapMonthName).toBe('December');
  });

  it('schedules February (current) recap when called Feb 1 at 8am', () => {
    const now = new Date('2026-02-01T08:00:00');
    const { fireAt, recapMonthName } = monthlyRecapTime(now);
    // Today at 9am still upcoming → fires today
    expect(fireAt.getDate()).toBe(1);
    expect(fireAt.getMonth()).toBe(1); // February
    expect(recapMonthName).toBe('January');
  });
});

// ─── firesOnDate edge cases (existing behaviour, kept for safety) ────────────

describe('firesOnDate', () => {
  it('returns false when target is before start', () => {
    expect(firesOnDate('2026-04-01', 'monthly', '2026-03-01')).toBe(false);
  });

  it('returns true on start date itself', () => {
    expect(firesOnDate('2026-04-01', 'monthly', '2026-04-01')).toBe(true);
  });

  it('handles month-end clamping (Jan 31 -> Feb 28)', () => {
    expect(firesOnDate('2026-01-31', 'monthly', '2026-02-28')).toBe(true);
    expect(firesOnDate('2026-01-31', 'monthly', '2026-02-27')).toBe(false);
  });

  it('biweekly fires every 14 days', () => {
    expect(firesOnDate('2026-03-01', 'biweekly', '2026-03-15')).toBe(true);
    expect(firesOnDate('2026-03-01', 'biweekly', '2026-03-08')).toBe(false);
  });

  it('annual fires exactly one year later', () => {
    expect(firesOnDate('2025-03-29', 'annual', '2026-03-29')).toBe(true);
    expect(firesOnDate('2025-03-29', 'annual', '2026-03-30')).toBe(false);
  });
});
