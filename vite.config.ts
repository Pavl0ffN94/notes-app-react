import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/notes-app-react/',
  plugins: [react()],
  server: {
    port: 5176,
  },
  build: {
    outDir: 'dist',
  },
});
