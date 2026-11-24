import { describe, it, expect } from 'vitest';
import { safeNextPath } from './safePath';

describe('safeNextPath', () => {
  const FALLBACK = '/dashboard';

  it('keeps same-site paths', () => {
    expect(safeNextPath('/dashboard', FALLBACK)).toBe('/dashboard');
    expect(safeNextPath('/reset-password', FALLBACK)).toBe('/reset-password');
    expect(safeNextPath('/reports?month=2026-11#top', FALLBACK)).toBe('/reports?month=2026-11#top');
  });

  it('falls back when nothing usable is given', () => {
    expect(safeNextPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath('', FALLBACK)).toBe(FALLBACK);
  });

  it('rejects values that change the host when appended to the origin', () => {
    // https://www.spentum.com@evil.example -> host is evil.example
    expect(safeNextPath('@evil.example', FALLBACK)).toBe(FALLBACK);
    // https://www.spentum.com.evil.example
    expect(safeNextPath('.evil.example', FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath(':8080/x', FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath('dashboard', FALLBACK)).toBe(FALLBACK);
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeNextPath('https://evil.example', FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath('//evil.example', FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath('/\\evil.example', FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath('javascript:alert(1)', FALLBACK)).toBe(FALLBACK);
  });

  it('rejects backslashes and control characters', () => {
    expect(safeNextPath('/a\\b', FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath('/a\nb', FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath('/\t/evil.example', FALLBACK)).toBe(FALLBACK);
  });

  it('produces a URL on the original host for every accepted value', () => {
    const origin = 'https://www.spentum.com';
    for (const candidate of ['/dashboard', '/a/b?c=d', '/@evil.example', '/.evil.example']) {
      const result = safeNextPath(candidate, FALLBACK);
      expect(new URL(`${origin}${result}`).host).toBe('www.spentum.com');
    }
  });
});
