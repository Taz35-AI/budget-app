import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budgetapp.app',
  appName: 'Budget App',
  webDir: 'out',
  server: {
    // Points the native shell to the live production site.
    // Remove this block (and run `npx next build && npx next export`)
    // only if you later convert the app to a fully static export.
    url: 'https://budget-app.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#0C1F1E',
  },
};

export default config;
