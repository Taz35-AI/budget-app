'use client';

import { useMemo } from 'react';
import { TAGS } from '@/lib/constants';
import { useSettingsStore } from '@/store/settingsStore';

export function useSettings() {
  const store = useSettingsStore();

  const allTags = useMemo<Record<string, { label: string; color: string }>>(() => {
    const result: Record<string, { label: string; color: string }> = { ...TAGS };
    store.customTags.forEach((t) => {
      result[t.id] = { label: t.label, color: t.color };
    });
    return result;
  }, [store.customTags]);

  return { ...store, allTags };
}
