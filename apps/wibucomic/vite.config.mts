/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// set frontendDir to the actual frontend folder containing index.html
const frontendDir = path.resolve(__dirname, '../../frontend');

export default defineConfig({
  // use frontend as the Vite root so index.html is resolvable
  root: frontendDir,
  cacheDir: path.resolve(__dirname, '../node_modules/.vite/frontend'),
  
  server: {
    port: 4200,
    host: 'localhost',
  },
  
  preview: {
    port: 4200,
    host: 'localhost',
  },
  
  plugins: [
    react(),
    nxViteTsPaths(),
  ],
  
  build: {
    outDir: path.resolve(frontendDir, 'dist'),
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        main: path.resolve(frontendDir, 'index.html')
      }
    }
  },
  test: {
    name: '@wibucomic/frontend',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});