import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['tests/node_modules/**', 'node_modules/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'tests/**'],
    },
  },
});
