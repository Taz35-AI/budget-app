import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAiEnabled, hasAiCredentials, isUpstreamUnavailable } from './aiAvailability';

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('isAiEnabled', () => {
  it('defaults to enabled when the flag is unset', () => {
    delete process.env.NEXT_PUBLIC_AI_ENABLED;
    expect(isAiEnabled()).toBe(true);
  });

  it('is disabled only for the exact string "false"', () => {
    process.env.NEXT_PUBLIC_AI_ENABLED = 'false';
    expect(isAiEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
    expect(isAiEnabled()).toBe(true);
  });
});

describe('hasAiCredentials', () => {
  beforeEach(() => {
    delete process.env.AI_DISABLED;
  });

  it('requires an API key', () => {
    delete process.env.XAI_API_KEY;
    expect(hasAiCredentials()).toBe(false);

    process.env.XAI_API_KEY = 'xai-test';
    expect(hasAiCredentials()).toBe(true);
  });

  it('AI_DISABLED overrides a present key (kill switch)', () => {
    process.env.XAI_API_KEY = 'xai-test';
    process.env.AI_DISABLED = 'true';
    expect(hasAiCredentials()).toBe(false);
  });
});

describe('isUpstreamUnavailable', () => {
  it('treats auth, payment and quota failures as unavailable', () => {
    // 402/403 are what an exhausted xAI balance looks like.
    for (const status of [401, 402, 403, 429, 500, 503]) {
      expect(isUpstreamUnavailable({ status })).toBe(true);
    }
  });

  it('matches billing wording when no status is present', () => {
    expect(isUpstreamUnavailable({ message: 'Insufficient credits' })).toBe(true);
    expect(isUpstreamUnavailable({ message: 'monthly quota exceeded' })).toBe(true);
    expect(isUpstreamUnavailable({ message: 'billing account inactive' })).toBe(true);
    expect(isUpstreamUnavailable({ message: 'rate limit reached' })).toBe(true);
  });

  it('does not swallow genuine bugs', () => {
    expect(isUpstreamUnavailable({ status: 400, message: 'bad request' })).toBe(false);
    expect(isUpstreamUnavailable({ message: 'Cannot read properties of undefined' })).toBe(false);
    expect(isUpstreamUnavailable(null)).toBe(false);
    expect(isUpstreamUnavailable(undefined)).toBe(false);
  });
});
