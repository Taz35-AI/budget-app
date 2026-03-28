'use client';

import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useSettingsStore } from '@/store/settingsStore';

type ImpactStyleKey = 'light' | 'medium' | 'heavy';

const IMPACT_MAP = {
  light:  ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy:  ImpactStyle.Heavy,
} as const;

const NOTIF_MAP = {
  success: NotificationType.Success,
  warning: NotificationType.Warning,
  error:   NotificationType.Error,
} as const;

/**
 * Wraps Capacitor Haptics.
 * - Silent no-op on web / browser (Capacitor.isNativePlatform() === false)
 * - Respects the user's hapticsEnabled setting
 *
 * All functions accept an optional `forceEnabled` boolean so callers can
 * bypass the store check when they know haptics should fire (e.g. right after
 * toggling the setting on before the store update propagates).
 */
export function useHaptics() {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const impact = useCallback(
    (style: ImpactStyleKey = 'medium', forceEnabled?: boolean) => {
      if (!(forceEnabled ?? hapticsEnabled)) return;
      if (!Capacitor.isNativePlatform()) return;
      Haptics.impact({ style: IMPACT_MAP[style] }).catch(() => {});
    },
    [hapticsEnabled],
  );

  const notification = useCallback(
    (type: keyof typeof NOTIF_MAP = 'success', forceEnabled?: boolean) => {
      if (!(forceEnabled ?? hapticsEnabled)) return;
      if (!Capacitor.isNativePlatform()) return;
      Haptics.notification({ type: NOTIF_MAP[type] }).catch(() => {});
    },
    [hapticsEnabled],
  );

  const selection = useCallback(
    (forceEnabled?: boolean) => {
      if (!(forceEnabled ?? hapticsEnabled)) return;
      if (!Capacitor.isNativePlatform()) return;
      Haptics.selectionChanged().catch(() => {});
    },
    [hapticsEnabled],
  );

  return { impact, notification, selection };
}
