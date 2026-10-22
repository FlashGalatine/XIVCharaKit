import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

const baseURL = process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:4175';
export default defineConfig({
  ...base,
  testDir: './',
  testMatch: ['**/e2e/**/*.spec.ts', '**/hosting/**/*.spec.ts'],
  outputDir: '../../.superpowers/demo-cloudflare-test-results',
  use: { ...base.use, baseURL },
  webServer: process.env.DEMO_BASE_URL
    ? []
    : {
        command:
          'pnpm --filter xivcharakit build && pnpm build && pnpm preview:cloudflare',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
