'use client';

import { useMemo } from 'react';
import { TAGS } from '@/lib/constants';
import { useSettingsStore } from '@/store/settingsStore';

export function useSettings() {
  const store = useSettingsStore();

  const allTags = useMemo<Record<string, { label: string; color: string; category: 'income' | 'expense' | 'both' }>>(() => {
    const result: Record<string, { label: string; color: string; category: 'income' | 'expense' | 'both' }> = {};
    // Add non-hidden built-ins first
    for (const [key, val] of Object.entries(TAGS)) {
      if (!store.hiddenBuiltinTags.includes(key)) {
        result[key] = val;
      }
    }
    // Custom tags: override built-ins (if not hidden) or add new entries.
    // Older custom tags saved before this field existed default to 'both'.
    store.customTags.forEach((t) => {
      if (TAGS[t.id] && store.hiddenBuiltinTags.includes(t.id)) return;
      result[t.id] = { label: t.label, color: t.color, category: t.category ?? 'both' };
    });
    return result;
  }, [store.customTags, store.hiddenBuiltinTags]);

  return { ...store, allTags };
}
