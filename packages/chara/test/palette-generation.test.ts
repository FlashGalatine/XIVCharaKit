import { describe, expect, it } from 'vitest';
import { generatePaletteTables } from '../../../scripts/palette-generation.js';

describe('explicit human.cmp layout extraction', () => {
  it('separates shared halves and clan/gender skin/hair including interleaved shader hair', () => {
    const bytes = new Uint8Array(182272);
    const color = (entry: number, rgb: number[]) =>
      bytes.set([...rgb, 255], entry * 4);
    color(0, [1, 2, 3]);
    color(2304, [4, 5, 6]);
    color(512, [7, 8, 9]);
    color(3328, [10, 11, 12]);
    color(31488, [13, 14, 15]);
    color(32256, [16, 17, 18]);
    color(32554, [255, 220, 152]);
    color(31828, [229, 210, 172]);
    color(4866, [19, 20, 21]);
    color(4865, [99, 99, 99]); // Sheen must not become the next hair swatch.
    const data = generatePaletteTables(bytes);
    expect(data).toHaveProperty(['shader-shared', 'eyes', 0], '#010203');
    expect(data).toHaveProperty(['creator-shared', 'eyes', 0], '#040506');
    expect(data).toHaveProperty(['shader-shared', 'lipsDark', 0], '#070809');
    expect(data).toHaveProperty(['creator-shared', 'lipsLight', 0], '#0A0B0C');
    expect(data).toHaveProperty(
      ['shader-race', 'skin', 'Raen', 'Female', 0],
      '#0D0E0F',
    );
    expect(data).toHaveProperty(
      ['creator-race', 'skin', 'Raen', 'Female', 0],
      '#101112',
    );
    expect(data).toHaveProperty(
      ['creator-race', 'hair', 'Raen', 'Female', 42],
      '#FFDC98',
    );
    expect(data).toHaveProperty(
      ['shader-race', 'hair', 'Raen', 'Female', 42],
      '#E5D2AC',
    );
    expect(data).toHaveProperty(
      ['shader-race', 'hair', 'Midlander', 'Male', 1],
      '#131415',
    );
    expect(Object.keys(data['creator-race'].skin ?? {})).toHaveLength(16);
    expect(data).toHaveProperty(['creator-shared', 'eyes', 'length'], 192);
    expect(data).toHaveProperty(['creator-shared', 'lipsDark', 'length'], 96);
    expect(data['shader-shared']).not.toHaveProperty('lipsLight');
  });
  it.each([0, 182271, 182273, 16 * 1024 * 1024 + 4])(
    'rejects invalid source byte layouts %s',
    (size) => {
      expect(() => generatePaletteTables(new Uint8Array(size))).toThrow(
        'Invalid human.cmp layout.',
      );
    },
  );
});
