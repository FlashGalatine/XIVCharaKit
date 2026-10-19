# ffxiv-chara

A TypeScript library in development for reading and inspecting Final Fantasy XIV `.chara` files used by Anamnesis, Ktisis, and Brio.

**Status: reader foundation implemented.** Bounded reading, typed inspection, model keys, synthetic fixtures, and a development toolchain are available. The package is private at version 0.0.0 while publication identity and licensing remain undecided.

The full MVP includes:

- Typed inspection of character appearance, equipment, dye channels, and facewear.
- Appearance swatches backed by versioned creator and shader palettes.
- Optional XIVAPI equipment resolution with matching candidates and explicit failure states.
- A small website demonstrating the library's public API with local files and anonymized examples.

Palette data, appearance swatches, XIVAPI resolution, and the demo website are upcoming milestones. Editing and writing `.chara` files are deferred to a later version. No package has been published and no demo has been deployed.

## Develop locally

Use Node 22.21.0 and pnpm 10.27.0 (pinned in the repository).

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm type-check
pnpm lint
pnpm verify-fixtures
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

This import is available to a local consumer of the packed package; there is no public npm installation yet. Reading and inspection perform no network or storage operations. Embedded image fields are omitted; all remaining stored values are untrusted data.

See [API and limits](docs/api.md), [compatibility evidence](docs/compatibility.md), [source/data provenance](docs/data-provenance.md), [security requirements](docs/security/THREAT_MODEL.md), and [implementation progress](docs/implementation-progress.md). The [MVP plan](docs/plans/2026-10-19-chara-library-mvp.md) retains the full roadmap.
