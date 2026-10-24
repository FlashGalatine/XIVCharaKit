import { createMemoryCache } from '../xivapi/cache.js';
import { createXivapiClient } from '../xivapi/client.js';
import { XivapiInputError } from '../xivapi/query.js';
import type { LookupResult, StainRow, XivapiOptions } from '../xivapi/types.js';

export type {
  Language,
  LookupResult,
  StainRow,
  XivapiOptions,
} from '../xivapi/types.js';
export interface DyeNameResolver {
  resolve(
    ids: readonly number[],
    options?: { signal?: AbortSignal },
  ): Promise<LookupResult<StainRow>>;
}

const OPTION_KEYS = [
  'fetch',
  'baseUrl',
  'version',
  'schema',
  'languages',
  'maxPages',
  'timeoutMs',
] as const;

/** Optional Stain-name requests with an instance-local bounded memory cache by default. */
export function createDyeNameResolver(
  options: XivapiOptions = {},
): DyeNameResolver {
  if (typeof options !== 'object' || options === null || Array.isArray(options))
    throw new XivapiInputError('INVALID_OPTIONS');
  // Read each known option by name: a spread would drop inherited and non-enumerable ones.
  const known: XivapiOptions = {};
  for (const key of OPTION_KEYS) {
    const value = options[key];
    if (value !== undefined) Object.assign(known, { [key]: value });
  }
  const client = createXivapiClient({
    ...known,
    cache: options.cache === undefined ? createMemoryCache() : options.cache,
  });
  return { resolve: client.getStains };
}
