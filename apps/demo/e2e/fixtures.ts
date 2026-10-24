import {
  test as base,
  expect,
  type JSHandle,
  type Page,
} from '@playwright/test';

export { expect };
export const XIVAPI = 'https://v2.xivapi.com';
/** Strings the e2e files put in private data; none may ever reach a request, a log or an event. */
export const PRIVATE = /CANARY_|PRIVATE_/;

export interface Recorded {
  url: string;
  method: string;
  origin: string;
  headers: Record<string, string>;
  postData: string | null;
}
/**
 * Everything the page did that could carry character data out, recorded from before the first
 * navigation: the fixture attaches it when the page is created, ahead of any beforeEach hook.
 */
export class Traffic {
  requests: Recorded[] = [];
  console: string[] = [];
  pageErrors: string[] = [];
  dialogs: string[] = [];
  navigations: string[] = [];
  popups: string[] = [];
  downloads: string[] = [];
  private pending: Promise<unknown>[] = [];
  constructor(readonly appOrigin: string) {}
  track(work: Promise<unknown>): void {
    this.pending.push(work.catch(() => {}));
  }
  /** Waits for the asynchronous reads (headers, console arguments) of everything seen so far. */
  async settle(): Promise<void> {
    while (this.pending.length) await Promise.all(this.pending.splice(0));
  }
  reset(): void {
    this.requests = [];
    this.console = [];
    this.pageErrors = [];
    this.dialogs = [];
    this.navigations = [];
    this.popups = [];
    this.downloads = [];
  }
  /** Requests to anything but the page's own origin. */
  offOrigin(): Recorded[] {
    return this.requests.filter((r) => r.origin !== this.appOrigin);
  }
  sameOrigin(): Recorded[] {
    return this.requests.filter((r) => r.origin === this.appOrigin);
  }
  toXivapi(): Recorded[] {
    return this.requests.filter((r) => r.origin === XIVAPI);
  }
  /** Where `pattern` appears in what was recorded: URL, header, body, console text or argument. */
  async leaks(pattern: RegExp): Promise<string[]> {
    await this.settle();
    const found: string[] = [];
    for (const r of this.requests) {
      const parts: [string, string][] = [
        ['url', r.url],
        ['body', r.postData ?? ''],
        ...Object.entries(r.headers).map(([name, value]): [string, string] => [
          `header ${name}`,
          value,
        ]),
      ];
      for (const [part, text] of parts)
        if (pattern.test(text))
          found.push(`request ${part}: ${r.method} ${r.url}`);
    }
    const events: [string, string[]][] = [
      ['console', this.console],
      ['page error', this.pageErrors],
      ['dialog', this.dialogs],
      ['navigation', this.navigations],
      ['popup', this.popups],
      ['download', this.downloads],
    ];
    for (const [kind, list] of events)
      for (const text of list)
        if (pattern.test(text)) found.push(`${kind}: ${text}`);
    return found;
  }
}

async function describe(argument: JSHandle): Promise<string> {
  try {
    return JSON.stringify(await argument.jsonValue()) ?? String(argument);
  } catch {
    return String(argument);
  }
}
function record(page: Page, appOrigin: string): Traffic {
  const traffic = new Traffic(appOrigin);
  page.on('request', (request) => {
    const entry: Recorded = {
      url: request.url(),
      method: request.method(),
      origin: new URL(request.url()).origin,
      headers: {},
      postData: request.postData(),
    };
    traffic.requests.push(entry);
    traffic.track(
      request.allHeaders().then((headers) => {
        entry.headers = headers;
      }),
    );
  });
  page.on('console', (message) => {
    const index = traffic.console.length;
    traffic.console.push(message.text());
    // Arguments carry structured output that its text form ("JSHandle@object") hides.
    traffic.track(
      Promise.all(message.args().map(describe)).then((parts) => {
        traffic.console[index] =
          `${message.type()}: ${message.text()} ${parts.join(' ')}`;
      }),
    );
  });
  page.on('pageerror', (error) =>
    traffic.pageErrors.push(
      `${error.name}: ${error.message}\n${error.stack ?? ''}`,
    ),
  );
  page.on('dialog', (dialog) => {
    traffic.dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    void dialog.dismiss();
  });
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) traffic.navigations.push(frame.url());
  });
  page.on('popup', (popup) => traffic.popups.push(popup.url()));
  page.on('download', (download) => traffic.downloads.push(download.url()));
  return traffic;
}

const recorded = new WeakMap<Page, Traffic>();
export const test = base.extend<{ traffic: Traffic }>({
  // Overriding `page` guarantees the recorder exists before any hook or test body navigates.
  page: async ({ page, baseURL }, use) => {
    // Nothing reaches the real XIVAPI by accident: a test that wants it installs its own route,
    // which takes precedence over this one.
    await page
      .context()
      .route(`${XIVAPI}/**`, (route) => route.abort('blockedbyclient'));
    const traffic = record(page, new URL(baseURL ?? 'http://127.0.0.1').origin);
    recorded.set(page, traffic);
    await use(page);
    expect(
      await traffic.leaks(PRIVATE),
      'private data reached a request, log or event',
    ).toEqual([]);
    expect(traffic.pageErrors, 'uncaught page errors').toEqual([]);
    // The page's own CSP blocked something: it tried to do what it must not.
    expect(
      traffic.console.filter((text) => /Content Security Policy/i.test(text)),
      'CSP violations',
    ).toEqual([]);
    expect(traffic.dialogs, 'dialogs').toEqual([]);
    expect(traffic.popups, 'popups').toEqual([]);
    expect(traffic.downloads, 'downloads').toEqual([]);
    expect(
      [...new Set(traffic.offOrigin().map((r) => r.origin))].filter(
        (origin) => origin !== XIVAPI,
      ),
      'requests to origins the page may not use',
    ).toEqual([]);
  },
  traffic: async ({ page }, use) => {
    const traffic = recorded.get(page);
    if (!traffic)
      throw new Error('The page fixture did not attach a recorder.');
    await use(traffic);
  },
});
