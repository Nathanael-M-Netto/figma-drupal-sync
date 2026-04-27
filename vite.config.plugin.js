import { defineConfig } from 'vite';
import path from 'path';

/**
 * Vite config para o backend do plugin Figma (sandbox).
 *
 * Compila src/plugin/main.js → dist/code.js como IIFE.
 * O sandbox do Figma NÃO suporta módulos ES, portanto
 * todo o código deve ser empacotado em um único IIFE.
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2017',
    lib: {
      entry: path.resolve(__dirname, 'src/plugin/main.js'),
      name: 'FigmaDrupalSync',
      fileName: () => 'code.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Garante que o output é um único arquivo
        inlineDynamicImports: true,
        // Não gera sourcemap no sandbox
        sourcemap: false,
      },
    },
  },
});
