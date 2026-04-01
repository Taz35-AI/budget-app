'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Only runs inside the Capacitor native shell.
// Listens for the custom-scheme deep link that Supabase redirects to after
// Google OAuth (com.spentum.app://auth/callback?code=...), exchanges the
// code for a session, closes the in-app browser, then navigates to /dashboard.
export function CapacitorAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        const { Browser } = await import('@capacitor/browser');
        const supabase = createClient();

        const listener = await App.addListener('appUrlOpen', async ({ url }) => {
          if (!url.startsWith('com.spentum.app://auth/callback')) return;

          // Parse the code/tokens out of the deep link URL
          const normalized = url.replace('com.spentum.app://', 'https://www.spentum.com/');
          const { searchParams } = new URL(normalized);
          const code = searchParams.get('code');

          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) {
              await Browser.close();
              router.push('/dashboard');
              router.refresh();
            }
          }
        });

        cleanup = () => { listener.remove(); };
      } catch {
        // Not in a Capacitor environment — ignore
      }
    })();

    return () => { cleanup?.(); };
  }, [router]);

  return null;
}
