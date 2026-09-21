import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 60_000,
  workers: 2,
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://127.0.0.1:4321',
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PREVIEW_URL ? undefined : { command: 'npm run preview -- --host 127.0.0.1', url: 'http://127.0.0.1:4321', reuseExistingServer: true },
});
