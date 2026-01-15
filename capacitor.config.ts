
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agrobodega.pro', // Puedes cambiar esto por tu ID real
  appName: 'AgroBodega Pro',
  webDir: 'dist', // CRÍTICO: Vite compila por defecto en 'dist'
  server: {
    androidScheme: 'https', // Usa https interno para evitar bloqueos de seguridad
    cleartext: true,        // Permite tráfico http si fuera necesario
    allowNavigation: ['*']  // Asegura navegación fluida
  },
  plugins: {
    Keyboard: {
      resize: 'body',       // Evita que el teclado rompa el layout visual
      style: 'DARK',
      scrollToInput: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffffff",
      showSpinner: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null,
    }
  }
};

export default config;
