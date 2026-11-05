import { defineConfig, devices } from '@playwright/test'

/**
 * Hard, local-build UX checks: test the PR's newly built Vite assets, NOT the
 * previous GitHub Pages release. Does not connect wallets or send transactions.
 */
export default defineConfig({
  testDir: '.',
  testMatch: /public-(?:ux-responsive|route-inventory)\.spec\.ts$/,
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/ux-local', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    serviceWorkers: 'block',
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  timeout: 70_000,
  expect: { timeout: 15_000 },
  webServer: {
    command: 'npm run preview --prefix ../apps/frontend -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/xArtists/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
