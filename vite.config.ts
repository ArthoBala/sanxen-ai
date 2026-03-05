import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 8080,
  },
  esbuild: {
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      sourcemap: false,
    },
  },
  build: {
    outDir: 'client/dist',
    sourcemap: false,
  },
  css: {
    devSourcemap: false,
  },
});
