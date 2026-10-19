export const TRIBES = Object.freeze([
  'Midlander',
  'Highlander',
  'Wildwood',
  'Duskwight',
  'Plainsfolk',
  'Dunesfolk',
  'SeekerOfTheSun',
  'KeeperOfTheMoon',
  'SeaWolf',
  'Hellsguard',
  'Raen',
  'Xaela',
  'Helions',
  'TheLost',
  'Rava',
  'Veena',
] as const);
export const SHARED_LENGTHS = Object.freeze({
  eyes: 192,
  highlights: 192,
  features: 192,
  lipsDark: 96,
  lipsLight: 96,
  facePaintDark: 96,
  facePaintLight: 96,
});
export const SHADER_SHARED = Object.freeze([
  'eyes',
  'highlights',
  'features',
  'lipsDark',
] as const);
export type DatasetKey =
  | 'creator-shared'
  | 'creator-race'
  | 'shader-shared'
  | 'shader-race';
export type SharedDataset = Record<string, readonly string[]>;
export type RaceDataset = Record<
  string,
  Record<string, Record<string, readonly string[]>>
>;
export type PaletteDataset = SharedDataset | RaceDataset;
