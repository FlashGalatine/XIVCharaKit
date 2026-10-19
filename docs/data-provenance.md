# Source and data provenance

The current package contains independently implemented reader/inspection code and synthetic examples. It contains no raw game files, palette tables, item tables, upstream implementation copies, or private sample files. Package identity is provisional, version 0.0.0 is private, and `UNLICENSED` is an explicit release hold while the maintainer chooses the code license. No public release has occurred.

Format references and source SHA-256 values are in [fixtures/manifest.json](../fixtures/manifest.json), with human-readable coverage in [compatibility.md](compatibility.md). Ktisis and Brio advertise GPL-3.0 repository licenses; Anamnesis's reviewed format files carry MIT notices. Those references inform field contracts; this does not relicense upstream material or establish a license for this project's code. Review notices if future implementation copies upstream code.

The private sample folder is an opt-in test input, never a build input. The local corpus checker logs only aggregate counts. Synthetic fixtures use invented metadata and combinations of public format fields, without embedded images or copied character data. Fixture release rights must be settled with the project license; shape compatibility is not producer-export verification.

## Future palette baseline

The planned extraction baseline remains XIV Dye Tools commit `b98c8584a85f5dc50b4b4392c508cc627ef004d6`, freshly verified as the public default-branch head on 2026-10-19. Its [palette index](https://github.com/FlashGalatine/xivdyetools/blob/b98c8584a85f5dc50b4b4392c508cc627ef004d6/packages/core/src/data/character_colors/index.json) SHA-256 is `026d62b28c72661cb4646fb7647dd1ba4ef6ea777f637ecdc6e8fc3e89366802`.

The index's `meta.version: 2.0.0` is a data schema version; the actual game revision is unknown. Creator and shader datasets are separate. The index alone does not establish all table hashes or regeneration parity. Task 3 must inventory and hash the complete generated dataset, review source/data notices, and accept an explicit maintainer-local `human.cmp` input for regeneration. Ordinary builds must never discover a game installation or vendor that file.
