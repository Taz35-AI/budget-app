import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spentum.app',
  appName: 'Spentum',
  webDir: 'out',
  server: {
    url: 'https://www.spentum.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#0C0C1A',
  },
  plugins: {
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;
