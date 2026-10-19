# ffxiv-chara

A TypeScript library in development for reading and inspecting Final Fantasy XIV `.chara` files used by Anamnesis, Ktisis, and Brio.

**Status: reader, palettes, and appearance interpretation implemented.** Bounded reading, typed inspection, model keys, creator/shader palette lookup, and source-labelled swatches are available. The package is private at version 0.0.0 while publication identity and licensing remain undecided.

The full MVP includes:

- Typed inspection of character appearance, equipment, dye channels, and facewear.
- Appearance swatches backed by versioned creator and shader palettes.
- Optional XIVAPI equipment resolution with matching candidates and explicit failure states.
- A small website demonstrating the library's public API with local files and anonymized examples.

XIVAPI resolution and the demo website are upcoming milestones. Editing and writing `.chara` files are deferred to a later version. No package has been published and no demo has been deployed.

## Develop locally

Use Node 22.21.0 and pnpm 10.27.0 (pinned in the repository).

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm type-check
pnpm lint
pnpm verify-fixtures
pnpm verify-palettes
pnpm test:package
```

`pnpm test:package` builds and packs the private package locally, checks the exact tarball contents, and exercises installed JavaScript, TypeScript, and Node Worker consumers. It does not publish. `pnpm benchmark` measures synthetic reader cases in isolated Node processes.

```ts
import { readChara, inspectChara, modelKey } from 'ffxiv-chara';

const document = readChara('{"Body":{"ModelBase":361,"ModelVariant":5,"DyeId":0}}');
const inspection = inspectChara(document);
const body = inspection.equipment.Body;
if (body.model) console.log(modelKey(body.model)); // "328041"
```

Optional appearance interpretation uses separate exports:

```ts
import { createDefaultPaletteProvider } from 'ffxiv-chara/palettes';
import { resolveAppearance } from 'ffxiv-chara/appearance';

const appearance = await resolveAppearance(inspection, {
  palettes: createDefaultPaletteProvider(),
});
const hair = appearance.slots.hair;
// creatorHex, shaderHex, extendedHex, interpretation, displayHex, and issues
```

These imports are available to a local consumer of the packed package; there is no public npm installation yet. Reading, inspection, bundled palette lookup, and appearance interpretation perform no network or storage operations. Main-entry imports exclude optional code/data; palette tables load only when requested. Embedded image fields are omitted; all remaining stored values are untrusted data.

The local sample checker accepts `--appearance` to include aggregate swatch results. It never copies samples or records per-character values. Regeneration from the maintainer-supplied `human.cmp` exactly matches all four committed palette tables; source hashes and the maintainer-confirmed game version 7.57 are recorded.

See [API and limits](docs/api.md), [compatibility evidence](docs/compatibility.md), [source/data provenance](docs/data-provenance.md), [security requirements](docs/security/THREAT_MODEL.md), and [implementation progress](docs/implementation-progress.md). The [MVP plan](docs/plans/2026-10-19-chara-library-mvp.md) retains the full roadmap.
