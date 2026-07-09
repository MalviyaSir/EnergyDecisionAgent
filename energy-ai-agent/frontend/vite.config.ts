import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@shared': path.resolve(dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': backendUrl,
      '/health': backendUrl,
    },
  },
});
