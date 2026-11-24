import type { QueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { clearBalanceCache } from '@/engine/balanceCache';
import { resetBootstrap } from '@/lib/bootstrap';
import { useSettingsStore } from '@/store/settingsStore';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';

/**
 * Everything this device keeps about the signed-in person, and how to drop it.
 *
 * The app caches a lot client-side so it opens instantly and works offline:
 * the React Query cache, a copy of transactions and accounts in local storage,
 * the settings store, queued offline transactions, per-month budget limits.
 * None of it is keyed by user, so unless it is cleared when the session ends
 * the next person to use the browser is shown the previous person's finances
 * until their own data loads, and queued transactions would be posted into
 * whichever account is signed in when the connection returns.
 */

const LAST_USER_KEY = 'bt_last_user';

/** Local-storage keys (or prefixes ending in `:`/`_`) holding per-user data. */
const USER_KEY_PREFIXES = ['spentum:cache:', 'budget_limit_'];
const USER_KEYS = ['bt_demo_batch'];

function isUserKey(key: string): boolean {
  return USER_KEYS.includes(key) || USER_KEY_PREFIXES.some((p) => key.startsWith(p));
}

/**
 * True when `userId` is not the person whose data is cached on this device.
 * Unknown (nothing recorded yet) counts as the same user: clearing on a guess
 * would throw away a legitimate offline cache.
 */
export function isDifferentUser(userId: string): boolean {
  try {
    const last = localStorage.getItem(LAST_USER_KEY);
    return last !== null && last !== userId;
  } catch {
    return false;
  }
}

export function rememberUser(userId: string): void {
  try { localStorage.setItem(LAST_USER_KEY, userId); } catch { /* private mode */ }
}

/**
 * Drops all per-user data held on this device.
 *
 * @param reason
 *   - `signed-out`: the session ended. Queries are removed outright; nothing
 *     should refetch for a user who is no longer there.
 *   - `user-changed`: someone else is now signed in. Active queries are reset
 *     so they refetch for the new user instead of showing the old one's rows.
 */
export function clearUserData(qc: QueryClient, reason: 'signed-out' | 'user-changed'): void {
  // In-memory
  void qc.cancelQueries();
  if (reason === 'signed-out') {
    qc.clear();
    // The first-load bootstrap belongs to the session that just ended.
    resetBootstrap();
  } else {
    void qc.resetQueries();
  }
  clearBalanceCache();
  useOfflineQueueStore.getState().clearAll();
  // Synced settings (tags, goals, templates, budgets) are reloaded from the
  // server for whoever signs in next. Device-level switches survive _reset.
  useSettingsStore.getState()._reset();

  // Persisted
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isUserKey(key)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch { /* storage unavailable */ }

  if (Capacitor.isNativePlatform()) {
    // The offline cache lives in Capacitor Preferences on native (see
    // useOfflinePersist), outside the WebView's local storage.
    void (async () => {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const { keys } = await Preferences.keys();
        await Promise.all(keys.filter(isUserKey).map((key) => Preferences.remove({ key })));
      } catch { /* native bridge unavailable */ }
    })();
  }
}
