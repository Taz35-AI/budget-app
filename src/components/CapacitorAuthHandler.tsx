'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Runs only inside the Capacitor native shell.
// Handles two things:
// 1. Listens for the custom-scheme deep link after Google OAuth
//    (com.spentum.app://auth/callback?code=...) and exchanges it for a session.
// 2. Closes the @capacitor/browser overlay as soon as Supabase confirms SIGNED_IN.
export function CapacitorAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        const { Browser } = await import('@capacitor/browser');
        const supabase = createClient();

        // Close the in-app browser overlay the moment auth succeeds
        const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN') {
            Browser.close().catch(() => {});
            router.push('/dashboard');
            router.refresh();
          }
        });
        cleanups.push(() => authListener.subscription.unsubscribe());

        // Exchange the OAuth code that arrives via deep link
        const appListener = await App.addListener('appUrlOpen', async ({ url }) => {
          if (!url.startsWith('com.spentum.app://auth/callback')) return;

          const normalized = url.replace('com.spentum.app://', 'https://www.spentum.com/');
          const code = new URL(normalized).searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            // onAuthStateChange fires SIGNED_IN → browser closes + redirect happens there
          }
        });
        cleanups.push(() => appListener.remove());

      } catch {
        // Not in a Capacitor environment — ignore
      }
    })();

    return () => { cleanups.forEach((fn) => fn()); };
  }, [router]);

  return null;
}
