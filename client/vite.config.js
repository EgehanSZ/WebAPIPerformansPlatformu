// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev sunucusu çalışırken /api isteklerini Vercel dev'e (varsayılan
// olarak http://localhost:3000) proxy'leriz. Bu sayede frontend ile
// serverless fonksiyonları lokalde birlikte test edilebilir.
//
// Production'da Vercel zaten /api/* ve / paths'larını aynı domain'de
// servis ediyor — proxy gerekmez.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
