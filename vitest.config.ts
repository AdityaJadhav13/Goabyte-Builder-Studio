import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    // Pure logic runs in Node. ARCHITECTURE §4 R-1 keeps `lib/` free of React
    // and DOM globals precisely so this stays true and stays fast.
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
