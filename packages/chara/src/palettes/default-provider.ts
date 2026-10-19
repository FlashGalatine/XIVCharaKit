import { isRecord } from '../field-spec.js';
import {
  type DatasetKey,
  type PaletteDataset,
  type RaceDataset,
  SHADER_SHARED,
  SHARED_LENGTHS,
  type SharedDataset,
  TRIBES,
} from './layout.js';
import metadata from './metadata.json' with { type: 'json' };
import type {
  PaletteColor,
  PaletteMetadata,
  PaletteProvider,
  PaletteRequest,
} from './types.js';

export class PaletteDataError extends Error {
  readonly code = 'PALETTE_LOAD_FAILED';
  constructor() {
    super('Palette data could not be loaded.');
    this.name = 'PaletteDataError';
  }
}
function freeze(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  for (const child of Object.values(value)) freeze(child);
  Object.freeze(value);
}
freeze(metadata);
export const PALETTE_METADATA: PaletteMetadata = metadata;
const own = (record: object, key: PropertyKey) => Object.hasOwn(record, key);

function colors(value: unknown, length: number): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.length !== length ||
    value.some((hex) => typeof hex !== 'string' || !/^#[0-9A-F]{6}$/.test(hex))
  )
    throw new PaletteDataError();
  return Object.freeze(value.slice() as string[]);
}
function validate(data: unknown, key: DatasetKey): PaletteDataset {
  if (!isRecord(data)) throw new PaletteDataError();
  if (key.endsWith('shared')) {
    const result: SharedDataset = Object.create(null);
    const names =
      key === 'creator-shared' ? Object.keys(SHARED_LENGTHS) : SHADER_SHARED;
    for (const name of names) {
      if (!own(data, name)) throw new PaletteDataError();
      result[name] = colors(
        data[name],
        SHARED_LENGTHS[name as keyof typeof SHARED_LENGTHS],
      );
    }
    return result;
  }
  const result: RaceDataset = Object.create(null);
  for (const name of ['skin', 'hair']) {
    const palette = own(data, name) ? data[name] : undefined;
    if (!isRecord(palette)) throw new PaletteDataError();
    const tribes: RaceDataset[string] = Object.create(null);
    for (const tribe of TRIBES) {
      const entry = own(palette, tribe) ? palette[tribe] : undefined;
      if (!isRecord(entry) || !own(entry, 'Male') || !own(entry, 'Female'))
        throw new PaletteDataError();
      tribes[tribe] = {
        Male: colors(entry.Male, 192),
        Female: colors(entry.Female, 192),
      };
    }
    result[name] = tribes;
  }
  return result;
}

export type PaletteLoaders = Partial<
  Record<DatasetKey, () => Promise<unknown>>
>;
/** Shared lazy loader used by the bundled provider. Host loaders are trusted JavaScript. */
export function createLazyPaletteProvider(
  loaders: PaletteLoaders,
): PaletteProvider & { readonly metadata: PaletteMetadata } {
  const pending = new Map<DatasetKey, Promise<PaletteDataset>>();
  async function load(key: DatasetKey): Promise<PaletteDataset> {
    let task = pending.get(key);
    if (!task) {
      task = Promise.resolve()
        .then(() => {
          const loader = loaders[key];
          if (!loader) throw new PaletteDataError();
          return loader();
        })
        .then((data) => validate(data, key))
        .catch(() => {
          pending.delete(key);
          throw new PaletteDataError();
        });
      pending.set(key, task);
    }
    return task;
  }
  return {
    metadata: PALETTE_METADATA,
    async getColor(request: PaletteRequest): Promise<PaletteColor | null> {
      if (
        !isRecord(request) ||
        (request.table !== 'creator' && request.table !== 'shader') ||
        !Number.isInteger(request.index) ||
        request.index < 0
      )
        return null;
      const race = request.palette === 'skin' || request.palette === 'hair';
      if (
        !race &&
        (!own(SHARED_LENGTHS, request.palette) ||
          request.index >=
            SHARED_LENGTHS[request.palette as keyof typeof SHARED_LENGTHS])
      )
        return null;
      if (
        request.table === 'shader' &&
        !race &&
        !(SHADER_SHARED as readonly unknown[]).includes(request.palette)
      )
        return null;
      if (
        race &&
        (request.index >= 192 ||
          !(TRIBES as readonly unknown[]).includes(request.tribe) ||
          (request.gender !== 'Masculine' && request.gender !== 'Feminine'))
      )
        return null;
      const data = await load(`${request.table}-${race ? 'race' : 'shared'}`);
      const palette = data[request.palette];
      const hex = race
        ? (palette as RaceDataset[string])[request.tribe as string]?.[
            request.gender === 'Masculine' ? 'Male' : 'Female'
          ]?.[request.index]
        : (palette as readonly string[])[request.index];
      if (!hex) return null;
      return {
        table: request.table,
        palette: request.palette,
        index: request.index,
        ...(race ? { tribe: request.tribe, gender: request.gender } : {}),
        hex,
        rgb: [
          Number.parseInt(hex.slice(1, 3), 16),
          Number.parseInt(hex.slice(3, 5), 16),
          Number.parseInt(hex.slice(5, 7), 16),
        ],
        datasetVersion: PALETTE_METADATA.datasetVersion,
      };
    },
  };
}
