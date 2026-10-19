import { describe, expect, it, vi } from 'vitest';
import { createLazyPaletteProvider } from '../src/palettes/default-provider.js';
import { createDefaultPaletteProvider } from '../src/palettes/index.js';

describe('versioned palette lookup', () => {
  it.each([
    [{ table: 'creator', palette: 'eyes', index: 0 }, '#F7F7F7'],
    [{ table: 'shader', palette: 'eyes', index: 0 }, '#F7F7F7'],
    [
      {
        table: 'creator',
        palette: 'hair',
        index: 42,
        tribe: 'Raen',
        gender: 'Feminine',
      },
      '#FFDC98',
    ],
    [
      {
        table: 'shader',
        palette: 'hair',
        index: 42,
        tribe: 'Raen',
        gender: 'Feminine',
      },
      '#E5D2AC',
    ],
  ])('returns independently reviewed color %j', async (request, hex) => {
    const color = await createDefaultPaletteProvider().getColor(
      request as never,
    );
    expect(color).toMatchObject({ ...request, hex });
    expect(color?.rgb).toEqual(
      hex
        .slice(1)
        .match(/../g)
        ?.map((value) => Number.parseInt(value, 16)),
    );
  });
  it.each([
    { table: 'creator', palette: 'eyes', index: -1 },
    { table: 'shader', palette: 'eyes', index: 192 },
    { table: 'creator', palette: 'lipsDark', index: 96 },
    { table: 'creator', palette: 'skin', index: 0 },
    {
      table: 'shader',
      palette: 'hair',
      index: 0,
      tribe: 'constructor',
      gender: 'Feminine',
    },
    {
      table: 'creator',
      palette: 'skin',
      index: 0,
      tribe: 'Raen',
      gender: 'unknown',
    },
    { table: 'creator', palette: 'constructor', index: 0 },
    { table: 'constructor', palette: 'eyes', index: 0 },
    { table: 'shader', palette: 'lipsLight', index: 0 },
    { table: 'shader', palette: 'facePaintDark', index: 0 },
    { table: 'creator', palette: 'eyes', index: NaN },
    { table: 'creator', palette: 'eyes', index: Infinity },
    { table: 'creator', palette: 'eyes', index: 0.5 },
  ])('returns null for unsupported coordinates %j', async (request) => {
    expect(
      await createDefaultPaletteProvider().getColor(request as never),
    ).toBeNull();
  });

  it('returns detached colors and immutable provenance with an unknown game revision', async () => {
    const provider = createDefaultPaletteProvider();
    const color = await provider.getColor({
      table: 'creator',
      palette: 'eyes',
      index: 0,
    });
    if (!color) throw new Error('Expected fixture color');
    (color as { hex: string }).hex = '#000000';
    expect(
      (await provider.getColor({ table: 'creator', palette: 'eyes', index: 0 }))
        ?.hex,
    ).toBe('#F7F7F7');
    expect(provider.metadata.gameVersion).toBeNull();
    expect(() => {
      (provider.metadata as { datasetVersion: string }).datasetVersion =
        'poison';
    }).toThrow();
  });
});

describe('lazy loading boundaries', () => {
  const malformedCoordinates: { palette: unknown }[] = [
    { palette: ['eyes'] },
    { palette: { toString: null } },
    { palette: { valueOf: null } },
  ];
  it.each(malformedCoordinates)(
    'rejects non-string palette coordinates without coercion or loading %j',
    async ({ palette }) => {
      const load = vi.fn(async () => {
        throw new Error('Should not load');
      });
      const provider = createLazyPaletteProvider({ 'creator-shared': load });
      expect(
        await provider.getColor({
          table: 'creator',
          palette,
          index: 0,
        } as never),
      ).toBeNull();
      expect(load).not.toHaveBeenCalled();
    },
  );
  it('snapshots validated coordinates when a request object is reused during a cold load', async () => {
    const provider = createDefaultPaletteProvider();
    const request = {
      table: 'creator',
      palette: 'hair',
      index: 42,
      tribe: 'Raen',
      gender: 'Feminine',
    } as import('../src/palettes/index.js').PaletteRequest;
    const creator = provider.getColor(request);
    request.table = 'shader';
    const shader = provider.getColor(request);
    request.palette = 'skin';
    request.index = 0;
    request.tribe = 'Veena';
    request.gender = 'Masculine';
    expect(await creator).toMatchObject({
      table: 'creator',
      palette: 'hair',
      index: 42,
      tribe: 'Raen',
      gender: 'Feminine',
      hex: '#FFDC98',
    });
    expect(await shader).toMatchObject({
      table: 'shader',
      palette: 'hair',
      index: 42,
      tribe: 'Raen',
      gender: 'Feminine',
      hex: '#E5D2AC',
    });
  });
  it('does not load unused tables and deduplicates concurrent requests', async () => {
    const load = vi.fn(async () => ({
      eyes: Array.from({ length: 192 }, () => '#FFFFFF'),
      highlights: Array.from({ length: 192 }, () => '#FFFFFF'),
      features: Array.from({ length: 192 }, () => '#FFFFFF'),
      lipsDark: Array.from({ length: 96 }, () => '#FFFFFF'),
    }));
    const unused = vi.fn(async () => {
      throw new Error('Unexpected table load');
    });
    const provider = createLazyPaletteProvider({
      'shader-shared': load,
      'creator-shared': unused,
      'creator-race': unused,
      'shader-race': unused,
    });
    expect(load).not.toHaveBeenCalled();
    expect(
      await provider.getColor({ table: 'shader', palette: 'eyes', index: -1 }),
    ).toBeNull();
    expect(load).not.toHaveBeenCalled();
    const [a, b] = await Promise.all([
      provider.getColor({ table: 'shader', palette: 'eyes', index: 0 }),
      provider.getColor({ table: 'shader', palette: 'eyes', index: 1 }),
    ]);
    expect(a?.hex).toBe('#FFFFFF');
    expect(b?.hex).toBe('#FFFFFF');
    expect(load).toHaveBeenCalledTimes(1);
    expect(unused).not.toHaveBeenCalled();
  });
  it('forgets a failed load and retries without exposing the loader error', async () => {
    let attempts = 0;
    const load = async () => {
      if (++attempts === 1) throw new Error('PRIVATE_LOADER_CANARY');
      return {
        eyes: Array.from({ length: 192 }, () => '#FFFFFF'),
        highlights: Array.from({ length: 192 }, () => '#FFFFFF'),
        features: Array.from({ length: 192 }, () => '#FFFFFF'),
        lipsDark: Array.from({ length: 96 }, () => '#FFFFFF'),
      };
    };
    const provider = createLazyPaletteProvider({ 'shader-shared': load });
    await expect(
      provider.getColor({ table: 'shader', palette: 'eyes', index: 0 }),
    ).rejects.toThrow('Palette data could not be loaded.');
    expect(
      (await provider.getColor({ table: 'shader', palette: 'eyes', index: 0 }))
        ?.hex,
    ).toBe('#FFFFFF');
  });
  it('does not perform external I/O while importing or resolving local colors', async () => {
    vi.stubGlobal('fetch', () => {
      throw new Error('Unexpected external I/O');
    });
    try {
      vi.resetModules();
      const api = await import('../src/palettes/index.js');
      expect(
        (
          await api
            .createDefaultPaletteProvider()
            .getColor({ table: 'creator', palette: 'eyes', index: 0 })
        )?.hex,
      ).toBe('#F7F7F7');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
