import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { takeBootstrapSlice, resetBootstrap } from './bootstrap';

const SLICES = {
  transactions: { transactions: [{ id: 't1' }], exceptions: [] },
  accounts: [{ id: 'a1' }],
  settings: { settings: null },
  members: { members: [], householdId: 'h1' },
  pendingInvites: [],
};

function mockFetch(response: { ok: boolean; body?: unknown } | 'network-error') {
  const fn = vi.fn(async () => {
    if (response === 'network-error') throw new TypeError('Failed to fetch');
    return { ok: response.ok, json: async () => response.body };
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('takeBootstrapSlice', () => {
  beforeEach(() => {
    // The module is a no-op without a window (server render).
    vi.stubGlobal('window', {});
    resetBootstrap();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('makes one request for every query that starts together', async () => {
    const fetchMock = mockFetch({ ok: true, body: { slices: SLICES } });

    const [tx, accounts, members, settings] = await Promise.all([
      takeBootstrapSlice('transactions', { start: true }),
      takeBootstrapSlice('accounts', { start: true }),
      takeBootstrapSlice('members', { start: false }),
      takeBootstrapSlice('settings', { start: false }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/bootstrap');
    expect(tx).toEqual(SLICES.transactions);
    expect(accounts).toEqual(SLICES.accounts);
    expect(members).toEqual(SLICES.members);
    // "No settings yet" is a real answer and must survive the round trip.
    expect(settings).toEqual({ settings: null });
  });

  it('joins a request started later in the same pass', async () => {
    // App-wide queries (members) mount before page-level ones (transactions).
    const fetchMock = mockFetch({ ok: true, body: { slices: SLICES } });

    const members = takeBootstrapSlice('members', { start: false });
    const tx = takeBootstrapSlice('transactions', { start: true });

    expect(await members).toEqual(SLICES.members);
    expect(await tx).toEqual(SLICES.transactions);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('hands each slice out once, so refetches reach the real endpoint', async () => {
    const fetchMock = mockFetch({ ok: true, body: { slices: SLICES } });

    expect(await takeBootstrapSlice('transactions', { start: true })).toEqual(SLICES.transactions);
    expect(await takeBootstrapSlice('transactions', { start: true })).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not start a request for a query that may only join one', async () => {
    const fetchMock = mockFetch({ ok: true, body: { slices: SLICES } });

    expect(await takeBootstrapSlice('settings', { start: false })).toBeUndefined();
    expect(await takeBootstrapSlice('members', { start: false })).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stops handing out slices once they are no longer fresh', async () => {
    vi.useFakeTimers();
    mockFetch({ ok: true, body: { slices: SLICES } });

    expect(await takeBootstrapSlice('transactions', { start: true })).toEqual(SLICES.transactions);
    vi.advanceTimersByTime(11_000);
    expect(await takeBootstrapSlice('accounts', { start: true })).toBeUndefined();
  });

  it('falls back when the endpoint is unavailable', async () => {
    mockFetch({ ok: false });
    expect(await takeBootstrapSlice('transactions', { start: true })).toBeUndefined();

    resetBootstrap();
    mockFetch('network-error');
    expect(await takeBootstrapSlice('transactions', { start: true })).toBeUndefined();
  });

  it('falls back for a slice the server left out', async () => {
    mockFetch({ ok: true, body: { slices: { accounts: SLICES.accounts } } });

    expect(await takeBootstrapSlice('accounts', { start: true })).toEqual(SLICES.accounts);
    expect(await takeBootstrapSlice('transactions', { start: true })).toBeUndefined();
  });

  it('starts again after a reset, so the next sign-in gets its own data', async () => {
    mockFetch({ ok: true, body: { slices: SLICES } });
    await takeBootstrapSlice('transactions', { start: true });

    resetBootstrap();
    const other = { ...SLICES, accounts: [{ id: 'someone-else' }] };
    const fetchMock = mockFetch({ ok: true, body: { slices: other } });

    expect(await takeBootstrapSlice('accounts', { start: true })).toEqual(other.accounts);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('is inert during server rendering', async () => {
    vi.unstubAllGlobals();
    const fetchMock = mockFetch({ ok: true, body: { slices: SLICES } });
    vi.stubGlobal('window', undefined);

    expect(await takeBootstrapSlice('transactions', { start: true })).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
