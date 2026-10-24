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

export const V = '0123456789abcdef';
export const S = `exdschema@2:rev:${'a'.repeat(40)}`;
export const item = (id: number, name: string) => ({
  sheet: 'Item',
  row_id: id,
  fields: {
    'Name@lang(en)': name,
    ModelMain: 328041,
    ModelSub: 0,
    EquipSlotCategory: { fields: { Body: 1 } },
  },
});

export const resolveButton = (page: Page) =>
  page.getByRole('button', {
    name: 'Resolve equipment and dye names',
    exact: true,
  });
// Holds every XIVAPI request except the version probe until `release()` is called.
export async function holdLookup(page: Page) {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://v2.xivapi.com/**', async (route) => {
    if (route.request().url().includes('/version')) {
      await route.fulfill({
        json: { versions: [{ key: V, names: ['latest'] }] },
      });
      return;
    }
    await gate;
    await route
      .fulfill({ json: { version: V, schema: S, results: [item(1, 'Held')] } })
      .catch(() => {});
  });
  return () => release();
}
export async function answerLookup(page: Page, count = 1) {
  await page.route('https://v2.xivapi.com/**', (route) =>
    route.fulfill({
      json: route.request().url().includes('/version')
        ? { versions: [{ key: V, names: ['latest'] }] }
        : {
            version: V,
            schema: S,
            results: Array.from({ length: count }, (_, i) =>
              item(i + 1, `Candidate ${i + 1}`),
            ),
          },
    }),
  );
}
export const equipmentBody = { Body: { ModelBase: 361, ModelVariant: 5 } };
export const activeId = (page: Page) =>
  page.evaluate(() => document.activeElement?.id ?? '');
