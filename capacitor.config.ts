import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'NoteA',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      allowImageEditing: true
    },
    Geolocation: {}
  }
};

export default config;
