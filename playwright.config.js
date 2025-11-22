// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,  // Changed: Run sequentially to avoid Service Worker conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,  // Optimized: No retries in dev to speed up tests
  workers: 1,  // Changed: Force single worker to prevent SW state leakage
  reporter: 'list',
  timeout: 30000,  // Added: 30s timeout per test (default was 30s)
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',  // ADDED: Block Service Worker registration during tests
    actionTimeout: 10000,  // Added: 10s timeout for actions
    navigationTimeout: 15000,  // Added: 15s for navigations
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ]
    }
  },

  // Web server to serve static files (required for service worker to work)
  webServer: {
    command: 'npx http-server -p 3000 -c-1',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'chromium-headed',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        viewport: { width: 1280, height: 720 }
      },
    },
  ],
});
