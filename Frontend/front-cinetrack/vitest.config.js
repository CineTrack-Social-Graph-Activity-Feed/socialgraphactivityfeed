import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/.*rc.js',
        '**/*.test.{js,jsx}',
        'src/compenents/navbar/Navbar.jsx',
      ],
      thresholds: {
        lines: 78,
        functions: 73,
        branches: 75,
        statements: 78
      },
    }
  }
});
