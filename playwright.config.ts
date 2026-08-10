import { defineConfig, devices } from '@playwright/test'

/**
 * E2E covers the Slice 1 gate: the pipeline from file selection through to a
 * real downloaded PNG.
 *
 * Runs against the PRODUCTION build, not the dev server. Dev-mode React double-
 * invokes effects and skips minification, so a pass there says less than we
 * need about what actually ships.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  /**
   * This suite is CPU-bound, not IO-bound: nearly every test decodes a photo,
   * renders 1080×1350 canvases and PNG-encodes them, repeatedly. Playwright
   * defaults to one worker per core, and on 12 cores that starved the shared
   * server badly enough that tests which pass in 2.8s alone were timing out at
   * 20s+ and cascading failures into unrelated specs.
   *
   * Two workers keeps the two projects moving without contending for the
   * encoder. Measured, not guessed — the same specs pass in isolation.
   */
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,

  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    // A phone-sized viewport is not a phone — it shares desktop Chromium's
    // memory limits, canvas ceiling, HEIC support and download behaviour. It
    // catches layout regressions and nothing else. Real-device findings come
    // from the spike harness.
    { name: 'mobile-viewport', use: { ...devices['Pixel 7'] } },
  ],

  webServer: {
    command: 'pnpm build && pnpm start --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
