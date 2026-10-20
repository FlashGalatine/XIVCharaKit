import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  outputDir: '../../.superpowers/demo-test-results',
  reporter: 'list',
  workers: 1,
  timeout: 20_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1374, height: 1145 },
  },
  webServer: {
    command: 'pnpm --filter xivcharakit build && pnpm build && pnpm preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
