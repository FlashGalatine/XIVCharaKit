# Contributing

Use Node 22.21.0 and pnpm 10.27.0, as pinned in the repository. The library and demo remain private development packages. Do not publish or deploy as part of an ordinary contribution.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm build
pnpm type-check
pnpm lint
pnpm verify-fixtures
pnpm verify-palettes
pnpm verify-dyes
pnpm test
pnpm audit
pnpm test:package
```

On Linux, `pnpm exec playwright install --with-deps chromium` installs the browser's OS dependencies too. Package checks need local process and loopback socket access. Build before type checking a fresh checkout. Keep `pnpm test:package` last when preparing artifacts: browser tests rebuild the demo, so the final package gate rebuilds and scans the exact outputs to retain.

`pnpm test` runs tooling policies, library units and the production-preview Chromium scenarios. `pnpm test:package` packs the library and creates a temporary consumer outside the workspace. It compiles declarations and runs shared checks in Node, Node Worker, Chromium, a module Web Worker, and Wrangler's local workerd. It removes that consumer after success or failure. Test output stays under ignored `.superpowers/` paths. See [distribution validation](docs/security/distribution-validation.md) for the limits of these checks.

All ordinary tests use synthetic inputs and injected API responses. Do not run adversarial/load tests against XIVAPI. The separate opt-in live browser check is documented in [the demo guide](docs/demo.md); it is disabled in CI. Do not commit private `.chara` exports, embedded images, raw `human.cmp`, local source paths, credentials, or copied data without provenance and redistribution review. Fixture producer labels describe field shapes unless an actual producer export and expected values have been reviewed.

Use public library exports in consumers. Keep optional modules out of the main static import graph, keep the package free of runtime dependencies, and preserve stored evidence. New public entries need declaration and runtime-consumer coverage. Changes to generated data require explicit source input, hashes, reviewed diffs and corresponding notices; ordinary builds must not fetch game data.

CI runs the same local/mocked gates on Ubuntu and Windows, with immutable action revisions and read-only repository permissions. It uploads only the checked package tarball and static demo output. It has no release, deployment or production secret configuration. CI completion does not authorize distribution or migration of existing XIV Dye Tools consumers.
