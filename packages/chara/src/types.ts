export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | JsonRecord;
export interface JsonRecord {
  [key: string]: JsonValue;
}
export interface Issue {
  code: string;
  severity: 'info' | 'warning' | 'error';
  path: (string | number)[];
  message: string;
}
export interface EmbeddedImage {
  path: (string | number)[];
  type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';
}
export interface ReadOptions {
  maxBytes?: number;
  maxDepth?: number;
  maxNodes?: number;
  maxKeyLength?: number;
  maxStringLength?: number;
  maxIssues?: number;
}
export interface CharaDocument {
  /** Null-prototype records, recursively. Unknown fields remain untrusted data. */
  fields: JsonRecord;
  hasEmbeddedImage: boolean;
  embeddedImages: EmbeddedImage[];
  issues: Issue[];
}

export type Field<T> =
  | { state: 'absent'; raw?: never; value?: never }
  | { state: 'null'; raw: null; value?: never }
  | { state: 'valid'; raw: JsonValue; value: T }
  | { state: 'invalid' | 'unsupported'; raw: JsonValue; value?: never };
export type EquipmentSlot =
  typeof import('./field-spec.js').EQUIPMENT_SLOTS[number];
export type Race =
  | 'Hyur'
  | 'Elezen'
  | 'Lalafell'
  | "Miqo'te"
  | 'Roegadyn'
  | 'Au Ra'
  | 'Hrothgar'
  | 'Viera';
export interface EquipmentModel {
  slot: EquipmentSlot;
  set?: number;
  base: number;
  variant: number;
}
export interface EquipmentResolveInput {
  models: readonly EquipmentModel[];
  glassesId?: number;
}
export interface EquipmentInspection {
  stored: Field<JsonRecord>;
  status: 'absent' | 'null' | 'invalid' | 'empty' | 'worn';
  model: EquipmentModel | null;
  set: Field<number>;
  base: Field<number>;
  variant: Field<number>;
  dye1: Field<number>;
  dye2: Field<number>;
}
export interface CharaInspection {
  document: CharaDocument;
  metadata: Record<
    typeof import('./field-spec.js').METADATA_FIELDS[number],
    Field<string | number>
  >;
  identity: {
    race: Field<Race>;
    tribe: Field<string>;
    gender: Field<'Masculine' | 'Feminine'>;
    age: Field<string>;
    modelType: Field<number>;
    canonicalRace: Race | null;
    raceSource: 'tribe' | 'race' | null;
  };
  appearance: Record<
    typeof import('./field-spec.js').BYTE_FIELDS[number] | 'FacialFeatures',
    Field<number>
  > & { EnableHighlights: Field<boolean> };
  extended: Record<
    typeof import('./field-spec.js').COLOR_FIELDS[number] | 'BustScale',
    Field<number[]>
  > &
    Record<
      typeof import('./field-spec.js').FLOAT_FIELDS[number],
      Field<number>
    > & { IsExtendedAppearanceValid: Field<boolean> };
  equipment: Record<EquipmentSlot, EquipmentInspection>;
  facewear: Field<number>;
  issues: Issue[];
}
