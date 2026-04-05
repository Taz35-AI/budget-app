'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Syncs the Zustand settings store with Supabase so settings roam across devices.
 * - On mount: loads from /api/settings and hydrates the store.
 * - On store change: debounce-saves back to /api/settings (immediately for deletions).
 * - On beforeunload: flushes any pending save with keepalive so reloads don't lose changes.
 * Silently no-ops when the user is not authenticated.
 */
export function SettingsSyncProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((s) => s._hydrate);
  const reset = useSettingsStore((s) => s._reset);

  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let hydrated = false;

    const buildBody = () => {
      const s = useSettingsStore.getState();
      return {
        customTags: s.customTags,
        hiddenBuiltinTags: s.hiddenBuiltinTags,
        templates: s.templates,
        goals: s.goals,
        accounts: s.accounts,
        tagBudgets: s.tagBudgets,
        firstDayOfWeek: s.firstDayOfWeek,
        dateFormat: s.dateFormat,
        language: s.language,
      };
    };

    // Load settings from server, hydrate store once.
    // If the server has no record for the logged-in user (brand-new account),
    // reset the store to defaults so we don't inherit a previous account's
    // localStorage (e.g. a different user's language preference on the same
    // device).
    fetch('/api/settings')
      .then(async (r) => {
        if (!r.ok) return { ok: false as const };
        const data = await r.json();
        return { ok: true as const, data };
      })
      .then((result) => {
        if (result.ok) {
          if (result.data) {
            hydrate(result.data);
          } else {
            // Request succeeded but server has no settings for this user →
            // brand-new account. Reset localStorage-carried state.
            reset();
          }
        }
        hydrated = true;
      })
      .catch(() => {
        hydrated = true;
      });

    // Subscribe to store changes and debounce-save to server.
    // Deletions (goals/templates/accounts shrinking) save immediately so a
    // page reload before the debounce fires can't restore the deleted item.
    const unsub = useSettingsStore.subscribe((state, prevState) => {
      if (!hydrated) return;
      if (saveTimer) clearTimeout(saveTimer);

      const isDestructive =
        state.goals.length < prevState.goals.length ||
        state.templates.length < prevState.templates.length ||
        state.accounts.length < prevState.accounts.length ||
        state.customTags.length < prevState.customTags.length;

      saveTimer = setTimeout(() => {
        saveTimer = null;
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody()),
        }).catch(() => {});
      }, isDestructive ? 0 : 800);
    });

    // Flush any pending save before the page unloads so hard-reloads don't
    // restore deleted items from stale server data.
    const handleBeforeUnload = () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody()),
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsub();
      if (saveTimer) clearTimeout(saveTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hydrate, reset]);

  return <>{children}</>;
}
