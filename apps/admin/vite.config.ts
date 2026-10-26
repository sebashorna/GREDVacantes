import path from 'node:path';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

/**
 * Vite - Panel administrativo Educa Lambayeque.
 *
 * El alias `@` apunta a `src` y `@shared` al paquete de contratos, para
 * que los imports sean legibles y no dependan de la estructura de
 * workspaces.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  if (mode === 'mobile') {
    const configuredApiUrl = env.VITE_API_URL;
    if (!configuredApiUrl) {
      throw new Error('Define VITE_API_URL en apps/admin/.env.mobile.local con la URL HTTPS de la API accesible desde el teléfono.');
    }

    let apiUrl: URL;
    try {
      apiUrl = new URL(configuredApiUrl);
    } catch {
      throw new Error('Define VITE_API_URL en apps/admin/.env.mobile.local con la URL HTTPS de la API accesible desde el teléfono.');
    }
    if (apiUrl.protocol !== 'https:' || apiUrl.hostname.endsWith('.invalid')) {
      throw new Error('La compilación Android requiere una URL HTTPS real en VITE_API_URL; no uses localhost ni un dominio de ejemplo.');
    }
    if (env.VITE_APP_MOBILE !== 'true') {
      throw new Error('Define VITE_APP_MOBILE=true en apps/admin/.env.mobile.local.');
    }
  }

  return {
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
  };
});
