'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/store/settingsStore';
import { takeBootstrapSlice } from '@/lib/bootstrap';
import { clearUserData, isDifferentUser, rememberUser } from '@/lib/sessionData';

/**
 * Syncs the Zustand settings store with Supabase so settings roam across devices.
 * - When someone signs in (or the page opens with a session): loads their
 *   settings from the server and hydrates the store.
 * - On store change: debounce-saves back to /api/settings (immediately for deletions).
 * - On beforeunload: flushes any pending save with keepalive so reloads don't lose changes.
 * - When the session ends, or a different person signs in: drops the previous
 *   user's cached data from this device (see lib/sessionData).
 * Does nothing while nobody is signed in.
 */
export function SettingsSyncProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((s) => s._hydrate);
  const reset = useSettingsStore((s) => s._reset);
  const qc = useQueryClient();

  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    // Saving is only allowed once the signed-in user's settings have been
    // loaded. Until then the store holds defaults or a stale local copy, and
    // writing that to the server would overwrite their real settings.
    let hydrated = false;
    let loadedFor: string | null = null;
    // Guards against a slow response for one user landing after another signed in.
    let loadSeq = 0;

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

    // On app pages the settings arrive with the page's bootstrap request; this
    // only makes its own request when there is no bootstrap to join.
    const fetchSettings = async () => {
      const boot = await takeBootstrapSlice('settings', { start: false });
      if (boot) return { ok: true as const, data: boot.settings };
      const r = await fetch('/api/settings');
      if (!r.ok) return { ok: false as const };
      const data = await r.json();
      return { ok: true as const, data };
    };

    const loadFor = (userId: string) => {
      const seq = ++loadSeq;
      hydrated = false;

      // Someone else used this browser last: their cached data must not be
      // shown to, or saved under, this account.
      if (isDifferentUser(userId)) clearUserData(qc, 'user-changed');
      rememberUser(userId);

      fetchSettings()
        .then((result) => {
          if (seq !== loadSeq) return;
          if (result.ok) {
            if (result.data) {
              hydrate(result.data as Parameters<typeof hydrate>[0]);
            } else {
              // Request succeeded but server has no settings for this user →
              // brand-new account. Reset localStorage-carried state.
              reset();
            }
          }
          hydrated = true;
        })
        .catch(() => {
          if (seq === loadSeq) hydrated = true;
        });
    };

    // The session is the trigger, not the mount. This provider lives in the
    // root layout, which is NOT re-mounted by the client-side navigation that
    // follows an email/password login: loading only on mount meant settings
    // were never fetched after signing in, and the first change then saved the
    // empty local copy over the user's real settings.
    //
    // Fires with INITIAL_SESSION when the page opens, SIGNED_IN on login (and
    // again on tab focus, hence the loadedFor check) and SIGNED_OUT on logout.
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? null;

      if (!userId) {
        hydrated = false;
        loadedFor = null;
        loadSeq += 1;
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
        if (event === 'SIGNED_OUT') clearUserData(qc, 'signed-out');
        return;
      }

      if (userId === loadedFor) return;
      loadedFor = userId;
      loadFor(userId);
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
      subscription.unsubscribe();
      unsub();
      if (saveTimer) clearTimeout(saveTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hydrate, reset, qc]);

  return <>{children}</>;
}
