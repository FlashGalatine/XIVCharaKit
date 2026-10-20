import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { resolveAppearance } from '../src/appearance/index.js';
import { inspectChara, modelKey, readChara } from '../src/index.js';
import { createDefaultPaletteProvider } from '../src/palettes/index.js';

// Reviewed from the supplied export fields, not generated from inspection output.
// These establish stored-value compatibility, not visual ground truth in the apps.
describe('maintainer-supplied default producer exports', () => {
  it.each([
    ['brio-default.chara', true],
    ['anamnesis-default.chara', false],
    ['anamnesis-default-metadata.chara', false],
    ['ktisis-default.chara', false],
  ] as const)('retains reviewed values from %s', async (name, brio) => {
    const bytes = await readFile(
      new URL(`../../../fixtures/producer-exports/${name}`, import.meta.url),
    );
    const document = readChara(bytes);
    const inspection = inspectChara(document);
    expect(inspection.identity.canonicalRace).toBe('Elezen');
    expect(inspection.identity.tribe.value).toBe('Duskwight');
    expect(inspection.identity.gender.value).toBe('Feminine');
    expect(inspection.facewear).toMatchObject({ state: 'valid', value: 0 });
    expect(inspection.appearance.HairTone.value).toBe(71);
    expect(inspection.appearance.FacePaint.value).toBe(0);
    const body = inspection.equipment.Body;
    expect(body.model).toEqual({ slot: 'Body', base: 779, variant: 1 });
    if (!body.model) throw new Error('Expected reviewed body model');
    expect(modelKey(body.model)).toBe('66315');
    expect(body.dye1).toMatchObject({ state: 'valid', value: 33 });
    expect(body.dye2).toMatchObject({ state: 'valid', value: 11 });
    const mainHand = inspection.equipment.MainHand;
    expect(mainHand.model).toEqual({
      slot: 'MainHand',
      set: 2027,
      base: 4,
      variant: 1,
    });
    if (!mainHand.model) throw new Error('Expected reviewed main-hand model');
    expect(modelKey(mainHand.model)).toBe('4295231467');
    expect(mainHand.dye1).toMatchObject({ state: 'valid', value: 0 });
    expect(mainHand.dye2).toMatchObject({ state: 'valid', value: 0 });
    expect(inspection.extended.IsExtendedAppearanceValid).toEqual(
      brio ? { state: 'valid', raw: true, value: true } : { state: 'absent' },
    );
    expect(document.hasEmbeddedImage).toBe(brio);
    expect(Object.hasOwn(document.fields, 'Base64Image')).toBe(false);
    expect(inspection.issues.map((issue) => [issue.code, issue.path])).toEqual(
      brio
        ? [
            ['IMAGE_OMITTED', ['Base64Image']],
            ['UNSUPPORTED_FIELD', ['Tags']],
          ]
        : [],
    );
    if (brio) expect(document.fields.Tags).toBe(null);
    const appearance = await resolveAppearance(inspection, {
      palettes: createDefaultPaletteProvider(),
    });
    expect(appearance.issues).toEqual([]);
  });
});
