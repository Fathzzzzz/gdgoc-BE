import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server and preview bind to port 3000: the backend's CORS allowlist already
// includes http://localhost:3000 and http://127.0.0.1:3000, so absolute API base
// URLs keep working without touching backend configuration.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});