import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'firebase'],
  },
  server: {
    port: 5174,
    fs: { allow: [path.resolve(__dirname, '..', '..')] },
  },
});
