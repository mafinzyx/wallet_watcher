import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,        // чтобы test/expect были глобально
    environment: 'jsdom', // вот эта строка критична
    setupFiles: './vitest.setup.ts', 
  },
});
