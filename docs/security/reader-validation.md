# Reader foundation validation

Recorded 2026-10-19 on Windows x64, Node v22.21.0, pnpm 10.27.0. These measurements describe this development environment, not performance guarantees or security certification. Browser/Worker/workerd and demo egress/hosting gates remain pending.

The final suite contains 122 tests across reader, inspection, model arithmetic, and deterministic JSON compatibility. Two property cases exercise 2,000 generated valid documents and 2,000 seeded syntax mutations. The reader and inspection/model cases were first run against explicit unimplemented exports and failed behaviorally (53 and 64 failures respectively). Independent review added three failing regressions, now fixed: omitted image subtrees cannot expose descendant keys through metadata, and the public equipment-slot tuple cannot be mutated to change inspection/model admission. The full suite passes. The tests include adversarial escaped duplicates, numeric overflow, structural/key/string limits, prototype-shaped objects, embedded-image omission, and field-presence semantics.

## Synthetic resource probes

`pnpm benchmark` runs each synthetic case in an isolated child process with a 10-second termination deadline. Timing is one cold observation. Heap deltas are sampled immediately before/after reading, not peak heap. Process peak RSS includes runtime, tooling, and input allocation. The large-image input is supplied as a JavaScript string, so V8 may flatten the caller's existing string during scanning even though the image scalar is skipped. These probes do not prove an exact browser memory bound.

| Case | Input bytes | Result | Time, ms | Sampled heap delta, bytes | Process peak RSS, KiB |
| --- | ---: | --- | ---: | ---: | ---: |
| Image at the default byte limit | 8,388,608 | accepted, payload omitted | 85.24 | 8,432,824 | 81,388 |
| Array at the default node limit | 200,011 | accepted | 46.85 | 7,279,040 | 91,148 |
| Object near the node limit | 538,878 | accepted | 66.51 | 8,664,664 | 107,156 |
| Excessive nesting | 87 | MAX_DEPTH | 1.25 | 88,424 | 73,472 |
| Excessive array nodes | 200,021 | MAX_NODES | 43.81 | 7,937,120 | 91,224 |

Private corpus aggregate evidence is in [compatibility.md](../compatibility.md#local-corpus-check). All 58 incomplete equipment records had all required model lanes absent in the stored object; no missing lane was substituted with zero. No private field values or file identities were logged.

## Distribution and development checks

The locally packed main entry has 10 allowlisted files: package metadata, bundled ESM, and declarations. JavaScript, TypeScript without ambient types, and Node Worker consumers imported the extracted package with a fetch function that throws on use. The package has zero runtime dependencies. Fixture hashes/identity expectations, strict type checks, linting, a frozen offline installation, and the development build pass.

`pnpm audit --json` reported zero known vulnerabilities at all severities on this date for the locked development dependency graph. This is a scanner observation, not proof that the dependencies are safe. Install scripts are restricted to esbuild in `pnpm-workspace.yaml`. There is no release workflow or publishing authority. Source maps, private fixtures, game files, palettes and network clients are absent from the packed artifact.

## Remaining gates

SEC-01 still needs browser/representative server concurrency evidence; SEC-02 will gain more producer-specific ground truth as reviewed public fixtures become available. Tasks 3–8 must satisfy the rest of the threat model, including palettes, response/cache bounds, explicit lookup privacy, safe rendering, stale-result handling, installed browser/workerd checks, supply-chain CI, a verified reporting channel, and actual hosting response headers. No package release or deployment has been performed.
