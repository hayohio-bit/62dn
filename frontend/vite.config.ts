import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // 빌드 결과는 GitHub Pages의 하위 경로(/62dn/)에 올라간다. 다른 경로에 올리면 VITE_BASE로 바꾼다 (개발 서버는 /)
  base: process.env.VITE_BASE ?? (command === 'build' ? '/62dn/' : '/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
}));
