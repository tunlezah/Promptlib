// Browser smoke tests. `npm run test:e2e` builds a test site (base path /lib/, mock AI endpoint) and serves it.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4180;
const env = { ...process.env, SITE_CONFIG: 'tests/e2e/site.config.test.yml' };

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /.*\.spec\.js/,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/lib/`,
    trace: 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
    serviceWorkers: 'block',
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined }
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    { name: 'mobile-390', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ],
  webServer: {
    command: `node scripts/build.js --out public-e2e --quiet && node scripts/dev.js --no-build --dir public-e2e --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/lib/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env
  }
});
