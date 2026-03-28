'use client';

import { useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

type ImpactStyle = 'light' | 'medium' | 'heavy';

/**
 * Returns haptic feedback functions that fire only when:
 *  - Running inside Capacitor (native iOS / Android)
 *  - The user has haptics enabled in settings
 *
 * On web / browser the functions are silent no-ops so it's safe to call everywhere.
 */
export function useHaptics() {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const impact = useCallback(
    async (style: ImpactStyle = 'medium') => {
      if (!hapticsEnabled) return;
      // Dynamically import so the bundle doesn't break on web where Capacitor isn't available
      try {
        const { Haptics, ImpactStyle: IS } = await import('@capacitor/haptics');
        const styleMap = { light: IS.Light, medium: IS.Medium, heavy: IS.Heavy };
        await Haptics.impact({ style: styleMap[style] });
      } catch {
        // Not running in Capacitor native shell — silently ignore
      }
    },
    [hapticsEnabled],
  );

  const notification = useCallback(
    async (type: 'success' | 'warning' | 'error' = 'success') => {
      if (!hapticsEnabled) return;
      try {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        const typeMap = {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        };
        await Haptics.notification({ type: typeMap[type] });
      } catch {
        // Silently ignore on web
      }
    },
    [hapticsEnabled],
  );

  const selection = useCallback(async () => {
    if (!hapticsEnabled) return;
    try {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.selectionChanged();
    } catch {
      // Silently ignore on web
    }
  }, [hapticsEnabled]);

  return { impact, notification, selection };
}
