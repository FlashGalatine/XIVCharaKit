import { expect, test } from './fixtures.js';
import {
  controlLookup,
  equipmentBody,
  load,
  mockXivapi,
  resolveButton,
} from './helpers.js';

// How a lookup ends other than by finishing: Clear, a replacement file, Cancel. What the page does
// has to be seen on the network (a request it gave up on is reported as failed), and the control
// that starts a lookup has to be usable again afterwards.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

/** A clock that stands still until the test moves it, so a deadline can be probed to the millisecond. */
async function pauseClock(page: import('@playwright/test').Page) {
  const start = new Date('2026-01-01T00:00:00Z');
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 1000));
}

const clear = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Clear file', exact: true });
const cancel = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Cancel lookup', exact: true });

test.describe('Clear and replacement while a lookup is running', () => {
  test('Clear aborts the held request, and the next file can be looked up', async ({
    page,
  }) => {
    const lookup = await controlLookup(page);
    await load(page, equipmentBody);
    await expect(page.getByTestId('identity')).toBeVisible();
    await resolveButton(page).click();
    await expect.poll(() => lookup.searches()).toBe(1);
    // A lookup that is running cannot be started again.
    await expect(resolveButton(page)).toBeDisabled();
    await clear(page).click();
    await expect.poll(() => lookup.seen.aborted).toContain('/api/search');
    lookup.answer();
    await load(page, equipmentBody, 'next.chara');
    await expect(page.getByTestId('identity')).toBeVisible();
    await expect(resolveButton(page)).toBeEnabled();
    await resolveButton(page).click();
    await expect(page.getByTestId('equipment')).toContainText('Candidate 1');
    expect(lookup.searches()).toBe(2);
  });

  test('a replacement file aborts the held request and gets a fresh one', async ({
    page,
  }) => {
    const lookup = await controlLookup(page);
    await load(page, equipmentBody);
    await expect(page.getByTestId('identity')).toBeVisible();
    await resolveButton(page).click();
    await expect.poll(() => lookup.searches()).toBe(1);
    await load(page, { Tribe: 'Xaela', ...equipmentBody }, 'second.chara');
    await expect(page.getByTestId('identity')).toContainText('Au Ra');
    await expect.poll(() => lookup.seen.aborted).toContain('/api/search');
    lookup.answer();
    await expect(resolveButton(page)).toBeEnabled();
    await expect(page.getByTestId('equipment')).not.toContainText('Candidate');
    await resolveButton(page).click();
    await expect(page.getByTestId('equipment')).toContainText('Candidate 1');
    expect(lookup.searches()).toBe(2);
  });

  test('Clear aborts a held dye-name request', async ({ page }) => {
    const lookup = await controlLookup(page);
    await load(page, { Body: { ModelBase: 361, ModelVariant: 5, DyeId: 3 } });
    await resolveButton(page).click();
    await expect.poll(() => lookup.seen.started).toContain('/api/sheet/Stain');
    await clear(page).click();
    await expect.poll(() => lookup.seen.aborted).toContain('/api/sheet/Stain');
    lookup.answer();
    await expect(page.getByTestId('identity')).toHaveCount(0);
    // The equipment search was never started for the abandoned lookup.
    expect(lookup.searches()).toBe(0);
  });
});

test.describe('Cancel lookup', () => {
  test('aborts the held request, says so, and allows a new lookup', async ({
    page,
  }) => {
    const lookup = await controlLookup(page);
    await load(page, equipmentBody);
    await expect(page.getByTestId('identity')).toBeVisible();
    await expect(cancel(page)).toHaveCount(0);
    await resolveButton(page).click();
    await expect.poll(() => lookup.searches()).toBe(1);
    await cancel(page).click();
    await expect(page.locator('.lookup-status')).toHaveText(
      'Lookup cancelled.',
    );
    await expect.poll(() => lookup.seen.aborted).toContain('/api/search');
    await expect(cancel(page)).toHaveCount(0);
    await expect(resolveButton(page)).toBeEnabled();
    // The abandoned request does not come back as a result or as a new request.
    lookup.answer();
    await page.waitForTimeout(250);
    expect(lookup.searches()).toBe(1);
    await expect(page.getByTestId('equipment')).not.toContainText('Candidate');
    await expect(page.locator('.lookup-status')).toHaveText(
      'Lookup cancelled.',
    );
    await resolveButton(page).click();
    await expect(page.getByTestId('equipment')).toContainText('Candidate 1');
    expect(lookup.searches()).toBe(2);
  });

  test('during the equipment search, drops the dye names that already arrived', async ({
    page,
  }) => {
    const lookup = await controlLookup(page, ['/api/search']);
    await load(page, { Body: { ModelBase: 361, ModelVariant: 5, DyeId: 3 } });
    await resolveButton(page).click();
    // The dye names come first and are shown while the equipment search is still held.
    await expect(page.getByRole('row', { name: /Body/ })).toContainText(
      'Dye 3',
    );
    await expect.poll(() => lookup.searches()).toBe(1);
    await cancel(page).click();
    await expect(page.locator('.lookup-status')).toHaveText(
      'Lookup cancelled.',
    );
    await expect(page.getByRole('row', { name: /Body/ })).not.toContainText(
      'Dye 3',
    );
    lookup.answer();
    await page.waitForTimeout(250);
    await expect(page.getByRole('row', { name: /Body/ })).not.toContainText(
      'Dye 3',
    );
  });

  test('during the dye-name step, never starts the equipment search', async ({
    page,
  }) => {
    const lookup = await controlLookup(page);
    await load(page, { Body: { ModelBase: 361, ModelVariant: 5, DyeId: 3 } });
    const bodyRow = page.getByRole('row', { name: /Body/ });
    await expect(bodyRow).toBeVisible();
    const before = await bodyRow.textContent();
    await resolveButton(page).click();
    await expect.poll(() => lookup.seen.started).toContain('/api/sheet/Stain');
    await cancel(page).click();
    await expect(page.locator('.lookup-status')).toHaveText(
      'Lookup cancelled.',
    );
    await expect.poll(() => lookup.seen.aborted).toContain('/api/sheet/Stain');
    lookup.answer();
    await page.waitForTimeout(250);
    expect(lookup.searches()).toBe(0);
    await expect(page.getByTestId('equipment')).not.toContainText('Dye 3');
    // The abandoned lookup does not come back: the row is as it was before the lookup, and the
    // message is the one Cancel wrote.
    await expect(bodyRow).toHaveText(before ?? '');
    await expect(page.locator('.lookup-status')).toHaveText(
      'Lookup cancelled.',
    );
    await expect(resolveButton(page)).toBeEnabled();
  });
});

test.describe('the worker', () => {
  test('is terminated at exactly five seconds, and what it posts late is ignored', async ({
    page,
  }) => {
    await load(page, { Tribe: 'Midlander' });
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    await expect(resolveButton(page)).toBeEnabled();
    // The real worker, delayed: it can only post if the page had not terminated it.
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    let served = false;
    await page.route('**/assets/worker-*.js', async (route) => {
      requested = true;
      await gate;
      await route.continue().catch(() => {});
      served = true;
    });
    await pauseClock(page);
    await load(page, { Tribe: 'Xaela' }, 'slow.chara');
    await expect.poll(() => requested).toBe(true);
    await page.clock.runFor(4999);
    await expect(page.getByRole('alert')).toHaveText('');
    await page.clock.runFor(1);
    await expect(page.getByRole('alert')).toContainText('PROCESSING_TIMEOUT');
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    release();
    await expect.poll(() => served).toBe(true);
    // Time for a worker that was not terminated to read its file and post the inspection.
    await page.waitForTimeout(400);
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    await expect(page.getByTestId('identity')).not.toContainText('Au Ra');
    await expect(page.getByRole('alert')).toContainText('PROCESSING_TIMEOUT');
  });

  test('reports APPEARANCE_TIMEOUT when the colors never arrive, and keeps the inspection', async ({
    page,
  }) => {
    let requested = false;
    await page.route('**/assets/appearance-*.js', async (route) => {
      requested = true;
      await new Promise<void>(() => {});
      await route.continue();
    });
    await pauseClock(page);
    await load(page, { Tribe: 'Midlander' });
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    await expect.poll(() => requested).toBe(true);
    await page.clock.runFor(4999);
    await expect(page.getByRole('alert')).toHaveText('');
    await page.clock.runFor(1);
    await expect(page.getByRole('alert')).toContainText('APPEARANCE_TIMEOUT');
    await expect(page.getByRole('alert')).toContainText(
      'The selected file remains inspected.',
    );
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    await expect(page.locator('.local-status')).toContainText(
      'Color evidence unavailable.',
    );
  });

  test('that fails to start is reported as PROCESSING_FAILED, and the previous file is kept', async ({
    page,
    traffic,
  }) => {
    await load(page, { Tribe: 'Midlander' });
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    await expect(resolveButton(page)).toBeEnabled();
    await page.route('**/assets/worker-*.js', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: 'throw new Error("the worker could not start");',
      }),
    );
    await load(page, { Tribe: 'Xaela' }, 'broken.chara');
    await expect(page.getByRole('alert')).toContainText('PROCESSING_FAILED');
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    await expect(page.getByTestId('identity')).not.toContainText('Au Ra');
    // The page handles the failure itself: nothing is left for the browser to report as uncaught.
    await traffic.settle();
    expect(traffic.console.filter((text) => /Uncaught/.test(text))).toEqual([]);
  });
});

test.describe('the example files', () => {
  const anamnesis = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: 'Anamnesis', exact: true });

  for (const [name, handler] of [
    [
      'a missing file',
      (r: import('@playwright/test').Route) =>
        r.fulfill({ status: 404, body: 'no' }),
    ],
    [
      'a server error',
      (r: import('@playwright/test').Route) =>
        r.fulfill({ status: 500, body: 'no' }),
    ],
    [
      'a network failure',
      (r: import('@playwright/test').Route) => r.abort('failed'),
    ],
  ] as const)
    test(`reports EXAMPLE_UNAVAILABLE for ${name} and keeps the previous file`, async ({
      page,
    }) => {
      await load(page, { Tribe: 'Midlander' });
      await expect(page.getByTestId('identity')).toContainText('Hyur');
      await expect(resolveButton(page)).toBeEnabled();
      await page.route('**/examples/anamnesis.chara', handler);
      await anamnesis(page).click();
      await expect(page.getByRole('alert')).toContainText(
        'EXAMPLE_UNAVAILABLE',
      );
      await expect(page.getByRole('alert')).toContainText(
        'Your previous valid file is retained.',
      );
      await expect(page.getByTestId('identity')).toContainText('Hyur');
    });

  test('is ignored when a file is chosen while it loads', async ({ page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    await page.route('**/examples/anamnesis.chara', async (route) => {
      requested = true;
      await gate;
      await route.continue().catch(() => {});
    });
    await anamnesis(page).click();
    await expect.poll(() => requested).toBe(true);
    await load(page, { Tribe: 'Xaela' }, 'mine.chara');
    await expect(page.getByTestId('identity')).toContainText('Au Ra');
    release();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('identity')).toContainText('Au Ra');
    await expect(page.getByRole('alert')).toHaveText('');
  });

  test('raises no error when Clear abandons it, and does not appear afterwards', async ({
    page,
  }) => {
    await load(page, { Tribe: 'Midlander' });
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    const failed: string[] = [];
    page.on('requestfailed', (request) =>
      failed.push(new URL(request.url()).pathname),
    );
    await page.route('**/examples/anamnesis.chara', async (route) => {
      requested = true;
      await gate;
      await route.continue().catch(() => {});
    });
    await anamnesis(page).click();
    await expect.poll(() => requested).toBe(true);
    await clear(page).click();
    await expect.poll(() => failed).toContain('/examples/anamnesis.chara');
    release();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('identity')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveText('');
  });
});

test.describe('the file admission gate', () => {
  const MIB8 = 8 * 1024 * 1024;
  /** A valid document padded with spaces to exactly this many bytes. */
  const padded = (bytes: number) => {
    const text = '{"Tribe":"Midlander"}';
    return text + ' '.repeat(bytes - text.length);
  };

  test('accepts a file of exactly 8 MiB', async ({ page }) => {
    await load(page, padded(MIB8), 'exact.chara');
    await expect(page.getByTestId('identity')).toContainText('Hyur');
    await expect(page.getByRole('alert')).toHaveText('');
  });

  test('refuses a file one byte larger with FILE_TOO_LARGE, before the library sees it', async ({
    page,
  }) => {
    await load(page, { Tribe: 'Xaela' });
    await expect(page.getByTestId('identity')).toContainText('Au Ra');
    await load(page, padded(MIB8 + 1), 'over.chara');
    await expect(page.getByRole('alert')).toContainText('FILE_TOO_LARGE');
    await expect(page.getByRole('alert')).not.toContainText('INPUT_TOO_LARGE');
    await expect(page.getByTestId('identity')).toContainText('Au Ra');
  });

  for (const name of [
    'x.chara',
    'X.CHARA',
    'x.Chara',
    'a.b.chara',
    'ünï.chara',
  ])
    test(`accepts the file name ${name}`, async ({ page }) => {
      await load(page, { Tribe: 'Midlander' }, name);
      await expect(page.getByTestId('identity')).toContainText('Hyur');
      await expect(page.getByRole('alert')).toHaveText('');
    });

  for (const name of [
    'x.chara.exe',
    'x.charax',
    'x.json',
    'chara',
    'xchara',
    'x_chara',
    'x.chara.',
    'x.chara ',
    'x.cha ra',
  ])
    test(`refuses the file name ${JSON.stringify(name)} with FILE_EXTENSION`, async ({
      page,
    }) => {
      await load(page, { Tribe: 'Xaela' });
      await expect(page.getByTestId('identity')).toContainText('Au Ra');
      await load(page, { Tribe: 'Midlander' }, name);
      await expect(page.getByRole('alert')).toContainText('FILE_EXTENSION');
      await expect(page.getByTestId('identity')).toContainText('Au Ra');
    });
});

test.describe('facewear', () => {
  test('looks up a nonzero Glasses id and shows the name that came back', async ({
    page,
    traffic,
  }) => {
    const lookup = await controlLookup(page);
    await load(page, { Glasses: 12, ...equipmentBody });
    await expect(page.getByTestId('identity')).toBeVisible();
    await expect(page.getByRole('row', { name: /Facewear/ })).toContainText(
      'Not requested',
    );
    await resolveButton(page).click();
    await expect(page.getByRole('row', { name: /Facewear/ })).toContainText(
      'Looking up…',
    );
    lookup.answer();
    // The name is the one the API returned, not the fallback built from the id.
    await expect(page.getByRole('row', { name: /Facewear/ })).toContainText(
      'Round glasses 12',
    );
    await traffic.settle();
    const glasses = traffic
      .toXivapi()
      .filter((r) => new URL(r.url).pathname === '/api/sheet/Glasses');
    expect(glasses.map((r) => new URL(r.url).searchParams.get('rows'))).toEqual(
      ['12'],
    );
  });

  test('sends no Glasses request for id 0 and says the slot is empty', async ({
    page,
    traffic,
  }) => {
    await mockXivapi(page);
    await load(page, { Glasses: 0, ...equipmentBody });
    await expect(page.getByRole('row', { name: /Facewear/ })).toContainText(
      'Empty',
    );
    await resolveButton(page).click();
    await expect(page.getByTestId('equipment')).toContainText('Candidate 1');
    await traffic.settle();
    expect(
      traffic
        .toXivapi()
        .filter((r) => new URL(r.url).pathname === '/api/sheet/Glasses'),
    ).toEqual([]);
    await expect(page.getByRole('row', { name: /Facewear/ })).toContainText(
      'Empty',
    );
  });
});
