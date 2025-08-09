import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.498898c117f14d51be6e9825ae95fb44',
  appName: 'Kaffa Online Store',
  webDir: 'dist',
  server: {
    url: 'https://498898c1-17f1-4d51-be6e-9825ae95fb44.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#16a34a',
      showSpinner: false
    }
  }
};

export default config;