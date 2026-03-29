'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Syncs the Zustand settings store with Supabase so settings roam across devices.
 * - On mount: loads from /api/settings and hydrates the store.
 * - On store change: debounce-saves back to /api/settings.
 * Silently no-ops when the user is not authenticated.
 */
export function SettingsSyncProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((s) => s._hydrate);

  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let hydrated = false;

    // Load settings from server, hydrate store once
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) hydrate(data);
        hydrated = true;
      })
      .catch(() => {
        hydrated = true;
      });

    // Subscribe to store changes and debounce-save to server
    const unsub = useSettingsStore.subscribe((state) => {
      if (!hydrated) return;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customTags: state.customTags,
            hiddenBuiltinTags: state.hiddenBuiltinTags,
            templates: state.templates,
            goals: state.goals,
            accounts: state.accounts,
            tagBudgets: state.tagBudgets,
            firstDayOfWeek: state.firstDayOfWeek,
            dateFormat: state.dateFormat,
            language: state.language,
          }),
        }).catch(() => {});
      }, 800);
    });

    return () => {
      unsub();
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [hydrate]);

  return <>{children}</>;
}
