# Reader and inspection compatibility

The reader foundation reads and inspects JSON `.chara` documents. Optional palette and appearance entries now interpret source-labelled swatches without changing the stored evidence; the main reader/inspection entry still does not load palettes or resolve items. Producer names are untrusted metadata. A supported character field is required; a type label alone and pose-only files are rejected. Recognized fields may be null, malformed, or missing in selective exports; inspection reports those states independently.

## Reviewed format snapshots

Sources were refreshed on **2026-10-22** through the official GitHub release APIs and release-tag/default-branch sources. These are format references, not producer binaries run by this project. Source hashes and release commits are recorded in [the fixture manifest](../fixtures/manifest.json); no upstream implementation is included. Four previously supplied real default exports remain test-only fixtures with permission; their exact application versions are unconfirmed. See [producer fixture validation](producer-fixture-validation.md).

| Producer | Latest stable release | Default-branch source commit | Format source |
| --- | --- | --- | --- |
| Anamnesis | [v7.57.0.3](https://github.com/imchillin/Anamnesis/releases/tag/v7.57.0.3), release/source `3d635757758ea9bd4e6d6d515cd6724bfabaa299` | `3d635757758ea9bd4e6d6d515cd6724bfabaa299` | [CharacterFile.cs](https://github.com/imchillin/Anamnesis/blob/3d635757758ea9bd4e6d6d515cd6724bfabaa299/Anamnesis/Files/CharacterFile.cs), [glasses converter](https://github.com/imchillin/Anamnesis/blob/3d635757758ea9bd4e6d6d515cd6724bfabaa299/Anamnesis/Serialization/Converters/GlassesSaveConverter.cs), [customization enums](https://github.com/imchillin/Anamnesis/blob/3d635757758ea9bd4e6d6d515cd6724bfabaa299/Anamnesis/Memory/ActorCustomizeMemory.cs) |
| Ktisis | [v0.4.1.2](https://github.com/ktisis-tools/Ktisis/releases/tag/v0.4.1.2), release `6f0fcf04fef28119d00645e253e6fbe3eb65d337` | `551bb23f5726ecffd1426ee3b540caf34feab18a` | [CharaFile.cs](https://github.com/ktisis-tools/Ktisis/blob/551bb23f5726ecffd1426ee3b540caf34feab18a/Ktisis/Data/Files/CharaFile.cs) |
| Brio | [v0.8.0.12](https://github.com/Etheirys/Brio/releases/tag/v0.8.0.12), release `b510c82f60dd5cd0d85b64ef88e33878a6ef496a` | `3f6f8e174ea447916c3ea4b86fdbedf56689f9c1` | [AnamnesisCharaFile.cs](https://github.com/Etheirys/Brio/blob/3f6f8e174ea447916c3ea4b86fdbedf56689f9c1/Brio/Files/AnamnesisCharaFile.cs) |

The listed export definitions are byte-identical to the previous 2026-10-19 references. Serializer settings and relevant vector/color converters were also compared with those previous commits: Anamnesis `SerializerService` and vector/color converters; Ktisis `JsonFile`, `JsonFileSerializer` and numeric converters; Brio `JsonSerializer`, `JsonDocumentBase` and actor enums. The reviewed release-tag and default-branch files match. Their field names/types, save modes, enum declarations, version markers and serialization behavior require no additional format revision adoption in this change. Ktisis still declares its own `CurrentVersion = 1`; this is not a shared revision number for all three producers.

This is a source comparison, not new testing of these producer binaries or export modes. No newer prerelease appeared after the latest stable release in the recent official release listings checked. Existing real-export fixtures retain their recorded provenance; regression tests for the alias below use authored input. Additional binary or export behavior remains unverified.

### Legacy `Helion` alias

The beta.3 candidate accepts the exact tribe spelling `Helion` as an alias for canonical `Helions` (tribe ID 13), preserving `raw: "Helion"` and the original document. Canonical race becomes Hrothgar, so existing skin/hair palettes and fur-pattern interpretation work through the normalized tribe. Canonical `Helions`, numeric tribe IDs and case-sensitive unknown-value handling are unchanged.

This alias preserves a legacy spelling already supported by XIV Dye Tools; it does not claim that the latest producers export it or introduce a new `.chara` revision. Published `0.1.0-beta.2` does not contain the fix. Publish and verify beta.3 before adopting that exact version in XIV Dye Tools.

## Field and presence matrix

Field names are case-sensitive, except the decoded `Base64Image` key is discarded case-insensitively at every depth. Known field normalization uses this matrix regardless of the declared producer.

| Group | Fields / shapes | Interpretation |
| --- | --- | --- |
| Metadata | `TypeName`, `$type`, `FileExtension`, `FileVersion`, `Author`, `Description`, `Version`, `Nickname`, `SaveMode`, `ObjectKind` | Stored strings; version/save/object-kind fields also accept unsigned 32-bit integers. No type instantiation, save-section filtering, or producer dispatch. Unknown save flag names remain stored evidence. |
| Identity | `Race`, `Tribe`, `Gender`, `Age`, `ModelType` | Known enum names or numeric IDs; `Lalafel`, `Miqote`, and `AuRa` have canonical race aliases. Legacy tribe `Helion` normalizes to `Helions` in the beta.3 candidate; raw evidence is preserved. Supported Tribe determines canonical race; absent/null Tribe permits Race fallback, an unsupported/invalid Tribe does not. Declared Race remains independently visible. Age IDs 0/1/3/4 mean None/Normal/Old/Young. ModelType is uint32. |
| Byte customization | `Height`, `Head`, `Hair`, `Skintone`, `REyeColor`, `HairTone`, `Highlights`, `LimbalEyes`, `Eyebrows`, `LEyeColor`, `Eyes`, `Nose`, `Jaw`, `Mouth`, `LipsToneFurPattern`, `EarMuscleTailSize`, `TailEarsType`, `Bust`, `FacePaint`, `FacePaintColor` | Integers 0–255; no palette interpretation or bit masking. |
| Customization flags | `EnableHighlights`, `FacialFeatures` | Strict boolean; facial features accept a byte or known comma-separated enum names. |
| Extended colors | `SkinColor`, `SkinGloss`, `LeftEyeColor`, `RightEyeColor`, `LimbalRingColor`, `HairColor`, `HairGloss`, `HairHighlight`, `MouthColor` | Finite three-component vectors, four for mouth: comma-separated decimal strings, arrays, RGB(A) or XYZ(W) records. Stored source shape is retained. Components are not gamma converted, clamped, swapped, or declared active. Object/array shapes are admitted extensions; exact converter coverage remains a future compatibility gate. |
| Extended controls | `IsExtendedAppearanceValid`, `BustScale`, `Transparency`, `MuscleTone`, `HeightMultiplier` | Strict boolean, finite three-component vector, or finite number respectively. Missing validity flags stay absent. |
| Equipment | `MainHand`, `OffHand`, `HeadGear`, `Body`, `Hands`, `Legs`, `Feet`, `Ears`, `Neck`, `Wrists`, `LeftRing`, `RightRing` | Explicit slot records with `ModelBase`, `ModelVariant`, and weapon `ModelSet`. Lanes are uint16. Missing/null lanes are incomplete; they never default to zero. All-zero valid models are empty. Weapons with a positive set or base are worn. |
| Dyes | Per-slot `DyeId`, `DyeId2` | Independent uint16 evidence, including zero. Wider acceptance accommodates the Ktisis weapon shape; individual producers can impose narrower limits. A dye error does not discard a valid model. |
| Facewear | `Glasses: number` or `Glasses: { GlassesId: number }` | uint16; zero remains valid. Missing/invalid nested IDs never default to zero. |
| Unknown fields | Any other admitted JSON values | Preserved as recursively inert null-prototype records; unsupported top-level fields have bounded diagnostics. No configuration merging or executable content. |
| Images | `Base64Image` at any depth | Presence/type/path metadata only; payload omitted, without base64 decoding or image rendering. Non-string/non-null image fields are flagged and still structurally checked. |

Every inspected field has state `absent`, `null`, `valid`, `invalid`, or `unsupported`, optional raw evidence, and a value only when valid. Empty strings, false, and zero remain distinct. Equipment separately reports absent/null/invalid/empty/worn. Inspection retains the document by reference and does not mutate it; callers must treat shared evidence as untrusted read-only data.

Unknown fields are preserved without promising semantics for every historical/future producer, modded actor, producer-specific extra field, or alternate enum spelling. There is no claim that an admitted synthetic fixture was exported by the named application.

## Local corpus check

The maintainer supplied a private sample folder for read-only testing. On 2026-10-19, all 1,093 top-level `.chara` files were admitted and inspected: 1,837–3,128,021 bytes, 5,864,432 total bytes. There were no invalid/unsupported identity, customization, extended-color, or facewear values. The inspection reported 10,901 worn slots, 58 incomplete model records, and 99 unsupported-field diagnostics. Image-key presence was reported for 94 files; this count includes null/empty image fields, not only nonempty images.

These are aggregate compatibility observations, not independently reviewed expected values for each real character. No private samples, file names, producer metadata, images, or per-character results are committed. Reproduce locally with `pnpm exec tsx scripts/check-corpus.ts <sample-directory>`; the script prints aggregate counts only and performs no network I/O. Synthetic fixture hashes and hand-reviewed identity/facewear expectations use `pnpm verify-fixtures`.

## Pending compatibility gates

- Real producer-generated fixtures with explicit redistribution rights and independently reviewed complete expectations. See the [fixture validation checklist](producer-fixture-validation.md) for supported export modes and review requirements; purely equipment-only producer exports are not required.
- Broader independent visual/producer swatch expectations; real-source regeneration now matches the baseline exactly. See [appearance validation](security/appearance-validation.md) for implemented Tasks 3–4 and corpus observations.
- Additional browser engines/runtime versions beyond the [installed-package and demo matrix](security/distribution-validation.md). Chromium, module Web Worker, Node/Node Worker and local workerd now pass the pinned smoke cases; this does not establish exhaustive platform/version compatibility.
- npm publishing configuration before release; the maintainer elected to ship the bundled appearance palettes on 2026-10-21, as recorded in the [data review](data-redistribution-review.md#recorded-release-decision). Original code and original synthetic fixtures follow MIT, approved producer exports retain recorded permission, and dye names use optional API lookup. Separate game-derived rights notices remain applicable.

## Evercold color-picker follow-up

On 2026-10-21 the maintainer identified free color pickers for eyes, hair and skin as an anticipated Evercold change in 2027. This is a maintainer-supplied planning requirement, not verified support for a released game or producer format. It does not block the current beta or remove palette support for existing exports.

- Retain indexed appearance palettes for legacy documents and any future exports that still store palette indices.
- Review actual Anamnesis, Ktisis and Brio exports when available. Establish new field names, color encoding/ranges, presence and activation rules, and precedence when both indices and direct colors exist; do not assume the current extended-color fields are the new format.
- Add permissioned producer fixtures for eye, hair and skin free colors, including mixed legacy/new fields, and verify swatches against producer controls before claiming support.
- Keep stored values distinguishable from interpretation. Existing extended-color handling is useful infrastructure, but unknown future values must not be forced onto the nearest palette entry or given invented semantics.
