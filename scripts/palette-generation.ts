// Layout adapted from XIV Dye Tools' MIT-licensed build-character-colors.ts.
// See THIRD_PARTY_NOTICES.md; raw game files are never part of this repository.
import {
  type RaceDataset,
  SHADER_SHARED,
  SHARED_LENGTHS,
  type SharedDataset,
  TRIBES,
} from '../packages/chara/src/palettes/layout.js';

export const CMP_MIN_BYTES = 182272;
export const CMP_MAX_BYTES = 16 * 1024 * 1024;
export interface PaletteTables {
  'creator-shared': SharedDataset;
  'creator-race': RaceDataset;
  'shader-shared': SharedDataset;
  'shader-race': RaceDataset;
}
const offsets = {
  eyes: 0,
  highlights: 256,
  lipsDark: 512,
  facePaintDark: 640,
  features: 768,
  lipsLight: 1024,
  facePaintLight: 1152,
} as const;

export function generatePaletteTables(bytes: Uint8Array): PaletteTables {
  if (
    bytes.byteLength < CMP_MIN_BYTES ||
    bytes.byteLength > CMP_MAX_BYTES ||
    bytes.byteLength % 4 !== 0
  )
    throw new Error('Invalid human.cmp layout.');
  const color = (index: number) =>
    `#${[0, 1, 2]
      .map((channel) =>
        (bytes[index * 4 + channel] as number).toString(16).padStart(2, '0'),
      )
      .join('')
      .toUpperCase()}`;
  const range = (base: number, count: number, stride = 1) =>
    Array.from({ length: count }, (_, index) => color(base + index * stride));
  const shared = (creator: boolean): SharedDataset => {
    const result: SharedDataset = Object.create(null);
    for (const name of creator
      ? (Object.keys(SHARED_LENGTHS) as (keyof typeof SHARED_LENGTHS)[])
      : SHADER_SHARED)
      result[name] = range(
        (creator ? 2304 : 0) + offsets[name],
        SHARED_LENGTHS[name],
      );
    return result;
  };
  const race = (creator: boolean): RaceDataset => {
    const result: RaceDataset = Object.create(null);
    for (const palette of ['skin', 'hair']) {
      const tribes: RaceDataset[string] = Object.create(null);
      for (const [clan, tribe] of TRIBES.entries()) {
        const genders: RaceDataset[string][string] = Object.create(null);
        for (const [gender, name] of ['Male', 'Female'].entries()) {
          const base = 4608 + (clan * 2 + gender) * 1280;
          const offset =
            palette === 'skin' ? (creator ? 768 : 0) : creator ? 1024 : 256;
          genders[name] = range(
            base + offset,
            192,
            palette === 'hair' && !creator ? 2 : 1,
          );
        }
        tribes[tribe] = genders;
      }
      result[palette] = tribes;
    }
    return result;
  };
  return {
    'creator-shared': shared(true),
    'creator-race': race(true),
    'shader-shared': shared(false),
    'shader-race': race(false),
  };
}
