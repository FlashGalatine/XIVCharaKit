import { createLazyPaletteProvider } from './default-provider.js';

export { PALETTE_METADATA, PaletteDataError } from './default-provider.js';
export type {
  PaletteColor,
  PaletteGender,
  PaletteMetadata,
  PaletteName,
  PaletteProvider,
  PaletteRequest,
  PaletteTable,
} from './types.js';

export function createDefaultPaletteProvider() {
  return createLazyPaletteProvider({
    'creator-shared': () =>
      import('./data/creator-shared.json', { with: { type: 'json' } }).then(
        (module) => module.default,
      ),
    'creator-race': () =>
      import('./data/creator-race.json', { with: { type: 'json' } }).then(
        (module) => module.default,
      ),
    'shader-shared': () =>
      import('./data/shader-shared.json', { with: { type: 'json' } }).then(
        (module) => module.default,
      ),
    'shader-race': () =>
      import('./data/shader-race.json', { with: { type: 'json' } }).then(
        (module) => module.default,
      ),
  });
}
