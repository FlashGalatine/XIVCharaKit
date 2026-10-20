import { describe, expect, it } from 'vitest';
import { DYE_METADATA, getDyeName } from '../src/dyes/index.js';

describe('local Stain names', () => {
  it('identifies a frozen English Stain snapshot separately from palette/game revisions', () => {
    expect(DYE_METADATA.table).toBe('Stain');
    expect(DYE_METADATA.language).toBe('en');
    expect(DYE_METADATA.gameVersion).toBeNull();
    expect(DYE_METADATA.namedRows).toBe(126);
    expect(Object.isFrozen(DYE_METADATA)).toBe(true);
  });
  it.each([
    [0, 'No Color'],
    [1, 'Snow White'],
    [3, 'Goobbue Grey'],
    [10, 'Dalamud Red'],
    [88, 'Canary Yellow'],
    [101, 'Pure White'],
    [122, 'Metallic Pink'],
    [125, 'Metallic Dark Blue'],
  ])('resolves Stain row %s without using item IDs', (id, name) => {
    expect(getDyeName(id as number)).toBe(name);
  });

  it.each([126, 127, 128, 129, 5729, 65535])(
    'keeps blank, unknown and item-ID-shaped values unresolved: %s',
    (id) => expect(getDyeName(id)).toBeNull(),
  );

  it.each([-1, 1.5, NaN, Infinity, -Infinity, null, undefined, '3', true])(
    'does not coerce invalid input %s',
    (id) => expect(getDyeName(id as number)).toBeNull(),
  );

  it('does not execute input coercion hooks', () => {
    const input = {
      valueOf: () => {
        throw new Error('Coercion');
      },
    };
    expect(getDyeName(input as unknown as number)).toBeNull();
  });
});
