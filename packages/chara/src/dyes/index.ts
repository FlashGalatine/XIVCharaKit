import data from './data.json' with { type: 'json' };

const { names, ...metadata } = data;
export const DYE_METADATA = Object.freeze(metadata);

/** Returns the English Stain name, or null for blank/unknown/invalid IDs. No I/O. */
export function getDyeName(stainId: number): string | null {
  if (!Number.isInteger(stainId) || stainId < 0 || stainId > 65535) return null;
  return (names as Readonly<Record<string, string>>)[String(stainId)] ?? null;
}
