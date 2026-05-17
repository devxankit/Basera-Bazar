'use strict';

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // run serially — avoids port conflicts
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start Vite dev server before tests, stop it after.
  // API calls are mocked inside each test via page.route(), so the
  // real backend does NOT need to be running.
  webServer: {
    command: 'npm run dev -- --port 5173',
    cwd: './client',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60_000,
    stderr: 'ignore', // suppress VitePWA macOS EPERM warnings
  },
});
