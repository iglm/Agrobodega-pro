import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Changed from './' to '/' for better compatibility with Cloud Run/Nginx routing
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 8080, // Matches Cloud Run default
    allowedHosts: ['all']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});