import { describe, expect, it, vi } from 'vitest';
import { createDyeNameResolver } from '../src/dyes/index.js';
import type { EquipmentModel } from '../src/types.js';
import {
  createXivapiClient,
  createXivapiResolver,
  type GlassesRow,
  type ItemRow,
  type StainRow,
  type XivapiOptions,
} from '../src/xivapi/index.js';
import {
  associated,
  normalizeRow,
  normalizeStainRow,
} from '../src/xivapi/rows.js';

// Row, query and option edges that the first rows, limits and scope tests left to chance.

const V = '0123456789abcdef';
const S = `exdschema@2:rev:${'a'.repeat(40)}`;
const body: EquipmentModel = { slot: 'Body', base: 361, variant: 5 };
const json = (data: unknown) => new Response(JSON.stringify(data));
const item = (fields: Record<string, unknown> = {}) =>
  normalizeRow(
    {
      row_id: 7,
      fields: {
        ModelMain: 5,
        EquipSlotCategory: { fields: { Body: 1 } },
        ...fields,
      },
    },
    ['en'],
    true,
  ) as ItemRow | null;

describe('the wear columns of an item row', () => {
  it('keeps each of the ten columns, with a true or false for each kind of value', () => {
    const wear = item({
      EquipRestriction: {
        fields: {
          Hyur: 1,
          Elezen: 0,
          Lalafell: true,
          Miqote: false,
          Roegadyn: 1,
          AuRa: 0,
          Hrothgar: true,
          Viera: false,
          Male: 1,
          Female: 0,
        },
      },
    })?.rules.wear;
    expect(wear).toEqual({
      Hyur: true,
      Elezen: false,
      Lalafell: true,
      Miqote: false,
      Roegadyn: true,
      AuRa: false,
      Hrothgar: true,
      Viera: false,
      Male: true,
      Female: false,
    });
  });
});

describe('a glasses row that is not a record of fields', () => {
  it.each([null, 'x', 7, [], undefined])(
    'refuses %j instead of the fields',
    (fields) => {
      expect(normalizeRow({ row_id: 8, fields }, ['en'], false)).toBeNull();
    },
  );

  it('reports such a row from the API as INVALID_ROW and keeps the lookup partial', async () => {
    const result = await createXivapiClient({
      version: V,
      schema: S,
      languages: ['en'],
      fetch: async () =>
        json({
          version: V,
          schema: S,
          rows: [{ row_id: 8, fields: 7 }],
        }),
    }).getGlasses(8);
    expect(result.rows).toEqual([]);
    expect(result.issues.map((i) => i.code)).toEqual(['INVALID_ROW']);
  });
});

describe('names are kept as received, except that dye names are trimmed', () => {
  it('keeps the spaces around an item name and an empty one', () => {
    expect(item({ 'Name@lang(en)': ' Coat ' })?.names.en).toBe(' Coat ');
    expect(item({ 'Name@lang(en)': '' })?.names).toEqual({ en: '' });
  });

  it('trims a dye name of every kind of white space, tabs and ideographic spaces included', () => {
    const name = (value: string) =>
      normalizeStainRow({ row_id: 3, fields: { 'Name@lang(en)': value } }, [
        'en',
      ])?.names.en;
    expect(name('\tAsh　')).toBe('Ash');
    expect(name('　　')).toBe('');
    expect(name(' \n Ash Grey \r\n')).toBe('Ash Grey');
  });
});

describe('a row that belongs to a dye lookup is only a dye', () => {
  const glasses: GlassesRow = { rowId: 3, names: {}, iconId: null };
  const dye: StainRow = { rowId: 3, names: { en: 'Ash' } };
  const lookup = { stains: [2, 3] };
  const model: ItemRow = {
    rowId: 3,
    names: {},
    iconId: null,
    modelMain: '5',
    modelSub: null,
    slots: ['Body'],
    levelEquip: null,
    uiCategory: null,
    rules: { dyeCount: null, glamourable: null, wear: {}, grandCompany: null },
  };

  it('refuses a glasses row whose id is in the list', () => {
    expect(associated(glasses, lookup)).toBe(false);
    expect(associated(dye, lookup)).toBe(true);
  });

  it('refuses an item row whose id is in the list, with or without an icon', () => {
    expect(associated(model, lookup)).toBe(false);
    const { iconId: _icon, ...withoutIcon } = model;
    expect(associated(withoutIcon as unknown as ItemRow, lookup)).toBe(false);
  });
});

describe('lookups that differ only in the order or repeats of their input share one request', () => {
  it('shares a request between dye lookups', async () => {
    const fetch = vi.fn(async (input: URL | RequestInfo) => {
      const rows = (new URL(String(input)).searchParams.get('rows') ?? '')
        .split(',')
        .map(Number);
      return json({
        version: V,
        schema: S,
        rows: rows.map((id) => ({
          row_id: id,
          fields: { 'Name@lang(en)': `Dye ${id}` },
        })),
      });
    });
    const c = createXivapiClient({
      fetch,
      version: V,
      schema: S,
      languages: ['en'],
    });
    const [first, second] = await Promise.all([
      c.getStains([30, 2, 7]),
      c.getStains([7, 30, 2, 2]),
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(first.rows.map((r) => r.rowId)).toEqual([2, 7, 30]);
    expect(second.rows.map((r) => r.rowId)).toEqual([2, 7, 30]);
  });

  it('orders the slots of a search by name, whatever their keys', async () => {
    const urls: URL[] = [];
    const fetch: typeof globalThis.fetch = async (input) => {
      urls.push(new URL(String(input)));
      return json({ version: V, schema: S, results: [] });
    };
    const c = createXivapiClient({
      fetch,
      version: V,
      schema: S,
      languages: ['en'],
    });
    // Legs has the smaller key (1) but sorts after Body (328041).
    await c.searchItems([{ slot: 'Legs', base: 1, variant: 0 }, body]);
    expect(urls[0]?.searchParams.get('query')).toBe(
      '+((+EquipSlotCategory.Body=1 +ModelMain=328041) (+EquipSlotCategory.Legs=1 +ModelMain=1))',
    );
  });

  it('shares a request between two ring slots that hold the same model, in either order', async () => {
    const fetch = vi.fn(async () =>
      json({ version: V, schema: S, results: [] }),
    );
    const c = createXivapiClient({
      fetch,
      version: V,
      schema: S,
      languages: ['en'],
    });
    const left: EquipmentModel = { slot: 'LeftRing', base: 50, variant: 1 };
    const right: EquipmentModel = { slot: 'RightRing', base: 50, variant: 1 };
    await Promise.all([
      c.searchItems([left, right]),
      c.searchItems([right, left]),
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('an option whose getter throws', () => {
  it('is INVALID_OPTIONS when it is a method of the cache that has the getter', () => {
    for (const method of ['get', 'set']) {
      const cache = Object.defineProperty(
        { get: async () => null, set: async () => {} },
        method,
        {
          enumerable: true,
          get() {
            throw new Error('boom');
          },
        },
      );
      expect(() =>
        createXivapiClient({ cache } as unknown as XivapiOptions),
      ).toThrow(
        expect.objectContaining({
          name: 'XivapiInputError',
          code: 'INVALID_OPTIONS',
        }),
      );
    }
  });

  const KEYS = [
    'fetch',
    'baseUrl',
    'version',
    'schema',
    'languages',
    'maxPages',
    'timeoutMs',
    'cache',
  ] as const;
  const hostile = (key: string): XivapiOptions =>
    Object.defineProperty({}, key, {
      enumerable: true,
      get() {
        throw new Error('boom');
      },
    }) as XivapiOptions;
  const invalid = expect.objectContaining({
    name: 'XivapiInputError',
    code: 'INVALID_OPTIONS',
  });

  it.each(KEYS)('is read once by the client and the resolver: %s', (key) => {
    for (const create of [createXivapiClient, createXivapiResolver]) {
      let reads = 0;
      const options = Object.defineProperty({}, key, {
        enumerable: true,
        get() {
          reads++;
          return undefined;
        },
      });
      create(options as XivapiOptions);
      expect(reads).toBe(1);
    }
  });

  it.each(KEYS)(
    'is INVALID_OPTIONS for the dye resolver, the client and the resolver: %s',
    (key) => {
      expect(() => createDyeNameResolver(hostile(key))).toThrow(invalid);
      expect(() => createXivapiClient(hostile(key))).toThrow(invalid);
      expect(() => createXivapiResolver(hostile(key))).toThrow(invalid);
    },
  );
});
