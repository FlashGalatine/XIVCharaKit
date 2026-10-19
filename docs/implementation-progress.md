# Reader foundation implementation

Plan: `docs/plans/2026-10-19-chara-library-mvp.md`.
Implementation reopened by the maintainer on 2026-10-19.

This first milestone covers Task 0 evidence and Tasks 1–2 (reader and inspection).
Tasks 3–8 remain pending; publication, deployment, and XIV Dye Tools migration are separate scope.

## Decisions

- Execute inline on `codex/reader-foundation` in the existing clean checkout. No other checkout is modified.
- Keep the package private at version 0.0.0 with a provisional local name and `UNLICENSED` until the maintainer chooses publication identity and code licensing. No upstream implementation is copied.
- Use synthetic fixtures authored from independently documented field shapes; producer labels describe shape compatibility, not proof of a real producer export. After the maintainer supplied the local sample directory, test its 1,093 files read-only and record aggregates; no private samples or derived character values are copied into the repository.
- Adopt the threat model's reader budgets and token-skipping image policy. Use a bounded JSON parser; the earlier post-parse walk would not satisfy admission requirements.
- Extend fatal codes for duplicate keys, unsafe numbers, key/string bounds, and invalid options. Keep the original six codes.
- Optional appearance/palette/XIVAPI exports arrive with their implementations; do not expose empty placeholders.

## Shared interfaces

| Producer | Consumer | Contract |
| --- | --- | --- |
| Task 0 field inventory | Tasks 1–2 | Recognize supported non-metadata keys; preserve unknown data and field presence |
| Task 1 reader | Task 2 inspection | Null-prototype JSON records, image payload omitted, bounded issues |
| Task 2 models | Tasks 5–6 | Validated uint16 lanes; packed decimal strings; equipment-only resolver input |
| Task 2 appearance evidence | Tasks 3–4 | Exact stored indices/floats and extended-valid flags; no color inference |

## Evidence

- Baseline: clean checkout at `481786919b3eb49051d80cd2f296a99900bf74a0`; no existing product harness.
- Task 0 evidence: three upstream format snapshots pinned, field/presence matrix documented, five synthetic fixtures hashed with reviewed identity/facewear expectations, and palette-index provenance recorded. Full real-export ground truth, fixture redistribution rights, complete palette hashes and licensing remain pending.
- Task 1: implemented bounded reader with stable errors, structural admission during parsing, recursively inert records, image token skipping, and bounded metadata/diagnostics.
- Task 2: implemented typed field evidence, canonical identity, twelve equipment slots, independent stains, both facewear representations, exact extended components, and validated decimal model keys.
- Test-first evidence: 53 reader cases failed against the reader stub; 64 inspection/model cases failed against those stubs. Supplemental seeded JSON checks cover 4,000 generated cases. Three review regressions were separately observed failing before fixes. Final suite: 122 tests across four files, all passing.
- `pnpm type-check`, `pnpm lint`, `pnpm verify-fixtures`, `pnpm test:package`, and `pnpm install --offline --frozen-lockfile --ignore-scripts --store-dir .pnpm-store` pass. Tarball consumers cover installed JS/TS/Node Worker imports with zero I/O and no runtime dependencies; ten packed files pass an allowlist check.
- Local private corpus: 1,093/1,093 accepted, zero invalid/unsupported identity/customization/color/facewear fields, 58 incomplete gear records with every model lane absent. Warnings remain visible; this is not a full expected-value verification of every file.
- Synthetic resource probes and dependency audit: see [reader validation](security/reader-validation.md). The scanner reported no known vulnerabilities on 2026-10-19.

## Independent review and fixes

A fresh read-only reviewer inspected this milestone. No Critical issues were found. Both findings were reproduced, corrected, and checked with the full green suite:

- Suppress descendant image metadata/diagnostics inside already discarded image subtrees. The regression checks private payload keys in object and array shapes while retaining duplicate/structural validation.
- Freeze the public equipment-slot tuple at runtime. This was graded Important by the implementer because mutation otherwise changes direct model admission and inspection's required twelve slots. The regression prevents slot-list mutation and rechecks model admission/packing.

The reviewer set aside future Tasks 3–8, real-export fixture ground truth, forged JavaScript objects/getters/proxies, and lossless decimal-token storage. These boundaries stand: this milestone implements the reader-produced-document contract; raw precision uses documented JavaScript semantics, and the other work remains pending. No deferred code findings remain.

## Next milestone

Tasks 3–4: complete palette provenance and regeneration inputs, implement the lazy provider, then appearance interpretation with independent swatch expectations. The package remains private; no merge, push, publication, deployment, or existing-product migration was performed.
