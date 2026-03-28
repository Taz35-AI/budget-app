/**
 * Tests for the notification scheduling logic.
 *
 * We can't test the Capacitor bridge calls (those require a native device),
 * but we CAN test the pure JS logic:
 *   - Bill reminder filtering via firesOnDate
 *   - The `atHourMinute` bump-to-tomorrow behaviour
 *   - Edge cases: ended transactions, one-off transactions, missing fields
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
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

/** Replicates the filter in scheduleBillReminders for testability */
function getDueTomorrow(transactions: Transaction[], tomorrow: string): Transaction[] {
  return transactions.filter((t) => {
    if (t.type !== 'recurring') return false;
    if (!t.start_date || !t.frequency) return false;
    if (t.end_date && t.end_date < tomorrow) return false;
    return firesOnDate(t.start_date, t.frequency, tomorrow);
  });
}

// ─── Bill reminder filter tests ───────────────────────────────────────────────

describe('bill reminder filter (getDueTomorrow)', () => {
  it('includes a monthly transaction on its due date', () => {
    const tx = makeTx({ start_date: '2026-03-29', frequency: 'monthly' });
    // tomorrow = 29th of the next month
    expect(getDueTomorrow([tx], '2026-04-29')).toHaveLength(1);
  });

  it('excludes a monthly transaction on the wrong day', () => {
    const tx = makeTx({ start_date: '2026-03-29', frequency: 'monthly' });
    expect(getDueTomorrow([tx], '2026-04-28')).toHaveLength(0);
  });

  it('excludes transactions that ended before tomorrow', () => {
    const tx = makeTx({ start_date: '2026-01-15', frequency: 'monthly', end_date: '2026-03-15' });
    expect(getDueTomorrow([tx], '2026-04-15')).toHaveLength(0);
  });

  it('includes transactions whose end_date IS tomorrow (last occurrence)', () => {
    const tx = makeTx({ start_date: '2026-01-15', frequency: 'monthly', end_date: '2026-04-15' });
    expect(getDueTomorrow([tx], '2026-04-15')).toHaveLength(1);
  });

  it('excludes one-off transactions', () => {
    const tx = makeTx({ type: 'one_off', date: '2026-04-15' });
    expect(getDueTomorrow([tx], '2026-04-15')).toHaveLength(0);
  });

  it('excludes recurring transactions with missing start_date', () => {
    const tx = makeTx({ start_date: undefined });
    expect(getDueTomorrow([tx], '2026-04-15')).toHaveLength(0);
  });

  it('excludes recurring transactions with missing frequency', () => {
    const tx = makeTx({ frequency: undefined });
    expect(getDueTomorrow([tx], '2026-04-15')).toHaveLength(0);
  });

  it('includes a weekly transaction on its 7-day interval', () => {
    const tx = makeTx({ start_date: '2026-03-24', frequency: 'weekly' });
    // 7 days later = March 31
    expect(getDueTomorrow([tx], '2026-03-31')).toHaveLength(1);
    // 6 days later = not a match
    expect(getDueTomorrow([tx], '2026-03-30')).toHaveLength(0);
  });

  it('includes a daily transaction every day after start', () => {
    const tx = makeTx({ start_date: '2026-01-01', frequency: 'daily' });
    expect(getDueTomorrow([tx], '2026-04-01')).toHaveLength(1);
  });

  it('handles multiple transactions, returns only those due tomorrow', () => {
    const dueTomorrow  = makeTx({ id: 'tx-1', name: 'Netflix', start_date: '2026-03-29', frequency: 'monthly' });
    const notDue       = makeTx({ id: 'tx-2', name: 'Spotify', start_date: '2026-03-10', frequency: 'monthly' });
    const result = getDueTomorrow([dueTomorrow, notDue], '2026-04-29');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Netflix');
  });

  it('returns empty array when no transactions are passed', () => {
    expect(getDueTomorrow([], '2026-04-15')).toHaveLength(0);
  });
});

// ─── billReminderTime logic ───────────────────────────────────────────────────

/** Mirror of billReminderTime() from notificationScheduler for unit testing */
function billReminderTime(now: Date): Date {
  const eightPm = new Date(now);
  eightPm.setHours(20, 0, 0, 0);
  if (now < eightPm) return eightPm;

  const tomorrow8am = new Date(now);
  tomorrow8am.setDate(now.getDate() + 1);
  tomorrow8am.setHours(8, 0, 0, 0);
  return tomorrow8am;
}

describe('billReminderTime', () => {
  it('returns 8pm today when it is morning', () => {
    const now = new Date('2026-03-28T09:00:00');
    const result = billReminderTime(now);
    expect(result.getHours()).toBe(20);
    expect(result.getDate()).toBe(28);
  });

  it('returns 8pm today when it is afternoon', () => {
    const now = new Date('2026-03-28T15:30:00');
    const result = billReminderTime(now);
    expect(result.getHours()).toBe(20);
    expect(result.getDate()).toBe(28);
  });

  it('returns 8am tomorrow when it is past 8pm', () => {
    const now = new Date('2026-03-28T21:00:00');
    const result = billReminderTime(now);
    expect(result.getHours()).toBe(8);
    expect(result.getDate()).toBe(29);
  });

  it('returns 8am tomorrow on midnight edge', () => {
    const now = new Date('2026-03-28T23:59:59');
    const result = billReminderTime(now);
    expect(result.getHours()).toBe(8);
    expect(result.getDate()).toBe(29);
  });
});

// ─── firesOnDate edge cases ───────────────────────────────────────────────────

describe('firesOnDate', () => {
  it('returns false when target is before start', () => {
    expect(firesOnDate('2026-04-01', 'monthly', '2026-03-01')).toBe(false);
  });

  it('returns true on start date itself', () => {
    expect(firesOnDate('2026-04-01', 'monthly', '2026-04-01')).toBe(true);
  });

  it('handles month-end clamping (Jan 31 -> Feb 28)', () => {
    // Start Jan 31, next monthly = Feb 28 (not Feb 31)
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
