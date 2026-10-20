export const EQUIPMENT_SLOTS = Object.freeze([
  'MainHand',
  'OffHand',
  'HeadGear',
  'Body',
  'Hands',
  'Legs',
  'Feet',
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
] as const);
export const BYTE_FIELDS = [
  'Height',
  'Head',
  'Hair',
  'Skintone',
  'REyeColor',
  'HairTone',
  'Highlights',
  'LimbalEyes',
  'Eyebrows',
  'LEyeColor',
  'Eyes',
  'Nose',
  'Jaw',
  'Mouth',
  'LipsToneFurPattern',
  'EarMuscleTailSize',
  'TailEarsType',
  'Bust',
  'FacePaint',
  'FacePaintColor',
] as const;
export const COLOR_FIELDS = [
  'SkinColor',
  'SkinGloss',
  'LeftEyeColor',
  'RightEyeColor',
  'LimbalRingColor',
  'HairColor',
  'HairGloss',
  'HairHighlight',
  'MouthColor',
] as const;
export const FLOAT_FIELDS = [
  'Transparency',
  'MuscleTone',
  'HeightMultiplier',
] as const;
export const METADATA_FIELDS = [
  'TypeName',
  '$type',
  'FileExtension',
  'FileVersion',
  'Author',
  'Description',
  'Version',
  'Nickname',
  'SaveMode',
  'ObjectKind',
] as const;
export const CHARACTER_FIELDS: ReadonlySet<string> = new Set([
  ...EQUIPMENT_SLOTS,
  ...BYTE_FIELDS,
  ...COLOR_FIELDS,
  ...FLOAT_FIELDS,
  'Race',
  'Tribe',
  'Gender',
  'Age',
  'ModelType',
  'EnableHighlights',
  'FacialFeatures',
  'Glasses',
  'BustScale',
  'IsExtendedAppearanceValid',
]);
export const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  ...CHARACTER_FIELDS,
  ...METADATA_FIELDS,
]);

export function isRecord(
  value: unknown,
): value is import('./types.js').JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
