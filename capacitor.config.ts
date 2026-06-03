import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mardon.workouttracker',
  appName: 'Workout Tracker',
  webDir: 'dist',
  android: {
    backgroundColor: '#0f1f3d',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
