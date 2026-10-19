# Source and data provenance

The current package contains reader/inspection code, synthetic examples, and four repacked generated palette datasets. It contains no raw game files, item tables, or private sample files. The palette generator layout and appearance policy are adapted from the MIT-licensed XIV Dye Tools source; [third-party notices](../THIRD_PARTY_NOTICES.md) retain the code notice separately from game-derived data rights. Package identity is provisional, version 0.0.0 is private, and `UNLICENSED` remains a release hold for the project's original code. No public release has occurred.

Format references and source SHA-256 values are in [fixtures/manifest.json](../fixtures/manifest.json), with human-readable coverage in [compatibility.md](compatibility.md). Ktisis and Brio advertise GPL-3.0 repository licenses; Anamnesis's reviewed format files carry MIT notices. Those references inform field contracts; this does not relicense upstream material or establish a license for this project's code. Review notices if future implementation copies upstream code.

The private sample folder is an opt-in test input, never a build input. The local corpus checker logs only aggregate counts. Synthetic fixtures use invented metadata and combinations of public format fields, without embedded images or copied character data. Fixture release rights must be settled with the project license; shape compatibility is not producer-export verification.

## Palette baseline and regeneration

The planned extraction baseline remains XIV Dye Tools commit `b98c8584a85f5dc50b4b4392c508cc627ef004d6`, freshly verified as the public default-branch head on 2026-10-19. Its [palette index](https://github.com/FlashGalatine/xivdyetools/blob/b98c8584a85f5dc50b4b4392c508cc627ef004d6/packages/core/src/data/character_colors/index.json) SHA-256 is `026d62b28c72661cb4646fb7647dd1ba4ef6ea777f637ecdc6e8fc3e89366802`.

The index's `meta.version: 2.0.0` is a data schema version; the actual game revision is unknown (`gameVersion: null`). [Palette metadata](../packages/chara/src/palettes/metadata.json) records all twelve source file byte hashes and four output hashes/counts. Downloaded sources were also checked against their pinned Git blob hashes. Creator inputs were checked for index order and RGB/hex agreement before dropping redundant RGB/index storage. Output hashes cover UTF-8 `JSON.stringify(parsed JSON)`, independently of whitespace. The dataset contains 13,248 creator colors and 12,960 shader colors, 26,208 total.

Creator palettes contain eyes, highlights, features, dark/light lips and face paint, plus tribe/gender skin and hair. The available shader baseline contains eyes, highlights, features, dark lips, and skin/hair. Missing shader light-lip/face-paint tables are not fabricated. The appearance policy compares both light and dark lips to the documented dark shader entry; this is an interpretation rule, separate from the provider's literal table lookup.

The adapted generator source is `packages/core/scripts/build-character-colors.ts`, SHA-256 `95c451282940489ddcb98a10d90efe7df1345db1b94a4e8c092deabb8de3206c` at the pinned commit. The appearance resolver and shader helper source hashes are respectively `41463ce6068f7cb7421b7f92c46fbb56b92396dfb603f33a3950a1facaf41cc0` and `0353afc0edaf853dc7139a263429317310f248bff4276cbd6524925d5e456e2d`.

`pnpm verify-palettes` validates output hashes, table shapes/counts, and independently reviewed sample colors. Ordinary builds use the committed generated values and never discover a game installation or fetch data. To regenerate, supply a local extracted source explicitly:

```sh
pnpm exec tsx scripts/build-palettes.ts <explicit-human.cmp-path> --check
pnpm exec tsx scripts/build-palettes.ts <explicit-human.cmp-path> --dataset-version <new-version> [--game-version <verified-revision>]
pnpm verify-palettes
```

The generator checks file size/layout before reading, limits work to 16 MiB, writes fixed table/metadata paths, and records the source hash/byte length without its local path. `--check` reports derived hashes without changing files. Review the complete data diff and update reviewed samples for an intentional dataset change. An explicit game-version argument is a maintainer claim requiring evidence; it is not inferred from the file. No real `human.cmp` path has been provided, so real-file regeneration parity is unverified. Synthetic binary tests establish shared/clan/gender offsets, interface/shader separation, and interleaved shader-hair extraction only.
