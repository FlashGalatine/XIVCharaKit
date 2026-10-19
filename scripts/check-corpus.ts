import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { resolveAppearance } from '../packages/chara/src/appearance/index.js';
import {
  CharaInputError,
  inspectChara,
  READ_DEFAULTS,
  readChara,
} from '../packages/chara/src/index.js';
import { createDefaultPaletteProvider } from '../packages/chara/src/palettes/index.js';

// Opt-in local evidence only. No sample paths, names, stored values, or payloads are printed.
const directory = process.argv[2];
const palettes = process.argv.includes('--appearance')
  ? createDefaultPaletteProvider()
  : null;
if (!directory) throw new Error('Supply a local sample directory.');
const report = {
  files: 0,
  accepted: 0,
  rejected: Object.create(null) as Record<string, number>,
  minBytes: Infinity,
  maxBytes: 0,
  totalBytes: 0,
  embeddedImageFiles: 0,
  invalidFields: 0,
  unsupportedFields: 0,
  wornSlots: 0,
  issues: Object.create(null) as Record<string, number>,
  elapsedMs: 0,
  incompleteModels: Object.create(null) as Record<string, number>,
  appearance: {
    enabled: palettes !== null,
    corrections: 0,
    interpretations: Object.create(null) as Record<string, number>,
    issues: Object.create(null) as Record<string, number>,
  },
};
const start = performance.now();
for (const entry of await readdir(directory, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.chara')) continue;
  const path = join(directory, entry.name);
  const metadata = await stat(path);
  report.files++;
  report.minBytes = Math.min(report.minBytes, metadata.size);
  report.maxBytes = Math.max(report.maxBytes, metadata.size);
  report.totalBytes += metadata.size;
  try {
    if (metadata.size > READ_DEFAULTS.maxBytes)
      throw new CharaInputError('INPUT_TOO_LARGE');
    const document = readChara(await readFile(path));
    const inspection = inspectChara(document);
    if (palettes) {
      const appearance = await resolveAppearance(inspection, { palettes });
      report.appearance.corrections += appearance.corrections.length;
      for (const slot of Object.values(appearance.slots))
        report.appearance.interpretations[slot.interpretation] =
          (report.appearance.interpretations[slot.interpretation] ?? 0) + 1;
      for (const issue of appearance.issues)
        report.appearance.issues[issue.code] =
          (report.appearance.issues[issue.code] ?? 0) + 1;
    }
    report.accepted++;
    if (document.hasEmbeddedImage) report.embeddedImageFiles++;
    for (const issue of inspection.issues)
      report.issues[issue.code] = (report.issues[issue.code] ?? 0) + 1;
    const fields = [
      ...Object.values(inspection.appearance),
      ...Object.values(inspection.extended),
      inspection.facewear,
      inspection.identity.race,
      inspection.identity.tribe,
      inspection.identity.gender,
      inspection.identity.age,
    ];
    report.invalidFields += fields.filter(
      (field) => field.state === 'invalid',
    ).length;
    report.unsupportedFields += fields.filter(
      (field) => field.state === 'unsupported',
    ).length;
    report.wornSlots += Object.values(inspection.equipment).filter(
      (slot) => slot.status === 'worn',
    ).length;
    for (const [slot, gear] of Object.entries(inspection.equipment)) {
      if (gear.status !== 'invalid' || gear.stored.state !== 'valid') continue;
      const shape = `${slot}:set=${gear.set.state},base=${gear.base.state},variant=${gear.variant.state}`;
      report.incompleteModels[shape] =
        (report.incompleteModels[shape] ?? 0) + 1;
    }
  } catch (error) {
    const code =
      error instanceof CharaInputError ? error.code : 'INTERNAL_ERROR';
    report.rejected[code] = (report.rejected[code] ?? 0) + 1;
  }
}
report.elapsedMs = Math.round(performance.now() - start);
console.log(JSON.stringify(report, null, 2));
if (report.files === 0 || report.accepted !== report.files)
  process.exitCode = 1;
