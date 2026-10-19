import type { Page } from '@playwright/test';
export async function load(page: Page, content: unknown, name = 'test.chara') {
  await page.locator('input[type=file]').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(
      typeof content === 'string' ? content : JSON.stringify(content),
    ),
  });
}
