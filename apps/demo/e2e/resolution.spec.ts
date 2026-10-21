import { expect, test } from '@playwright/test';
import { load } from './helpers.js';

test('clear discards a pending response and resets lookup permission', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  await page.route('https://v2.xivapi.com/**', async (route) => {
    if (route.request().url().includes('/version')) {
      await route.fulfill({
        json: { versions: [{ key: V, names: ['latest'] }] },
      });
      return;
    }
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route
      .fulfill({
        json: {
          version: V,
          schema: S,
          results: [item(1, 'STALE_AFTER_CLEAR')],
        },
      })
      .catch(() => {});
  });
  await load(page, { Body: { ModelBase: 361, ModelVariant: 5 } });
  await expect(page.getByTestId('identity')).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Resolve equipment and dye names',
      exact: true,
    })
    .click();
  await expect.poll(() => Boolean(release)).toBe(true);
  await page.getByRole('button', { name: 'Clear file', exact: true }).click();
  release?.();
  await expect(page.getByTestId('identity')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('STALE_AFTER_CLEAR');
});

test('pages candidate lists in bounded reversible groups', async ({ page }) => {
  await page.route('https://v2.xivapi.com/**', (route) =>
    route.fulfill({
      json: route.request().url().includes('/version')
        ? { versions: [{ key: V, names: ['latest'] }] }
        : {
            version: V,
            schema: S,
            results: Array.from({ length: 25 }, (_, i) =>
              item(i + 1, `Candidate ${i + 1}`),
            ),
          },
    }),
  );
  await load(page, { Body: { ModelBase: 361, ModelVariant: 5 } });
  await expect(page.getByTestId('identity')).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Resolve equipment and dye names',
      exact: true,
    })
    .click();
  await page.getByText('25 candidates', { exact: true }).click();
  await expect(page.locator('.candidate-list li')).toHaveCount(10);
  await page.getByRole('button', { name: 'Show next 10 candidates' }).click();
  await expect(page.locator('.candidate-list li')).toHaveCount(10);
  await expect(page.locator('.candidate-list li').first()).toContainText(
    'Candidate 11',
  );
  await page
    .getByRole('button', { name: 'Show previous 10 candidates' })
    .click();
  await expect(page.locator('.candidate-list li').first()).toContainText(
    'Candidate 1',
  );
});

const V = '0123456789abcdef';
const S = `exdschema@2:rev:${'a'.repeat(40)}`;
const item = (id: number, name: string) => ({
  sheet: 'Item',
  row_id: id,
  fields: {
    'Name@lang(en)': name,
    ModelMain: 328041,
    ModelSub: 0,
    EquipSlotCategory: { fields: { Body: 1 } },
  },
});
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
test('requires an explicit lookup, shows every candidate and sends only identifiers', async ({
  page,
}) => {
  const urls: string[] = [];
  await page.route('https://v2.xivapi.com/**', async (route) => {
    urls.push(route.request().url());
    await route.fulfill({
      json: route.request().url().includes('/version')
        ? { versions: [{ key: V, names: ['latest'] }] }
        : {
            version: V,
            schema: S,
            results: [
              item(2, 'Synthetic alternate'),
              item(1, '<img src=x onerror=alert(1)>'),
            ],
          },
    });
  });
  await load(page, {
    Author: 'PRIVATE_AUTHOR',
    Nickname: 'PRIVATE_NAME',
    HairTone: 0,
    Body: { ModelBase: 361, ModelVariant: 5, DyeId: 88, DyeId2: 77 },
  });
  await expect(page.getByTestId('identity')).toBeVisible();
  expect(urls).toEqual([]);
  await page
    .getByRole('button', {
      name: 'Resolve equipment and dye names',
      exact: true,
    })
    .click();
  await expect(page.getByTestId('equipment')).toContainText('2 candidates');
  await page.getByText('2 candidates', { exact: true }).click();
  await expect(page.getByTestId('equipment')).toContainText(
    '<img src=x onerror=alert(1)>',
  );
  expect(urls.join(' ')).not.toMatch(/PRIVATE_|DyeId|HairTone|Nickname|Author/);
  expect(
    new URL(
      urls.find((url) => url.includes('/sheet/Stain')) ??
        'https://invalid.invalid',
    ).searchParams.get('rows'),
  ).toBe('77,88');
  await expect(page.getByTestId('lookup-evidence')).toContainText(V);
});
test('keeps local inspection usable during upstream failure', async ({
  page,
}) => {
  await page.route('https://v2.xivapi.com/**', (route) =>
    route.fulfill({ status: 500, body: 'PRIVATE_SERVER_ERROR' }),
  );
  await load(page, {
    Tribe: 'Midlander',
    Body: { ModelBase: 361, ModelVariant: 5 },
  });
  await expect(page.getByTestId('identity')).toBeVisible();
  await page.getByRole('button', { name: 'Resolve equipment' }).click();
  await expect(page.getByTestId('equipment')).toContainText('Unavailable');
  await expect(page.getByTestId('identity')).toContainText('Hyur');
  expect(await page.locator('body').textContent()).not.toContain(
    'PRIVATE_SERVER_ERROR',
  );
});
test('discards a slow lookup after a new file or clear', async ({ page }) => {
  let release: (() => void) | undefined;
  await page.route('https://v2.xivapi.com/**', async (route) => {
    if (route.request().url().includes('/version')) {
      await route.fulfill({
        json: { versions: [{ key: V, names: ['latest'] }] },
      });
      return;
    }
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route
      .fulfill({
        json: { version: V, schema: S, results: [item(1, 'STALE_ITEM')] },
      })
      .catch(() => {});
  });
  await load(page, {
    Tribe: 'Midlander',
    Body: { ModelBase: 361, ModelVariant: 5 },
  });
  await expect(page.getByTestId('identity')).toBeVisible();
  await page.getByRole('button', { name: 'Resolve equipment' }).click();
  await expect.poll(() => Boolean(release)).toBe(true);
  await load(page, { Tribe: 'Xaela' }, 'second.chara');
  await expect(page.getByTestId('identity')).toContainText('Au Ra');
  release?.();
  await expect(page.getByTestId('equipment')).not.toContainText('STALE_ITEM');
  await expect(page.getByTestId('lookup-evidence')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear file' }).click();
  await expect(page.getByTestId('identity')).toHaveCount(0);
});
test('does not persist documents or private metadata in browser storage or URLs', async ({
  page,
}) => {
  await load(page, { Nickname: 'PRIVATE_STORAGE_CANARY', HairTone: 0 });
  await expect(page.getByTestId('identity')).toBeVisible();
  expect(
    await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      databases: (await indexedDB.databases()).length,
      caches: (await caches.keys()).length,
    })),
  ).toEqual({ local: 0, session: 0, databases: 0, caches: 0 });
  expect(page.url()).not.toContain('PRIVATE_STORAGE_CANARY');
});
