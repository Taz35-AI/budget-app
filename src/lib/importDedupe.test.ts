import { describe, it, expect } from 'vitest';
import { dedupeAgainstExisting, importSignature } from './importDedupe';

const coffee = { type: 'one_off', name: 'Coffee', amount: 3.5, date: '2026-11-20', account_id: 'a1' };
const rent = { type: 'recurring', name: 'Rent', amount: 950, start_date: '2026-11-01', frequency: 'monthly', account_id: 'a1' };

describe('importSignature', () => {
  it('ignores case and surrounding whitespace in the name', () => {
    expect(importSignature({ ...coffee, name: '  COFFEE ' })).toBe(importSignature(coffee));
  });

  it('treats numeric and string amounts as the same value', () => {
    expect(importSignature({ ...coffee, amount: '3.50' })).toBe(importSignature(coffee));
    expect(importSignature({ ...coffee, amount: '3.5' })).toBe(importSignature(coffee));
  });

  it('separates rows that differ in date, amount, account or type', () => {
    const base = importSignature(coffee);
    expect(importSignature({ ...coffee, date: '2026-11-21' })).not.toBe(base);
    expect(importSignature({ ...coffee, amount: 3.6 })).not.toBe(base);
    expect(importSignature({ ...coffee, account_id: 'a2' })).not.toBe(base);
    expect(importSignature({ ...rent, name: 'Coffee', amount: 3.5 })).not.toBe(base);
  });
});

describe('dedupeAgainstExisting', () => {
  it('imports identical rows from one statement as separate transactions', () => {
    const { fresh, duplicates } = dedupeAgainstExisting([], [coffee, { ...coffee }, { ...coffee }]);
    expect(fresh).toHaveLength(3);
    expect(duplicates).toBe(0);
  });

  it('imports nothing when the same statement is imported again', () => {
    const existing = [coffee, { ...coffee }, rent];
    const { fresh, duplicates } = dedupeAgainstExisting(existing, [coffee, { ...coffee }, rent]);
    expect(fresh).toHaveLength(0);
    expect(duplicates).toBe(3);
  });

  it('imports only the copies that are not already present', () => {
    const { fresh, duplicates } = dedupeAgainstExisting([coffee], [coffee, { ...coffee }, { ...coffee }]);
    expect(fresh).toHaveLength(2);
    expect(duplicates).toBe(1);
  });

  it('matches existing rows whose amount came back from the database as a string', () => {
    const { fresh, duplicates } = dedupeAgainstExisting([{ ...coffee, amount: '3.50' }], [coffee]);
    expect(fresh).toHaveLength(0);
    expect(duplicates).toBe(1);
  });

  it('keeps new rows in their original order', () => {
    const a = { ...coffee, name: 'A' };
    const b = { ...coffee, name: 'B' };
    const c = { ...coffee, name: 'C' };
    const { fresh } = dedupeAgainstExisting([b], [a, b, c]);
    expect(fresh.map((r) => r.name)).toEqual(['A', 'C']);
  });
});
