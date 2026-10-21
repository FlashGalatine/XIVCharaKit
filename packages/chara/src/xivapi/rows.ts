import { isRecord } from '../field-spec.js';
import type { EquipmentSlot } from '../types.js';
import {
  isStainLookup,
  LANGUAGES,
  type LookupSelection,
  SLOT_COLUMNS,
  WEAR_COLUMNS,
} from './query.js';
import type { GlassesRow, Language, PublicRow, StainRow } from './types.js';

const uint = (v: unknown, max = 0xffffffff): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= max;
const nullableInt = (v: unknown, max?: number): number | null =>
  uint(v, max) ? v : null;
const bool = (v: unknown): boolean | null =>
  v === true || v === 1 ? true : v === false || v === 0 ? false : null;
const decimal = (v: unknown): string | null =>
  uint(v, 281474976710655) ? String(v) : null;
const relation = (v: unknown): Record<string, unknown> | null =>
  isRecord(v) && isRecord(v.fields) ? v.fields : null;
const relationId = (v: unknown): number | null =>
  isRecord(v) ? nullableInt(v.row_id) : null;
export function normalizeRow(
  raw: unknown,
  languages: readonly Language[],
  items: boolean,
): PublicRow | null {
  if (
    !isRecord(raw) ||
    !uint(raw.row_id) ||
    !isRecord(raw.fields) ||
    (raw.sheet !== undefined && raw.sheet !== (items ? 'Item' : 'Glasses'))
  )
    return null;
  const f = raw.fields;
  const names: GlassesRow['names'] = {};
  for (const lang of languages) {
    const value = f[`Name@lang(${lang})`];
    if (value !== undefined) {
      if (typeof value !== 'string' || value.length > 1024) return null;
      names[lang] = value;
    }
  }
  const row: GlassesRow = {
    rowId: raw.row_id,
    names,
    iconId: isRecord(f.Icon) ? nullableInt(f.Icon.id) : null,
  };
  if (!items) return row;
  const modelMain = decimal(f.ModelMain);
  const slots = relation(f.EquipSlotCategory);
  if (modelMain === null || !slots) return null;
  const wear: Record<string, boolean> = {};
  const restriction = relation(f.EquipRestriction);
  for (const column of WEAR_COLUMNS) {
    const value = bool(restriction?.[column]);
    if (value !== null) wear[column] = value;
  }
  return {
    ...row,
    modelMain,
    modelSub: decimal(f.ModelSub),
    slots: (Object.keys(SLOT_COLUMNS) as EquipmentSlot[]).filter(
      (slot) => bool(slots[SLOT_COLUMNS[slot]]) === true,
    ),
    levelEquip: nullableInt(f.LevelEquip, 65535),
    uiCategory: relationId(f.ItemUICategory),
    rules: {
      dyeCount: nullableInt(f.DyeCount, 2),
      glamourable: bool(f.IsGlamorous),
      wear,
      grandCompany: relationId(f.GrandCompany),
    },
  };
}
export function associated(row: PublicRow, lookups: LookupSelection): boolean {
  if (isStainLookup(lookups))
    return (
      lookups.stains.includes(row.rowId) &&
      !('iconId' in row) &&
      !('modelMain' in row)
    );
  return typeof lookups === 'number'
    ? row.rowId === lookups && 'iconId' in row && !('modelMain' in row)
    : 'modelMain' in row &&
        lookups.some(
          (l) => row.modelMain === l.key && row.slots.includes(l.slot),
        );
}

export function normalizeStainRow(
  raw: unknown,
  languages: readonly Language[],
): StainRow | null {
  if (
    !isRecord(raw) ||
    !uint(raw.row_id, 65535) ||
    !isRecord(raw.fields) ||
    (raw.sheet !== undefined && raw.sheet !== 'Stain')
  )
    return null;
  const names: StainRow['names'] = {};
  for (const language of languages) {
    const name = raw.fields[`Name@lang(${language})`];
    if (typeof name !== 'string' || name.length > 1024) return null;
    names[language] = name.trim();
  }
  return { rowId: raw.row_id, names };
}

export function cachedStainRow(
  raw: unknown,
  languages: readonly Language[],
): StainRow | null {
  if (!isRecord(raw) || !isRecord(raw.names)) return null;
  const names = raw.names;
  const fields = Object.fromEntries(
    languages.map((language) => [`Name@lang(${language})`, names[language]]),
  );
  const row = normalizeStainRow({ row_id: raw.rowId, fields }, languages);
  return row && sameData(row, raw) ? row : null;
}

/** Reconstruct the exact public shape when validating normalized cache rows. */
export function cachedRow(
  raw: unknown,
  languages: readonly Language[],
  items: boolean,
): PublicRow | null {
  if (!isRecord(raw) || !isRecord(raw.names)) return null;
  const fields: Record<string, unknown> = {};
  for (const lang of LANGUAGES)
    if (Object.hasOwn(raw.names, lang))
      fields[`Name@lang(${lang})`] = raw.names[lang];
  fields.Icon = { id: raw.iconId };
  if (items) {
    if (
      typeof raw.modelMain !== 'string' ||
      !/^(0|[1-9][0-9]{0,14})$/.test(raw.modelMain) ||
      !Array.isArray(raw.slots) ||
      raw.slots.length > 12 ||
      raw.slots.some(
        (s) => typeof s !== 'string' || !Object.hasOwn(SLOT_COLUMNS, s),
      ) ||
      !isRecord(raw.rules) ||
      !isRecord(raw.rules.wear)
    )
      return null;
    if (
      raw.modelSub !== null &&
      (typeof raw.modelSub !== 'string' ||
        !/^(0|[1-9][0-9]{0,14})$/.test(raw.modelSub))
    )
      return null;
    fields.ModelMain = Number(raw.modelMain);
    fields.ModelSub = raw.modelSub === null ? null : Number(raw.modelSub);
    fields.EquipSlotCategory = {
      fields: Object.fromEntries(
        raw.slots.map((s) => [SLOT_COLUMNS[s as EquipmentSlot], 1]),
      ),
    };
    fields.LevelEquip = raw.levelEquip;
    fields.ItemUICategory = { row_id: raw.uiCategory };
    fields.DyeCount = raw.rules.dyeCount;
    fields.IsGlamorous = raw.rules.glamourable;
    fields.EquipRestriction = { fields: raw.rules.wear };
    fields.GrandCompany = { row_id: raw.rules.grandCompany };
  }
  const normalized = normalizeRow(
    { row_id: raw.rowId, fields },
    languages,
    items,
  );
  return normalized && sameData(normalized, raw) ? normalized : null;
}

/** Inputs have already passed bounded JSON admission; object order is not data. */
function sameData(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.hasOwn(right, key) && sameData(left[key], right[key]),
    )
  );
}
