export type PaletteTable = 'creator' | 'shader';
export type PaletteName =
  | 'eyes'
  | 'highlights'
  | 'features'
  | 'lipsDark'
  | 'lipsLight'
  | 'facePaintDark'
  | 'facePaintLight'
  | 'skin'
  | 'hair';
export type PaletteGender = 'Masculine' | 'Feminine';
export interface PaletteRequest {
  table: PaletteTable;
  palette: PaletteName;
  index: number;
  tribe?: string | null;
  gender?: PaletteGender | null;
}
export interface PaletteColor extends PaletteRequest {
  hex: string;
  rgb: readonly [number, number, number];
  datasetVersion: string;
}
export interface PaletteMetadata {
  readonly schemaVersion: number;
  readonly datasetVersion: string;
  readonly gameVersion: string | null;
  readonly source: Readonly<{
    repository: string;
    commit: string;
    schemaVersion: string;
  }>;
  readonly artifactHashEncoding: string;
  readonly generatedFrom: Readonly<{ sha256: string; bytes: number }> | null;
  readonly sources: readonly Readonly<{
    path: string;
    sha256: string;
    bytes: number;
  }>[];
  readonly artifacts: readonly Readonly<{
    file: string;
    sha256: string;
    colorCount: number;
  }>[];
}
export interface PaletteProvider {
  readonly metadata?: PaletteMetadata;
  getColor(request: PaletteRequest): Promise<PaletteColor | null>;
}
