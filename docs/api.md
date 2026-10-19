# Reader foundation API

The private development package exposes its main ESM entry only. `/appearance`, `/palettes`, and `/xivapi` will be added when their implementations are ready. Main-entry imports, reading, inspection, and model arithmetic perform no I/O and have no runtime dependencies. Bundles target ES2022 and include TypeScript declarations; installed JavaScript, TypeScript, and Node Worker consumers are checked locally. Browser/Web Worker/workerd validation is pending.

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

`EquipmentResolveInput` currently defines the future transport boundary as `{ models: readonly EquipmentModel[], glassesId?: number }`. No resolver implementation is exported yet. It has no character metadata, appearance, or stain fields.
