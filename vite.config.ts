import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 8443,
    strictPort: true,
    proxy: {
      '/api': { target: `http://127.0.0.1:${process.env.API_PORT || 8787}` },
    },
  },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            {
              name: 'three-core',
              test: /three[\\/]build[\\/]three.core.js/,
              priority: 20,
            },
            {
              name: 'three-renderer',
              test: /three[\\/]build[\\/]three.module.js/,
              priority: 10,
            },
            { name: 'three-addons', test: /node_modules[\\/]three[\\/]/ },
          ],
        },
      },
    },
  },
});
