import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

/**
 * Vite config para a UI do plugin (React → HTML inline).
 *
 * O Figma exige que a UI seja um único arquivo HTML com
 * todo CSS e JS embutidos inline. O plugin `vite-plugin-singlefile`
 * cuida disso automaticamente.
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: '.',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2017',
    assetsInlineLimit: 100000000, // Força inline de todos os assets
    cssCodeSplit: false,
    rollupOptions: {
      input: 'index.html',
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
