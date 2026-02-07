import { defineConfig } from 'vitest/config'
import path from 'path'
import 'dotenv/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Default to node for service tests
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@payload-config': path.resolve(__dirname, './src/payload.config.ts'),
    },
    coverage: {
      provider: 'v8',
    },
    hookTimeout: 60000,
    testTimeout: 60000,
  },
})
