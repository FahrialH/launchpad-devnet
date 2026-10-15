import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@solana-mobile/wallet-adapter-mobile', replacement: path.resolve(__dirname, './src/shims/solana-mobile-mock.ts') },
    ],
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  
  server: {
    allowedHosts: true
  },
});
