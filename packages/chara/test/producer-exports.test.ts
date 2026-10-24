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
    // The eye colors are derived from the stored indices and the shipped creator table,
    // not from the library's own output. Brio 0.7.2+ stores each eye's extended color
    // under the other eye's name, so only Brio needs (and reports) the pair correction.
    const { eyes } = JSON.parse(
      await readFile(
        new URL('../src/palettes/data/creator-shared.json', import.meta.url),
        'utf8',
      ),
    );
    expect(inspection.appearance.LEyeColor.value).toBe(169);
    expect(inspection.appearance.REyeColor.value).toBe(42);
    expect(appearance.corrections).toEqual(
      brio
        ? [{ code: 'HISTORICAL_EYE_PAIR_SWAP', slots: ['leftEye', 'rightEye'] }]
        : [],
    );
    expect(appearance.slots.leftEye).toMatchObject({
      interpretation: 'palette',
      displayHex: eyes[169],
      correction: brio ? 'historicalEyePairSwap' : null,
    });
    expect(appearance.slots.rightEye).toMatchObject({
      interpretation: 'palette',
      displayHex: eyes[42],
      correction: brio ? 'historicalEyePairSwap' : null,
    });
    // Every reviewed export stores Mouth 2: the producers' lip-color bit (0x80) is clear.
    expect(inspection.appearance.Mouth.value).toBe(2);
    expect(appearance.slots.lip).toMatchObject({
      active: false,
      interpretation: 'inactive',
      reason: 'lipDisabled',
      displayHex: null,
    });
  });

  it('shows the stored lip color once the producer lip-color bit is set', async () => {
    const fields = JSON.parse(
      await readFile(
        new URL(
          '../../../fixtures/producer-exports/anamnesis-default.chara',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    const { lipsDark } = JSON.parse(
      await readFile(
        new URL('../src/palettes/data/creator-shared.json', import.meta.url),
        'utf8',
      ),
    );
    const lipFor = async (mouth: number) =>
      (
        await resolveAppearance(
          inspectChara(readChara(JSON.stringify({ ...fields, Mouth: mouth }))),
          { palettes: createDefaultPaletteProvider() },
        )
      ).slots.lip;
    expect(await lipFor(2)).toMatchObject({ active: false, displayHex: null });
    // Stored LipsToneFurPattern 53 reads straight from the shipped creator table.
    expect(await lipFor(2 | 0x80)).toMatchObject({
      active: true,
      interpretation: 'palette',
      displayHex: lipsDark[53],
    });
  });

  it('flags, without swapping, a Brio export whose crossing a custom eye color hides', async () => {
    const fields = JSON.parse(
      await readFile(
        new URL(
          '../../../fixtures/producer-exports/brio-default.chara',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    // An authored edit of the real export: one eye gets a custom color (not a fresh Brio export).
    const edited = { ...fields, RightEyeColor: '0.8, 0.01, 0.01' };
    const appearance = await resolveAppearance(
      inspectChara(readChara(JSON.stringify(edited))),
      { palettes: createDefaultPaletteProvider() },
    );
    expect(appearance.corrections).toEqual([]);
    expect(appearance.issues).toEqual([
      expect.objectContaining({
        code: 'EYE_PAIRING_UNCONFIRMED',
        path: [],
      }),
    ]);
  });
});
