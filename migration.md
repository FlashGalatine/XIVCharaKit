# Future consumer migration

The standalone package and reference demo are implemented here. Migrating XIV Dye Tools applications remains a separately authorized follow-up; no existing application is changed by this repository's implementation.

## Try a local artifact

Run `pnpm test:package` to build and validate `.superpowers/package-smoke/xivcharakit-0.0.0.tgz`. A fresh local consumer can install that tarball with `pnpm add <absolute-tarball-path>`; `xivcharakit` is the selected name, but no public npm package has been published.

```ts
import { readChara, inspectChara } from 'xivcharakit';
import { createDefaultPaletteProvider } from 'xivcharakit/palettes';
import { resolveAppearance } from 'xivcharakit/appearance';
import { getDyeName } from 'xivcharakit/dyes';
import { createXivapiResolver } from 'xivcharakit/xivapi';

const inspection = inspectChara(readChara('{"LEyeColor":0}'));
const appearance = await resolveAppearance(inspection, {
  palettes: createDefaultPaletteProvider(),
});
const dye = getDyeName(3); // Goobbue Grey
// Only call the resolver after an explicit host action, with validated model IDs.
const resolver = createXivapiResolver();
```

See [API semantics](docs/api.md) and [candidate resolution](docs/xivapi.md) before adapting a host. An empty or incomplete lookup is not always a definitive item absence, and matching models do not identify the original inventory item. Missing fields, nulls, valid zero and invalid values remain distinct. The library does not repair the source document.

## Host responsibilities

- Preserve each host's admission policy. The library's default is 8 MiB; adopting it must not silently replace XIV Dye Tools' existing 8 KiB host limit.
- Keep session state, authentication, localization, themes, collections, community submission, acquisition/regional enrichment and caches in their current hosts. Do not create a dependency cycle through `@xivdyetools/core`.
- Retain published core API compatibility until an explicit semver/migration decision. This package provides inspection, not editing or writing.
- Pass only validated worn model identifiers and optional facewear IDs to lookup. Never forward the source document, nickname/author, file name, appearance or dyes.
- Enforce worker/process isolation, concurrency limits, safe rendering and cancellation in the host. The synchronous library is not a hard CPU or memory sandbox.
- Run fixture parity and affected web/bot integration checks, review intentional color/partial-document policy differences, and handle every candidate/failure status before replacing a consumer.

Source/data notices, licensing, package identity and production release paths must be resolved before distribution. No package publication, app deployment, migration or removal of old APIs is authorized by these notes.
