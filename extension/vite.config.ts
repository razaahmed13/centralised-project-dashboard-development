import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.tsx'),
      },
      output: {
        entryFileNames: '[name]/index.js',
        chunkFileNames: 'shared/[name].js',
        assetFileNames: (info) => {
          if (info.name?.endsWith('.css')) return 'popup/style.css';
          return 'assets/[name][extname]';
        },
      },
    },
  },
});