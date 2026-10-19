import { isRecord } from '../field-spec.js';
import { IssueCollector } from '../issues.js';
import { readBoundedJson } from '../read.js';
import { admittedJson } from './cache.js';
import {
  buildQuery,
  canonicalSchema,
  canonicalVersion,
  fieldsFor,
  LANGUAGES,
  lookupsFrom,
  type SlotLookup,
  XivapiInputError,
} from './query.js';
import { associated, cachedRow, normalizeRow } from './rows.js';
import type {
  CachedRows,
  GlassesRow,
  ItemRow,
  Language,
  LookupResult,
  PublicRow,
  XivapiClient,
  XivapiOptions,
} from './types.js';

class Failure extends Error {
  constructor(readonly code: string) {
    super('XIVAPI lookup interrupted.');
  }
}
const failureResult = (code: string, cancelled = false): LookupResult => ({
  status: cancelled ? 'cancelled' : 'unavailable',
  rows: [],
  version: null,
  schema: null,
  issues: [
    {
      code,
      severity: 'warning',
      path: [],
      message: 'Equipment lookup could not complete.',
    },
  ],
});
function reason(signal: AbortSignal): Failure {
  return signal.reason instanceof Failure
    ? signal.reason
    : new Failure('CANCELLED');
}
/** Race even uncooperative host promises, and always remove listeners. */
function interruptible<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) return Promise.reject(reason(signal));
  return new Promise((resolve, reject) => {
    const abort = () => {
      cleanup();
      reject(reason(signal));
    };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(error);
      },
    );
  });
}
async function delay(ms: number, signal: AbortSignal): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await interruptible(
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      }),
      signal,
    );
  } finally {
    clearTimeout(timer);
  }
}
interface Budget {
  requests: number;
  bytes: number;
  signal: AbortSignal;
}
interface Job {
  controller: AbortController;
  promise: Promise<LookupResult>;
  finish(result: LookupResult): void;
  run(): Promise<LookupResult>;
  subscribers: number;
  started: boolean;
  expires: number;
}

export function createXivapiClient(options: XivapiOptions = {}): XivapiClient {
  const invalid = (): never => {
    throw new XivapiInputError('INVALID_OPTIONS');
  };
  if (typeof options !== 'object' || options === null || Array.isArray(options))
    return invalid();
  let base: URL;
  try {
    base = new URL(options.baseUrl ?? 'https://v2.xivapi.com/api');
  } catch {
    return invalid();
  }
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.hash ||
    base.search
  )
    return invalid();
  base.pathname = `${base.pathname.replace(/\/+$/, '')}/`;
  const version = options.version ?? 'latest';
  const schema = options.schema ?? 'exdschema@2:ver:request';
  if (
    typeof version !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(version) ||
    typeof schema !== 'string' ||
    !/^exdschema@2:(ver:request|rev:[a-f0-9]{1,40})$/.test(schema)
  )
    return invalid();
  const maxPages = options.maxPages ?? 20;
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (
    !Number.isInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > 20 ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 10_000
  )
    return invalid();
  const selected = options.languages ?? LANGUAGES;
  if (
    !Array.isArray(selected) ||
    selected.length < 1 ||
    selected.length > 4 ||
    selected.some((l) => !LANGUAGES.includes(l))
  )
    return invalid();
  const languages: Language[] = [...new Set(selected)].sort();
  const fetcher = options.fetch ?? globalThis.fetch;
  if (
    typeof fetcher !== 'function' ||
    (options.cache !== undefined &&
      (options.cache === null ||
        typeof options.cache !== 'object' ||
        typeof options.cache.get !== 'function' ||
        typeof options.cache.set !== 'function'))
  )
    return invalid();
  const cache = options.cache;
  const jobs = new Map<string, Job>();
  const queue: Job[] = [];
  let active = 0;
  let alias: { version: string; expires: number } | undefined;
  const schemas = new Map<string, { schema: string; expires: number }>();

  async function request(
    url: URL,
    budget: Budget,
  ): Promise<{ status: number; data: unknown }> {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (budget.signal.aborted) throw reason(budget.signal);
      if (++budget.requests > 40) throw new Failure('REQUEST_LIMIT');
      const control = new AbortController();
      const abort = () => control.abort(reason(budget.signal));
      budget.signal.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(
        () => control.abort(new Failure('TIMEOUT')),
        timeoutMs,
      );
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let retry: number | undefined;
      let consumed = false;
      try {
        const response = await interruptible(
          Promise.resolve().then(() =>
            fetcher(url, {
              method: 'GET',
              headers: { Accept: 'application/json' },
              credentials: 'omit',
              referrerPolicy: 'no-referrer',
              redirect: 'manual',
              signal: control.signal,
            }),
          ),
          control.signal,
        );
        if (!response.body || typeof response.body.getReader !== 'function')
          throw new Failure('BODY_UNAVAILABLE');
        reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        while (true) {
          const chunk = await interruptible(reader.read(), control.signal);
          if (chunk.done) {
            consumed = true;
            break;
          }
          if (!(chunk.value instanceof Uint8Array))
            throw new Failure('BODY_UNAVAILABLE');
          bytes += chunk.value.byteLength;
          budget.bytes += chunk.value.byteLength;
          if (bytes > 2 * 1024 * 1024 || budget.bytes > 10 * 1024 * 1024)
            throw new Failure('RESPONSE_LIMIT');
          if (response.ok) chunks.push(chunk.value);
        }
        if (
          response.type === 'opaqueredirect' ||
          (response.status >= 300 && response.status < 400)
        )
          throw new Failure('REDIRECT_REFUSED');
        if (response.status === 429 || response.status === 503) {
          if (attempt !== 0) throw new Failure('UPSTREAM_UNAVAILABLE');
          const raw = response.headers.get('Retry-After');
          retry =
            raw === null
              ? 250
              : /^\d+(\.\d+)?$/.test(raw)
                ? Number(raw) * 1000
                : Date.parse(raw) - Date.now();
          if (!Number.isFinite(retry) || retry > 2000)
            throw new Failure('RETRY_LIMIT');
          retry = Math.max(0, retry);
        } else if (!response.ok) throw new Failure('UPSTREAM_UNAVAILABLE');
        else {
          const buffer = new Uint8Array(bytes);
          let offset = 0;
          for (const chunk of chunks) {
            buffer.set(chunk, offset);
            offset += chunk.byteLength;
          }
          let data: unknown;
          try {
            data = readBoundedJson(buffer);
          } catch {
            throw new Failure('MALFORMED_RESPONSE');
          }
          return { status: response.status, data };
        }
      } catch (error) {
        if (control.signal.aborted) throw reason(control.signal);
        throw error instanceof Failure ? error : new Failure('NETWORK_ERROR');
      } finally {
        clearTimeout(timer);
        budget.signal.removeEventListener('abort', abort);
        if (reader) {
          if (!consumed) void reader.cancel().catch(() => {});
          else reader.releaseLock();
        }
      }
      await delay(retry ?? 250, budget.signal);
    }
    throw new Failure('UPSTREAM_UNAVAILABLE');
  }

  async function resolvedVersion(budget: Budget): Promise<string | null> {
    if (canonicalVersion(version)) return version;
    if (alias && alias.expires > Date.now()) return alias.version;
    alias = undefined;
    try {
      const response = await request(new URL('version', base), budget);
      if (
        !isRecord(response.data) ||
        !Array.isArray(response.data.versions) ||
        response.data.versions.length > 500
      )
        return null;
      for (const entry of response.data.versions) {
        if (
          isRecord(entry) &&
          canonicalVersion(entry.key) &&
          Array.isArray(entry.names) &&
          entry.names.includes(version)
        ) {
          alias = { version: entry.key, expires: Date.now() + 600_000 };
          return entry.key;
        }
      }
    } catch (error) {
      if (budget.signal.aborted) throw error;
    }
    return null;
  }

  async function lookup(
    selection: readonly SlotLookup[] | number,
    signal: AbortSignal,
  ): Promise<LookupResult> {
    const budget: Budget = { signal, bytes: 0, requests: 0 };
    const diagnostics = new IssueCollector();
    const rows = new Map<number, PublicRow>();
    let upstreamVersion: string | null = null;
    let upstreamSchema: string | null = null;
    let complete = true;
    const items = typeof selection !== 'number';
    const fields = fieldsFor(languages, items);
    const keyFor = (v: string, s: string) =>
      JSON.stringify([1, base.href, v, s, fields, selection]);
    try {
      const pin = await resolvedVersion(budget);
      const memo = pin ? schemas.get(pin) : undefined;
      const schemaPin = canonicalSchema(schema)
        ? schema
        : memo && memo.expires > Date.now()
          ? memo.schema
          : schema;
      const key =
        pin && canonicalSchema(schemaPin) ? keyFor(pin, schemaPin) : null;
      if (cache && key) {
        try {
          const hit: unknown = await interruptible(cache.get(key), signal);
          const text = admittedJson(hit);
          const data: unknown = text === null ? null : JSON.parse(text);
          if (
            isRecord(data) &&
            data.format === 1 &&
            data.complete === true &&
            data.namespace === key &&
            data.version === pin &&
            data.schema === schemaPin &&
            Array.isArray(data.rows) &&
            data.rows.length <= 5000
          ) {
            const normalized: PublicRow[] = [];
            for (const raw of data.rows) {
              const row = cachedRow(raw, languages, items);
              if (!row || !associated(row, selection)) break;
              normalized.push(row);
            }
            if (
              normalized.length === data.rows.length &&
              new Set(normalized.map((r) => r.rowId)).size === normalized.length
            )
              return {
                status: 'complete',
                rows: normalized,
                version: pin,
                schema: schemaPin,
                issues: [],
              };
          }
        } catch {
          if (signal.aborted) throw reason(signal);
        }
      }
      let cursor: string | undefined;
      const cursors = new Set<string>();
      let encountered = 0;
      for (let page = 0; page < maxPages; page++) {
        const url = new URL(items ? 'search' : 'sheet/Glasses', base);
        url.search = new URLSearchParams({
          fields,
          version: pin ?? version,
          schema: upstreamSchema ?? schemaPin,
          language: 'en',
          transient: '',
          ...(items
            ? {
                limit: '500',
                ...(cursor
                  ? { cursor }
                  : { sheets: 'Item', query: buildQuery(selection) }),
              }
            : { rows: String(selection) }),
        }).toString();
        const response = await request(url, budget);
        const data = response.data;
        if (
          !isRecord(data) ||
          !canonicalVersion(data.version) ||
          !canonicalSchema(data.schema) ||
          (pin !== null && data.version !== pin) ||
          (upstreamVersion !== null && data.version !== upstreamVersion) ||
          (canonicalSchema(schemaPin) && data.schema !== schemaPin) ||
          (upstreamSchema !== null && data.schema !== upstreamSchema)
        )
          throw new Failure('RESPONSE_IDENTITY');
        upstreamVersion = data.version;
        upstreamSchema = data.schema;
        const results = items ? data.results : data.rows;
        if (!Array.isArray(results) || results.length > 500)
          throw new Failure('ROW_LIMIT');
        encountered += results.length;
        if (encountered > 5000) throw new Failure('ROW_LIMIT');
        for (const raw of results) {
          const row = normalizeRow(raw, languages, items);
          if (!row || !associated(row, selection)) {
            complete = false;
            diagnostics.add('INVALID_ROW', [], 'An upstream row was rejected.');
            continue;
          }
          const old = rows.get(row.rowId);
          if (old && JSON.stringify(old) !== JSON.stringify(row)) {
            complete = false;
            diagnostics.add(
              'CONFLICTING_ROW',
              [],
              'Conflicting upstream rows were received.',
            );
          } else rows.set(row.rowId, row);
        }
        if (!items || data.next === null || data.next === undefined) break;
        if (
          typeof data.next !== 'string' ||
          data.next.length < 1 ||
          data.next.length > 2048
        )
          throw new Failure('INVALID_CURSOR');
        if (cursors.has(data.next)) throw new Failure('REPEATED_CURSOR');
        cursors.add(data.next);
        cursor = data.next;
        if (page + 1 >= maxPages) throw new Failure('PAGE_LIMIT');
      }
      const resultRows = [...rows.values()].sort((a, b) => a.rowId - b.rowId);
      if (
        complete &&
        cache &&
        canonicalVersion(upstreamVersion) &&
        canonicalSchema(upstreamSchema)
      ) {
        const namespace = keyFor(upstreamVersion, upstreamSchema);
        const value: CachedRows = {
          format: 1,
          namespace,
          version: upstreamVersion,
          schema: upstreamSchema,
          complete: true,
          rows: resultRows,
        };
        try {
          const text = admittedJson(value);
          if (text !== null)
            await interruptible(
              cache.set(
                namespace,
                JSON.parse(text) as CachedRows,
                resultRows.length ? 7 * 86400_000 : 600_000,
              ),
              signal,
            );
        } catch {
          if (signal.aborted) throw reason(signal);
        }
      }
      if (upstreamVersion && upstreamSchema && complete) {
        if (schemas.size >= 128)
          schemas.delete(schemas.keys().next().value ?? '');
        schemas.set(upstreamVersion, {
          schema: upstreamSchema,
          expires: Date.now() + 600_000,
        });
      }
    } catch (error) {
      complete = false;
      const code = error instanceof Failure ? error.code : 'NETWORK_ERROR';
      diagnostics.add(code, [], 'Equipment lookup could not complete.');
      if (code === 'CANCELLED')
        return {
          ...failureResult(code, true),
          version: upstreamVersion,
          schema: upstreamSchema,
        };
    }
    return {
      status: complete ? 'complete' : rows.size ? 'partial' : 'unavailable',
      rows: [...rows.values()].sort((a, b) => a.rowId - b.rowId),
      version: upstreamVersion,
      schema: upstreamSchema,
      issues: diagnostics.issues,
    };
  }

  function pump(): void {
    while (active < 2 && queue.length) {
      const job = queue.shift();
      if (!job || job.controller.signal.aborted) continue;
      if (job.expires <= Date.now()) {
        job.controller.abort(new Failure('DEADLINE'));
        continue;
      }
      active++;
      job.started = true;
      void job
        .run()
        .then(job.finish, () => job.finish(failureResult('NETWORK_ERROR')))
        .finally(() => {
          active--;
          pump();
        });
    }
  }
  function subscribe(
    selection: readonly SlotLookup[] | number,
    signal?: AbortSignal,
  ): Promise<LookupResult> {
    if (signal?.aborted)
      return Promise.resolve(failureResult('CANCELLED', true));
    const key = JSON.stringify(selection);
    let job = jobs.get(key);
    if (job?.controller.signal.aborted) job = undefined;
    if (!job) {
      if (active >= 2 && queue.length >= 16)
        return Promise.resolve(failureResult('QUEUE_FULL'));
      const controller = new AbortController();
      let settle: (r: LookupResult) => void = () => {};
      const promise = new Promise<LookupResult>((resolve) => {
        settle = resolve;
      });
      const timer = setTimeout(
        () => controller.abort(new Failure('DEADLINE')),
        30_000,
      );
      const current: Job = {
        controller,
        promise,
        subscribers: 0,
        started: false,
        expires: Date.now() + 30_000,
        run: () => lookup(selection, controller.signal),
        finish: (result) => {
          clearTimeout(timer);
          controller.signal.removeEventListener('abort', abort);
          if (jobs.get(key) === current) jobs.delete(key);
          settle(result);
        },
      };
      const abort = () => {
        const index = queue.indexOf(current);
        if (index >= 0) queue.splice(index, 1);
        if (!current.started)
          current.finish(
            failureResult(
              reason(controller.signal).code,
              reason(controller.signal).code === 'CANCELLED',
            ),
          );
      };
      controller.signal.addEventListener('abort', abort, { once: true });
      job = current;
      jobs.set(key, job);
      queue.push(job);
      pump();
    }
    const shared = job;
    shared.subscribers++;
    return new Promise((resolve) => {
      let done = false;
      const finish = (result: LookupResult) => {
        if (done) return;
        done = true;
        signal?.removeEventListener('abort', abort);
        if (--shared.subscribers === 0)
          shared.controller.abort(new Failure('CANCELLED'));
        resolve(JSON.parse(JSON.stringify(result)) as LookupResult);
      };
      const abort = () => finish(failureResult('CANCELLED', true));
      signal?.addEventListener('abort', abort, { once: true });
      void shared.promise.then(finish);
    });
  }
  return {
    async searchItems(models, requestOptions = {}) {
      const selection = lookupsFrom(models);
      if (!selection.length)
        return {
          status: 'complete',
          rows: [],
          version: null,
          schema: null,
          issues: [],
        };
      return (await subscribe(
        selection,
        requestOptions.signal,
      )) as LookupResult<ItemRow>;
    },
    async getGlasses(id, requestOptions = {}) {
      if (
        typeof id !== 'number' ||
        !Number.isInteger(id) ||
        id < 0 ||
        id > 65535
      )
        throw new XivapiInputError('INVALID_LOOKUP');
      return (await subscribe(
        id,
        requestOptions.signal,
      )) as LookupResult<GlassesRow>;
    },
  };
}
