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

/** Optional Stain-name requests with an instance-local bounded memory cache by default. */
export function createDyeNameResolver(
  options: XivapiOptions = {},
): DyeNameResolver {
  if (typeof options !== 'object' || options === null || Array.isArray(options))
    throw new XivapiInputError('INVALID_OPTIONS');
  const client = createXivapiClient({
    ...options,
    cache: options.cache === undefined ? createMemoryCache() : options.cache,
  });
  return { resolve: client.getStains };
}
