import path from 'node:path';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/**
 * Vite - Panel administrativo Educa Lambayeque.
 *
 * El alias `@` apunta a `src` y `@shared` al paquete de contratos, para
 * que los imports sean legibles y no dependan de la estructura de
 * workspaces.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // En desarrollo, el panel llama a /api y Vite lo reenvia a la API.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Se separan las dependencias grandes para mejorar la cache.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});

