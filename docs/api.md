# Library API

The unpublished beta candidate exposes the main ESM entry plus optional `/palettes`, `/appearance`, `/dyes`, and [`/xivapi`](xivapi.md) entries. Reading, inspection, model arithmetic, bundled palette lookup, and appearance interpretation perform no I/O and have no runtime dependencies. The optional XIVAPI client performs identifier-only requests when called. Bundles target ES2022 and include TypeScript declarations. Installed-tarball consumers exercise all five entries in Node, Node Worker, Chromium, module Web Worker and local workerd; declarations compile outside the workspace. See [distribution evidence](security/distribution-validation.md) for pinned versions and coverage limits. Build metadata verifies that the main static dependency graph contains no optional modules or data. Palette JSON tables become lazy ESM chunks; dye names use optional cached API requests. Installed consumers do not require JSON import flags.

The optional [equipment resolution contract](xivapi.md#equipment-candidate-resolution) covers candidates, off-hands, facewear, cancellation, and upstream evidence.

## Cached dye names

`import { createDyeNameResolver } from 'xivcharakit/dyes'`

`createDyeNameResolver(options?: XivapiOptions): DyeNameResolver` creates an optional XIVAPI Stain client with a bounded in-memory cache by default. Construction/imports perform no I/O. Reuse the resolver across requests. `resolve(ids: readonly number[], options?: { signal?: AbortSignal }): Promise<LookupResult<StainRow>>` accepts at most 64 uint16 Stain row IDs, deduplicates/sorts them, and requests only localized name fields. Empty input returns a complete empty result without I/O. Invalid inputs throw before requests; these are Stain IDs, not consumable item IDs.

Rows contain `{ rowId, names }`, with trimmed plain-text names keyed by the requested languages (`en`, `ja`, `de`, `fr`; all four by default). Empty names are retained as empty strings. A missing row in a complete response means that ID was not returned for the reported upstream revision; a missing row in an incomplete/failed response does not establish absence. Hosts can label zero as `No dye` locally. The demo requests English names, retains raw IDs on failure, and distinguishes not requested, blank name, missing row and unavailable states.

Results include `status: complete | partial | unavailable | cancelled`, `version`, `schema` and bounded issues. The resolver uses the existing XIVAPI request validation, budgets, retries, per-request timeout, 30-second operation deadline, coalescing and independent subscriber cancellation. Its default cache has 128-entry/8-MiB limits and detached values, keyed by endpoint, canonical version/schema, selected language fields and the whole sorted ID batch. Complete nonempty responses live up to seven days; complete empty responses up to ten minutes. Partial/failing responses are not cached. Overlapping but different batches have distinct keys. Version aliases/schema discovery are memoized for ten minutes; pin identities when exact repeatability matters. Custom `fetch`/cache implementations are trusted host code.

The low-level `createXivapiClient().getStains(ids, options)` offers the same lookup through `/xivapi`, using an optional host-supplied cache. The `/dyes` convenience factory supplies the default memory cache. The old synchronous `getDyeName`, frozen `DYE_METADATA`, bundled JSON snapshot and CSV generator/verification commands have been removed before the first publication. No runtime dependency was added.

## Read

`readChara(input: string | Uint8Array, options?: ReadOptions): CharaDocument`

Byte input uses fatal UTF-8 decoding. One initial BOM is accepted and included in byte accounting. For string input the UTF-8 size is counted without allocating an encoded copy; unpaired UTF-16 surrogates count as the UTF-8 replacement sequence, consistent with TextEncoder. JSON string escape sequences count toward their decoded UTF-16 length.

The parser enforces structure during parsing and constructs null-prototype records at every retained object. Duplicate decoded keys in an object are rejected, including escaped equivalents. JSON numbers must be finite; integral results must be safe JavaScript integers. Other finite numbers use ordinary JavaScript precision, rather than retaining their original numeric spelling. A supported non-metadata field is required at the root. Top-level arrays/scalars, metadata-only objects, and pose-only objects are rejected.

The document includes `fields`, `hasEmbeddedImage`, bounded `embeddedImages` metadata, and bounded `issues`. Every decoded case-insensitive `Base64Image` key is omitted, including nested occurrences. Its value still consumes the byte/node/depth budgets; only a string immediately under this key is exempt from the ordinary string-length budget. String payloads are skipped without scalar decoding/allocation. Non-string image values are parsed with ordinary structural limits and discarded, with an invalid-type issue except for null. Metadata for descendants inside an already omitted image subtree is suppressed to avoid exposing payload keys. Arbitrary content under other keys is retained untrusted data, not automatically recognized as an image. The original caller input remains in caller-owned memory.

| Option | Default | Maximum host override |
| --- | ---: | ---: |
| `maxBytes` | 8,388,608 | 67,108,864 |
| `maxDepth` | 32 | 128 |
| `maxNodes` | 100,000 | 1,000,000 |
| `maxKeyLength` | 1,024 | 4,096 |
| `maxStringLength` | 65,536 | 1,048,576 |
| `maxIssues` | 64 | 64 |

Options must be finite positive integers no greater than the host ceilings. An explicit invalid option (including undefined/null/NaN/Infinity) is rejected. Absent options use defaults; unknown option keys have no effect. Root value depth is 1, every child value increments depth, every value/container counts one node, and every object property counts another node. Key/string lengths use decoded UTF-16 code units. Returned diagnostic paths joined by dots and messages are at most 256 code units. When diagnostics exceed the cap, the final entry is `ISSUES_TRUNCATED`. Image metadata is capped at `maxIssues`; issue truncation also indicates omitted image details.

`CharaInputError` has a fixed message and one of these `CharaErrorCode` values:

| Code | Meaning |
| --- | --- |
| `INPUT_TOO_LARGE` | UTF-8 bytes exceed the configured admission limit |
| `INVALID_UTF8` | Byte input cannot be decoded as UTF-8 |
| `INVALID_JSON` | Invalid JSON syntax |
| `NOT_CHARACTER` | No recognized non-metadata character fields, or a non-object root |
| `MAX_DEPTH`, `MAX_NODES` | Structural budget exceeded |
| `MAX_KEY_LENGTH`, `MAX_STRING_LENGTH` | Decoded scalar budget exceeded |
| `DUPLICATE_KEY` | Duplicate decoded object property |
| `INVALID_NUMBER` | Non-finite or unsafe integral number |
| `INVALID_OPTIONS`, `INVALID_INPUT` | Invalid limits or input type |
| `INVALID_MODEL` | Invalid direct `modelKey` input |

These fixed errors never include native parse excerpts or supplied values. Synchronous execution is bounded, but a Promise timeout cannot interrupt it. Browser consumers should perform work in a module Web Worker and terminate superseded/overdue jobs. Servers must choose their own isolation, concurrency and request admission limits. Higher overrides can increase latency/memory substantially. The existing XIV Dye Tools 8 KiB host policy remains a separate integration choice.

## Inspect

`inspectChara(document: CharaDocument): CharaInspection`

Supply a document produced by `readChara`. The result retains that document and supplies typed `identity`, `metadata`, `appearance`, `extended`, twelve `equipment` slots, `facewear`, and at most 64 issues. Normalization leaves source fields unchanged. Callers should treat shared raw evidence as read-only; the result is not an immutable independent snapshot.

`Field<T>` distinguishes `absent`, `null`, `valid`, `invalid`, and `unsupported`. Absent fields have no raw/value properties, null fields have `raw: null`, valid fields retain raw evidence and add `value`, and invalid/unsupported fields retain raw evidence without a normalized value. There is no truthiness-based defaulting. See the [field matrix](compatibility.md#field-and-presence-matrix) for exact normalization and supported extensions.

Identity keeps declared Race and Tribe independently, with `canonicalRace` and `raceSource` describing the supported mapping. A bad color does not discard valid equipment. Extended color vectors remain exact numeric components, without palette matching, eye swapping, gamma conversion, activity inference, or compositing.

Equipment entries expose `stored`, `status`, `model`, `set`, `base`, `variant`, `dye1`, and `dye2`. Status is `absent | null | invalid | empty | worn`. All required model lanes must be present and valid before a model is returned. Dyes are independent; missing/invalid dyes cannot invalidate a supported model. Empty model lanes and zero stains remain valid evidence. Facewear supports legacy numeric and current object representations and preserves the original shape in `raw`.

Inspection issues use stable codes `INVALID_FIELD`, `UNSUPPORTED_VALUE`, `INCOMPLETE_MODEL`, and `RACE_TRIBE_MISMATCH`, plus reader issues `IMAGE_OMITTED`, `INVALID_IMAGE_TYPE`, `UNSUPPORTED_FIELD`, and `ISSUES_TRUNCATED`. Each has a fixed bounded message, severity, and structured path; stored raw values are never formatted into diagnostics.

## Model identifiers

`modelKey(model: EquipmentModel): string`

Equipment models carry a supported slot, uint16 `base` and `variant`, plus uint16 `set` for `MainHand`/`OffHand`. Direct calls validate every lane and slot before packing. Armor/accessory models must omit `set`; weapons must provide it. Fractional, negative, non-finite, string-valued, missing, and oversized lanes throw `INVALID_MODEL` instead of being floored or defaulted.

Armor packs `base + variant × 65536`. Weapons pack `set + base × 65536 + variant × 4294967296` using internal bigint arithmetic. Results are decimal strings and inspections remain JSON-serializable. These identifiers represent model identity, not a unique inventory item.

`EquipmentResolveInput` defines the input to `createXivapiResolver().resolve` as `{ models: readonly EquipmentModel[], glassesId?: number }`. The optional [`xivcharakit/xivapi`](xivapi.md#equipment-candidate-resolution) export implements this resolver. Its input has no character metadata, appearance, or stain fields.

## Palette provider (`xivcharakit/palettes`)

`createDefaultPaletteProvider(): PaletteProvider`

`PaletteProvider.getColor(request: PaletteRequest): Promise<PaletteColor | null>`

Requests name `table: 'creator' | 'shader'`, a primitive string `palette`, a zero-based in-table `index`, and optionally `tribe` and `gender: 'Masculine' | 'Feminine'`. Race palettes require one of the sixteen supported tribe names and a gender. Validated scalar coordinates are captured before any asynchronous work, so reusing/mutating the caller's request cannot alter an in-flight lookup. The four table groups load independently on first lookup; concurrent loads coalesce and failed loads can retry. Invalid coordinates return null before loading, without property-key coercion. No arbitrary request field can choose an import path.

| Palette | Creator | Shader | Index range |
| --- | --- | --- | --- |
| `eyes`, `highlights`, `features` | yes | yes | 0–191 |
| `lipsDark` | yes | yes | 0–95 |
| `lipsLight`, `facePaintDark`, `facePaintLight` | yes | unavailable in this baseline | 0–95 |
| `skin`, `hair` | yes | yes | 0–191, tribe/gender required |

Colors include the request coordinates, canonical uppercase hex, RGB tuple, and `datasetVersion`. Returned colors are detached; changing one cannot poison later lookups. `PALETTE_METADATA` and the bundled provider's `metadata` are deeply frozen, with dataset/source schema versions, `gameVersion: "7.57"` from the maintainer-confirmed source, source hashes and artifact hashes/counts. The metadata contract permits null when a source version is unknown. Dataset schema 1 and upstream schema 2.0.0 do not establish a game patch.

Loading/validation failure throws `PaletteDataError` with code `PALETTE_LOAD_FAILED` and a fixed message; native loader errors are not exposed. A host can implement `PaletteProvider` with its own `getColor` and optional metadata instead. Injected provider functions execute with host privileges and can have their own side effects; they are trusted JavaScript, not sandboxed data.

See [data provenance and regeneration](data-provenance.md#palette-baseline-and-regeneration) for source rights, explicit local-file tooling, and the verified supplied-source regeneration result.

## Appearance interpretation (`xivcharakit/appearance`)

`resolveAppearance(inspection: CharaInspection, options: AppearanceOptions): Promise<AppearanceInspection>`

`options.palettes` supplies a `PaletteProvider`; there is no implicit default provider import or network lookup. The result has eight keyed slots (`leftEye`, `rightEye`, `hair`, `highlights`, `skin`, `limbal`, `lip`, `facePaint`), the actual policy, optional provider metadata, bounded issues, eye-pair corrections, and `eyesShareIndex`. Each slot retains `storedIndex` and `storedExtended` evidence, separate creator/shader/original extended colors, the effective interpreted extended color, activity state, interpretation/reason, and a nullable display color. Original stored fields are never rewritten, including on historical correction. Gloss, bust-scale, and other extended controls remain available from inspection; these eight swatches do not interpret them as additional colors.

| Interpretation | Meaning |
| --- | --- |
| `palette` | Creator swatch selected; extended data is absent/inactive/ambiguous or agrees with the shader reference |
| `offGrid` | A declared live extended color differs from the shader reference by more than the threshold |
| `extendedOnly` | A declared live extended color has no applicable stored palette index |
| `inactive` | An explicit control, fur-only index, or live zero-opacity lip disables this swatch |
| `unresolved` | Missing/invalid context or reference data prevents a substantiated display choice |

`active` is independent of availability: false means explicitly disabled, null means a required activity control is unknown. Missing highlight and face-paint controls remain unknown. `displayHex` is null for inactive/unresolved slots. Preview evidence is not a promise of exact in-game rendering or mod behavior.

Policy version `1.0.0` uses gamma-2 decoding (`sqrt(clamp(channel, 0, 1)) × 255`, rounded), while keeping exact input components. Clipped RGB or opacity gets a bounded issue. Extended values can influence the selected color/opacity only when `IsExtendedAppearanceValid` is valid and true. A complete seven-vector all-zero legacy block is marked ambiguous and cannot override the index; one black vector in a partial/live block remains valid.

Live extended color is compared against the shader table using CIEDE2000, rather than against the creator swatch. A distance greater than 6 selects off-grid extended color; otherwise the creator swatch is displayed. Both dark and light lips use `lipsDark` shader reference at the in-sheet index. A missing shader reference leaves the result unresolved, without pretending a creator comparison is equivalent.

Lip/face-paint indices 0–95 use dark tables, 128–223 use light tables with 128 subtracted, and other byte values remain unresolved. Hrothgar's `LipsToneFurPattern` is a fur enum, not a lip color index; a live mouth float can still supply a lip swatch. Unknown race leaves a present lip/fur index unresolved. Live lip opacity at/below zero disables lip color; inactive extended opacity never disables the palette index. Positive live opacity produces a labelled `lipComposite` only when both selected skin/lip colors exist, using linear-sRGB compositing. Absent opacity remains null, not zero or an invented default.

The historical eye rule requires two different supported eye indices, live extended colors, and both shader references. Both extended colors must match the opposite shader within 1 CIEDE2000 while neither matches its own. Correction changes only `effectiveExtendedHex`, records `historicalEyePairSwap` on the slots and a `HISTORICAL_EYE_PAIR_SWAP` entry; `extendedHex` and raw fields remain original. No producer label selects this behavior.

`options.policy` may override `offGridDeltaE`, `eyeMatchDeltaE`, and `historicalEyeCorrection`. Thresholds must be finite numbers 0–100, with eye tolerance no greater than off-grid tolerance; the correction control must be boolean. Invalid options throw `AppearanceInputError` with fixed code `INVALID_APPEARANCE_OPTIONS` before provider work. Defaults are exported as frozen `DEFAULT_APPEARANCE_POLICY`; the returned policy records all actual values.

Provider responses must have canonical hex and the requested coordinate association. Provider failures produce fixed `PALETTE_UNAVAILABLE` issues; invalid associations/colors produce `INVALID_PALETTE_RESPONSE`. Other interpretation issues include `AMBIGUOUS_ZERO_BLOCK`, `EXTENDED_CLAMPED`, `ALPHA_CLAMPED`, `PALETTE_INDEX_OUT_OF_RANGE`, `MISSING_PALETTE_CONTEXT`, and `MISSING_SHADER_REFERENCE`. At most 64 bounded issues are returned. Native errors and provider payloads are never quoted.
