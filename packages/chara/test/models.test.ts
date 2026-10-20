import { describe, expect, it } from 'vitest';
import type { EquipmentModel } from '../src/index.js';
import { modelKey } from '../src/index.js';

const pack = (input: unknown) => modelKey(input as EquipmentModel);

describe('validated model keys', () => {
  it.each([
    [{ slot: 'HeadGear', base: 361, variant: 5 }, '328041'],
    [{ slot: 'MainHand', set: 634, base: 19, variant: 1 }, '4296213114'],
    [{ slot: 'OffHand', set: 698, base: 149, variant: 1 }, '4304732858'],
    [{ slot: 'LeftRing', base: 65535, variant: 65535 }, '4294967295'],
    [
      { slot: 'MainHand', set: 65535, base: 65535, variant: 65535 },
      '281474976710655',
    ],
    [{ slot: 'RightRing', base: 0, variant: 0 }, '0'],
  ])('packs %j without signed overflow', (input, expected) => {
    expect(pack(input)).toBe(expected);
  });

  it.each([-1, 65536, 1.1, NaN, Infinity, '3', null])(
    'rejects invalid lanes on direct calls %s',
    (value) => {
      for (const lane of ['set', 'base', 'variant']) {
        expect(() =>
          pack({
            slot: 'MainHand',
            set: 1,
            base: 2,
            variant: 3,
            [lane]: value,
          }),
        ).toThrow(expect.objectContaining({ code: 'INVALID_MODEL' }));
      }
    },
  );

  it.each([
    {},
    null,
    { slot: 'toString', base: 1, variant: 1 },
    { slot: 'MainHand', base: 1, variant: 1 },
    { slot: 'Body', set: 1, base: 1, variant: 1 },
  ])('rejects incomplete or contradictory models %j', (input) => {
    expect(() => pack(input)).toThrow(
      expect.objectContaining({ code: 'INVALID_MODEL' }),
    );
  });
});
