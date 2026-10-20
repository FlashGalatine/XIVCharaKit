import type { CachedRows, ResolutionCache } from './types.js';

/** Admit host cache objects before serialization/cloning; host functions remain trusted. */
export function admittedJson(
  input: unknown,
  maxBytes = 8 * 1024 * 1024,
): string | null {
  const stack: { value: unknown; depth: number; leave?: boolean }[] = [
    { value: input, depth: 1 },
  ];
  const active = new Set<object>();
  let nodes = 0;
  let bytes = 0;
  const encoder = new TextEncoder();
  const count = (value: string) => {
    bytes += encoder.encode(JSON.stringify(value)).byteLength + 1;
    return bytes <= maxBytes;
  };
  try {
    while (stack.length) {
      const task = stack.pop();
      if (!task) break;
      const { value, depth } = task;
      if (task.leave) {
        active.delete(value as object);
        continue;
      }
      if (++nodes > 100_000 || depth > 32) return null;
      if (typeof value === 'string') {
        if (value.length > 65_536 || !count(value)) return null;
      } else if (
        value === null ||
        typeof value === 'boolean' ||
        typeof value === 'number'
      ) {
        if (
          typeof value === 'number' &&
          (!Number.isFinite(value) ||
            (Number.isInteger(value) && !Number.isSafeInteger(value)))
        )
          return null;
        bytes += 25;
      } else if (typeof value === 'object') {
        const proto: unknown = Object.getPrototypeOf(value);
        if (
          active.has(value) ||
          (Array.isArray(value)
            ? proto !== Array.prototype
            : proto !== null && proto !== Object.prototype) ||
          Object.getOwnPropertySymbols(value).length ||
          Object.getOwnPropertyDescriptor(value, 'toJSON')
        )
          return null;
        active.add(value);
        stack.push({ value, depth, leave: true });
        bytes += 2;
        let entries = 0;
        for (const key in value) {
          if (!Object.hasOwn(value, key)) continue;
          if (
            Array.isArray(value) &&
            (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)
          )
            return null;
          if (++nodes > 100_000 || key.length > 1024 || !count(key))
            return null;
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          if (!descriptor || !('value' in descriptor)) return null;
          stack.push({ value: descriptor.value, depth: depth + 1 });
          entries++;
        }
        if (Array.isArray(value) && entries !== value.length) return null;
      } else return null;
      if (bytes > maxBytes) return null;
    }
    const text = JSON.stringify(input);
    return encoder.encode(text).byteLength <= maxBytes ? text : null;
  } catch {
    return null;
  }
}

/** Optional bounded LRU: expiry is checked on every read; results are detached. */
export function createMemoryCache(): ResolutionCache {
  const entries = new Map<
    string,
    { text: string; bytes: number; expires: number }
  >();
  let used = 0;
  function remove(key: string): void {
    const old = entries.get(key);
    if (old) {
      used -= old.bytes;
      entries.delete(key);
    }
  }
  return {
    async get(key) {
      const hit = entries.get(key);
      if (!hit) return null;
      if (hit.expires <= Date.now()) {
        remove(key);
        return null;
      }
      entries.delete(key);
      entries.set(key, hit);
      return JSON.parse(hit.text) as CachedRows;
    },
    async set(key, value, ttlMs) {
      if (
        typeof key !== 'string' ||
        key.length > 16384 ||
        !Number.isFinite(ttlMs) ||
        ttlMs <= 0 ||
        ttlMs > 7 * 86400_000
      )
        return;
      const text = admittedJson(value);
      if (text === null) return;
      const bytes =
        new TextEncoder().encode(text).byteLength +
        new TextEncoder().encode(key).byteLength;
      if (bytes > 8 * 1024 * 1024) return;
      remove(key);
      for (const [id, entry] of entries)
        if (entry.expires <= Date.now()) remove(id);
      while (entries.size >= 128 || used + bytes > 8 * 1024 * 1024) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        remove(oldest);
      }
      entries.set(key, { text, bytes, expires: Date.now() + ttlMs });
      used += bytes;
    },
  };
}
