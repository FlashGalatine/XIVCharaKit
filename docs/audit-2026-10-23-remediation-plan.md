# Remediation plan: code-review audit of 2026-10-23

**Source:** [audit-2026-10-23.md](audit-2026-10-23.md), the audit of `014c6a0` (106 findings: 2 high, 28 medium, 76 low; 8 verifier disputes resolved by the maintainer, see its §7). Plus one finding added during the fixes (N001, FacePaint mirror flag).

**Status basis:** 107 findings in all. Fixed in the working tree (uncommitted): F096, F092, N001. Partly fixed: F090 (warning only). Outstanding: 103. Superseded: 0. Not scheduled (register below): 5 ruled info or no-defect, 2 refuted, 22 unverified observations.

**Ordering:**
1. One deploy unit per wave, each ending in a named gate or release. Waves are the equivalent of the sprints in the XIV Dye Tools remediation plans.
2. Behaviour before evidence: wrong output on real input first (Wave 0, then 2-3), the tests that pin it after, so tests describe the corrected code.
3. Documents that misstate the current state go first because they are cheap and ship nothing (Wave 1); documents that describe new behaviour ride with the wave that changes it.
4. Test-only waves (7-10) ship nothing; they follow the behaviour waves and each new assertion must be shown to fail against the weakened control.
5. There is no P0. P1 is wrong output on valid input; P2 is degraded but contained (every medium, including security-gate test gaps); P3 is the rest.

## Wave overview

| Wave | Unit | Theme | H / M / L | Status |
|---|---|---|---|---|
| 0 | packages/chara (appearance) | Done in this session | 2 / 0 / 1 + N001 | ✅ done, uncommitted |
| 1 | docs only | Documents that misstate the current state | 0 / 1 / 7 | open |
| 2 | packages/chara (xivapi) | The client was written against doubles that are not the real API | 0 / 3 / 4 | open |
| 3 | packages/chara (reader, inspect, xivapi) | Cross-realm input, re-read values, label accuracy; then publish | 0 / 0 / 7 | open |
| 4 | repo tooling (scripts, test/, CI) | Release and verification tooling that can pass vacuously | 0 / 1 / 9 | open |
| 5 | apps/demo | State, focus and live-region fragility across re-renders | 0 / 2 / 6 | open |
| 6 | apps/demo (tests) | Evidence for the privacy and CSP gates (THREAT_MODEL SEC-03) | 0 / 4 / 4 | open |
| 7 | packages/chara (tests) | Reader and inspection guards that can be deleted unnoticed | 0 / 4 / 7 | open |
| 8 | packages/chara (tests) | Appearance maths and palette provider assertions | 0 / 6 / 9 | open |
| 9 | packages/chara (tests) | XIVAPI budgets, cache admission and resolver scope (SEC-05) | 0 / 3 / 11 | open |
| 10 | apps/demo (tests) | State-machine and UI behaviour tests | 0 / 2 / 6 | open |
| 11 | docs + fixtures manifest | Producer compatibility record and refresh method | 0 / 2 / 5 | open |

Severities are the verifiers' consensus; "Tier" follows the remediation-planner scale (P1 high, P2 medium, P3 low). IDs are defined in [the audit report](audit-2026-10-23.md), which carries the problem, failure scenario, evidence and fix for each.

## Wave 0 — packages/chara (appearance): Done in this session ✅ COMPLETED 2026-10-23 (working tree, uncommitted)

Fixed test-first in the working tree, **uncommitted**. Appearance policy is now `1.1.0` (unreleased).
- **F096:** bit `0x80` of `Mouth` now gates the lip (`lipDisabled`; unknown when `Mouth` is missing or invalid; Hrothgar ignores it; an unknown race is active only when the bit is set).
- **F090:** the eye-pair rule is unchanged and documented as covering current Brio output; a new `EYE_PAIRING_UNCONFIRMED` warning flags a one-sided crossed match. **Residual:** custom eye colors on Brio v0.7.2+ exports are still not swapped (see Open decisions).
- **F092:** corrections, per-eye swatches and lip state of the four real exports are pinned in tests.
- **N001 (not in the original catalog):** bit `0x80` of `FacePaint` is a mirror flag in Brio and Ktisis; `FacePaint` 128 (no paint) showed a face-paint swatch. Fixed the same way.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F096 | High · P1 | `packages/chara/src/appearance/resolve.ts:170` | Lip swatch is reported active even when the lip-colour flag (0x80) in the `Mouth` byte is clear | Fixed |
| F090 | High · P1 | `packages/chara/src/appearance/resolve.ts:38` | Brio v0.7.2+ stores each eye's extended colour crossed relative to `LEyeColor`/`REyeColor`; only the exact on-grid crossing is repaired | Partly fixed: warning only |
| F092 | Low · P3 | `packages/chara/test/producer-exports.test.ts:58` | No test pins the eye correction or per-eye output for the real Brio export | Fixed |
| N001 | Low · P3 | `packages/chara/src/appearance/resolve.ts` | `FacePaint` 128 (no paint, mirrored) is reported as paint present; bit `0x80` is a mirror flag in Brio and Ktisis | Fixed |

**Ends with:** Verified 2026-10-23: build, type-check, lint, `verify-fixtures`, `verify-palettes`, 55 tooling + 376 package + 24 demo tests, and `pnpm test:package` (with the Windows `tar`). Publishing is Wave 3.

## Wave 1 — docs only: Documents that misstate the current state

Cheap, no release, no code. **Anchor F075:** `SECURITY.md` accepts reports only for beta.1 and `main`, while npm `next` resolves to beta.3.
Check every claim against the code before editing (each finding names both locations); do not describe behaviour that Waves 2-3 are about to change.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F075 | Medium · P2 | `SECURITY.md:15` | Supported-version policy still names only beta.1 | Open |
| F083 | Low · P3 | `docs/security/THREAT_MODEL.md:9` | Completed gates are still listed as open; `xivapi-validation.md` contradicts itself | Open |
| F082 | Low · P3 | `docs/data-provenance.md:3` | Stale version numbers; also says the package contains synthetic examples | Open |
| F084 | Low · P3 | `README.md:59` | README says an appearance slot exposes `issues` | Open |
| F053 | Low · P3 | `docs/xivapi.md:3` | The export list omits `XivapiInputError` | Open |
| F085 | Low · P3 | `CONTRIBUTING.md:22` | Says tests and CI use only synthetic inputs, but real producer exports are read | Open |
| F087 | Low · P3 | `docs/cloudflare-hosting.md:68` | The deployed-origin check silently needs a matching local build | Open |
| F089 | Low · P3 | `README.md:13` | README calls the synthetic demo examples "anonymized" | Open |

**Ends with:** `pnpm lint`; then re-read each edited document against the cited code. No release.

## Wave 2 — packages/chara (xivapi): The client was written against doubles that are not the real API

**Anchor F051:** the live XIVAPI answers HTTP 404 for a whole `rows=` batch when any row is missing, so one unknown Stain or Glasses ID makes the whole lookup `unavailable`; the documented `notFound` and missing-row states cannot occur, and the test doubles return a 200 the real API never does.
- **Fix direction:** fetch the whole Stain sheet (about 129 rows, one request) and select locally, or bisect within the 40-request budget and return `partial`; replace the doubles with recorded real responses.
- **G008:** the documented resolver reuse coalesces lookups across Cloudflare Worker requests (error 1101 or stranded jobs). The audit inferred this from workerd source and docs and did not run it: reproduce under `wrangler dev`/workerd first, then make coalescing request-local or document per-request construction.
- **G011, F052, F040, F050, F039:** option handling in `createDyeNameResolver`, the all-zero off-hand pairing, the hung-`set()` downgrade, cache-hit ordering, and the browser opaque-redirect code. F052 and F040 were ruled low findings.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F051 | Medium · P2 | `packages/chara/src/xivapi/client.ts:272` | One nonexistent Stain/Glasses row makes the whole batch `unavailable` (the real API answers 404) | Open |
| G008 | Medium · P2 | `packages/chara/src/xivapi/client.ts:576` | The documented resolver reuse coalesces lookups across Cloudflare Worker requests (error 1101 / stranded jobs) | Open |
| G011 | Medium · P2 | `packages/chara/src/dyes/index.ts:26` | `createDyeNameResolver` drops inherited and non-enumerable options and silently falls back to defaults | Open |
| F052 | Low · P3 | `packages/chara/src/xivapi/resolve.ts:95` | An all-zero off-hand pairs with any main-hand weapon whose ModelSub is 0 | Open |
| F040 | Low · P3 | `packages/chara/src/xivapi/client.ts:364` | A hung host-cache `set()` downgrades a fully fetched lookup to `partial`/`DEADLINE` | Open |
| F050 | Low · P3 | `packages/chara/src/xivapi/client.ts:385` | A cache hit returns rows in stored order, and unsorted entries are accepted | Open |
| F039 | Low · P3 | `packages/chara/src/xivapi/client.ts:236` | In browsers an opaque redirect is reported as `BODY_UNAVAILABLE`, not `REDIRECT_REFUSED` | Open |

**Ends with:** `pnpm build && pnpm type-check && pnpm lint && pnpm verify-fixtures && pnpm verify-palettes && pnpm test`, then `pnpm test:package`. Recorded real-API fixtures must not trigger live traffic in CI.

## Wave 3 — packages/chara (reader, inspect, xivapi): Cross-realm input, re-read values, label accuracy; then publish

Small robustness fixes in three modules; **F001, G009, G010** are the same cross-realm `instanceof` pattern (`Uint8Array`, `AbortSignal`, body chunks): use the `%TypedArray%` brand getter or an equivalent realm-independent check.
- **F054:** `resolve()` re-reads `glassesId` after validating it (read once into locals; F011, the same pattern in `modelKey`, was ruled info).
- **F086:** an invalid `signal` throws after the request has started, leaving an orphaned subscriber.
- **F010, F012:** the `unsupported` vs `invalid` label for wide integers, and the reader's `ISSUES_TRUNCATED` marker landing mid-list.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F001 | Low · P3 | `packages/chara/src/read.ts:53` | A `Uint8Array` from another realm is rejected as `INVALID_INPUT` | Open |
| G009 | Low · P3 | `packages/chara/src/xivapi/resolve.ts:141` | Only the resolver rejects an `AbortSignal` from another realm | Open |
| G010 | Low · P3 | `packages/chara/src/xivapi/client.ts:247` | Body chunks from another realm make every lookup `BODY_UNAVAILABLE` | Open |
| F086 | Low · P3 | `packages/chara/src/xivapi/client.ts:635` | An invalid `signal` throws `TypeError` after the request has started, leaving an orphaned subscriber | Open |
| F054 | Low · P3 | `packages/chara/src/xivapi/resolve.ts:47` | `resolve()` reads `glassesId` again after validating it | Open |
| F010 | Low · P3 | `packages/chara/src/inspect.ts:112` | Integers too wide for fields that can be `unsupported` are labelled `unsupported`, not `invalid` | Open |
| F012 | Low · P3 | `packages/chara/src/inspect.ts:216` | The reader's `ISSUES_TRUNCATED` can land mid-list in `inspection.issues` | Open |

**Ends with:** `pnpm build && pnpm type-check && pnpm lint && pnpm verify-fixtures && pnpm verify-palettes && pnpm test`, `pnpm test:package`; then publish: `package.json` is `0.1.0-beta.3`, which npm already lists, so bump `packages/chara/package.json` and the `expected_version` default in `.github/workflows/publish.yml`, update `CHANGELOG.md`, and run **Publish to npm** as a dry run first. This publish also carries Wave 0 and Wave 2.

## Wave 4 — repo tooling (scripts, test/, CI): Release and verification tooling that can pass vacuously

**Anchor F029:** `build-palettes` write mode keeps the previous upstream provenance (`source`/`sources`). Also here: `--check` compares nothing (F030), `verify-palettes` does not require all four artifacts (F028), `verify-fixtures` can pass vacuously (F081), lost `tsc` diagnostics (F076), the cwd-relative esbuild paths (F077), the symlinked CLI entry guard (F078), unpinned artifact-policy branches (F079), unasserted preflight options (F080), and committed absolute paths (F088).
Nothing here ships in the package tarball; all of it is a gate that must still fail when it should.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F029 | Medium · P2 | `scripts/build-palettes.ts:77` | Write mode keeps the previous upstream `source`/`sources` provenance | Open |
| F028 | Low · P3 | `scripts/verify-palettes.ts:17` | `verify-palettes` does not require all four artifacts and prints a hard-coded total | Open |
| F030 | Low · P3 | `scripts/build-palettes.ts:72` | `--check` never compares anything; it exits 0 for any file of valid size | Open |
| F081 | Low · P3 | `scripts/verify-fixtures.ts:16` | `verify-fixtures` can pass vacuously; unlisted fixtures and `appearance.json` are not hashed | Open |
| F076 | Low · P3 | `scripts/test-package.ts:161` | `tsc` diagnostics from the installed-consumer check are lost | Open |
| F077 | Low · P3 | `packages/chara/scripts/build.ts:12` | esbuild paths are relative to the working directory, but `dist` deletion is relative to the script | Open |
| F078 | Low · P3 | `scripts/release.ts:238` | The CLI entry guard does nothing when the script is run through a symlink; `main()` wiring is untested | Open |
| F079 | Low · P3 | `scripts/package-policy.ts:13` | Several artifact-policy branches are unpinned; the `CharaSamples` case is masked by another match | Open |
| F080 | Low · P3 | `scripts/release.ts:162` | The registry preflight's `redirect` and timeout options are not asserted | Open |
| F088 | Low · P3 | `test/package-policy.test.ts:30` | Committed absolute paths reveal the maintainer's directory layout | Open |

**Ends with:** `pnpm test` (tooling suite) and `pnpm verify-fixtures && pnpm verify-palettes`; for each tightened gate, show it failing against a deliberately broken input before trusting it.

## Wave 5 — apps/demo: State, focus and live-region fragility across re-renders

**Anchor F060:** if a replacement file is rejected while appearance is still resolving, the retained file's swatches stay on "Loading…". Also here: live regions and alerts recreated on every render (G013), focus lost when Resolve/Cancel or a pager button is activated (F072, F074), nested disclosures collapsing on re-render (F069), the Race row saying "Not stored" (F073), `--muted` text failing WCAG AA on tinted panels (G014), and the appearance message serialising raw subtrees twice (G012).

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F060 | Medium · P2 | `apps/demo/src/state.ts:134` | If a replacement file is rejected while appearance is still resolving, the retained file's swatches stay on "Loading…" | Open |
| G013 | Medium · P2 | `apps/demo/src/render.ts:383` | Live regions and alerts are recreated on every render | Open |
| F072 | Low · P3 | `apps/demo/src/render.ts:768` | Keyboard focus is lost when Resolve or Cancel is activated | Open |
| F074 | Low · P3 | `apps/demo/src/render.ts:270` | Pager buttons are destroyed when activated, which drops focus | Open |
| F069 | Low · P3 | `apps/demo/src/render.ts:764` | On re-render, nested stored-value disclosures collapse and paging resets | Open |
| F073 | Low · P3 | `apps/demo/src/render.ts:419` | The Race row says "Not stored" when Race is stored but Tribe is unusable | Open |
| G014 | Low · P3 | `apps/demo/src/styles.css:10` | `--muted` text fails WCAG AA contrast on tinted panels | Open |
| G012 | Low · P3 | `apps/demo/src/worker.ts:23` | The appearance message serialises the raw stored subtrees a second time | Open |

**Ends with:** `pnpm --filter @xivcharakit/demo test` and `pnpm test:demo:cloudflare`; deploy is `pnpm deploy:demo`, a **manual** action that needs the maintainer's yes.

## Wave 6 — apps/demo (tests): Evidence for the privacy and CSP gates (THREAT_MODEL SEC-03)

The gates exist but their tests would still pass if the control were weakened. **Anchors F064, G004, G005:** the CSP test uses substring checks (a widened policy still passes), request evidence ignores page-load and same-origin traffic, and there is no log/console canary. Also F061 (the icon loader's bounds never run in CI), G001-G003 and G006 (hostile-render, page-load and allowlist coverage).
Each new assertion must be shown to fail against the weakened control before it is trusted.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F064 | Medium · P2 | `apps/demo/hosting/hosting.spec.ts:25` | CSP test uses substring checks; a widened policy or missing `base-uri`/`form-action` still passes | Open |
| G004 | Medium · P2 | `apps/demo/e2e/inspection.spec.ts:43` | SEC-03 request evidence ignores page-load and same-origin traffic | Open |
| G005 | Medium · P2 | `apps/demo/e2e/resolution.spec.ts:193` | No log/console canary; storage is checked only before lookup | Open |
| F061 | Medium · P2 | `apps/demo/src/icons.ts:4` | Icon loader security bounds have no automated coverage | Open |
| G001 | Low · P3 | `apps/demo/e2e/inspection.spec.ts:140` | The hostile-render test does not watch for requests, dialogs or navigation | Open |
| G002 | Low · P3 | `apps/demo/e2e/inspection.spec.ts:31` | No CI test watches requests from the start of page load | Open |
| G003 | Low · P3 | `docs/security/THREAT_MODEL.md:117` | SEC-03 log-canary evidence is missing and not recorded as an open item | Open |
| G006 | Low · P3 | `apps/demo/e2e/resolution.spec.ts:133` | In CI, lookup request minimisation is checked by a deny-list; allowlists exist only in the skipped live test | Open |

**Ends with:** `pnpm --filter @xivcharakit/demo test` and `pnpm test:demo:cloudflare`.

## Wave 7 — packages/chara (tests): Reader and inspection guards that can be deleted unnoticed

**Anchors F002, F003, F004:** the hand-written syntax checks on discarded image strings, the node/key budgets inside the omitted image subtree, and the `READ_MAXIMUMS` ceiling have no test. Plus the weapon worn/empty rule (F013) and the boundary and cap tests (F005-F007, F014-F017).
Method for every row: add the test, delete or loosen the guard on a scratch copy, confirm the test fails, restore.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F002 | Medium · P2 | `packages/chara/src/read.ts:137` | No test covers the hand-written syntax checks on discarded image strings | Open |
| F003 | Medium · P2 | `packages/chara/test/read.test.ts:191` | Node and key-length budgets inside the omitted image subtree are untested | Open |
| F004 | Medium · P2 | `packages/chara/src/read.ts:20` | `READ_MAXIMUMS` values and acceptance at the ceiling are not pinned by tests | Open |
| F013 | Medium · P2 | `packages/chara/src/inspect.ts:207` | Weapon worn/empty rule and weapon `INCOMPLETE_MODEL` have no test | Open |
| F005 | Low · P3 | `packages/chara/src/read.ts:233` | Untested: a key exactly at `maxKeyLength`, valid exponents, `MAX_SAFE_INTEGER` | Open |
| F006 | Low · P3 | `packages/chara/test/property.test.ts:45` | Property mutation test accepts any thrown error and never checks that valid input is accepted | Open |
| F007 | Low · P3 | `packages/chara/src/issues.ts:11` | Multi-segment path budget and behaviour at exactly the issue cap are unpinned | Open |
| F014 | Low · P3 | `packages/chara/src/inspect.ts:248` | The `RACE_TRIBE_MISMATCH` and `UNSUPPORTED_VALUE` codes are never asserted | Open |
| F015 | Low · P3 | `packages/chara/src/inspect.ts:225` | Numeric Age/Race decoding and the `Miqote`/`AuRa` aliases are untested | Open |
| F016 | Low · P3 | `packages/chara/src/inspect.ts:79` | `vector()` count/length guards and FacialFeatures bounds are unpinned | Open |
| F017 | Low · P3 | `packages/chara/src/inspect.ts:262` | The numeric-typing rule for metadata fields and the combined 64-issue cap are untested | Open |

**Ends with:** `pnpm build && pnpm type-check && pnpm lint && pnpm verify-fixtures && pnpm verify-palettes && pnpm test`. Test-only: no release of its own.

## Wave 8 — packages/chara (tests): Appearance maths and palette provider assertions

**Anchors F019, F020, F022, F034-F036:** CIEDE2000 hue wraparound is never asserted, hex-to-Lab is checked only for greys, policy validation is mostly untested, and the palette tests check wiring and offsets only partly. Plus the provider association checks, thresholds, composite and deep-freeze tests (F021, F023-F027, F033, F037, F038).
Derive expected colors from an independent source (published CIEDE2000 test vectors, the shipped JSON), not from the code under test.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F019 | Medium · P2 | `packages/chara/src/appearance/color-math.ts:65` | CIEDE2000 hue-wraparound branches are never asserted | Open |
| F020 | Medium · P2 | `packages/chara/src/appearance/color-math.ts:35` | hex→Lab conversion is asserted only for neutral (grey) colours | Open |
| F022 | Medium · P2 | `packages/chara/src/appearance/policy.ts:48` | Most policy validation untested; the "before provider work" ordering is never asserted | Open |
| F034 | Medium · P2 | `scripts/palette-generation.ts:19` | Generator test pins only some offsets and tribes, but the docs claim it proves them all | Open |
| F035 | Medium · P2 | `packages/chara/src/palettes/default-provider.ts:141` | No test checks the actual colour values returned for each gender | Open |
| F036 | Medium · P2 | `packages/chara/src/palettes/index.ts:25` | `shader-shared` loader wiring unpinned (only `eyes[0]` is sampled, and it is identical in both tables) | Open |
| F021 | Low · P3 | `packages/chara/src/appearance/resolve.ts:68` | Provider association and canonical-hex checks are mostly untested; the test title claims more than it checks | Open |
| F023 | Low · P3 | `packages/chara/src/appearance/resolve.ts:365` | Custom thresholds and the exact-equality boundaries are unpinned | Open |
| F024 | Low · P3 | `packages/chara/src/appearance/resolve.ts:141` | Unpinned: `ZERO_KEYS` completeness, and that ambiguity is independent of the flag | Open |
| F025 | Low · P3 | `packages/chara/src/appearance/resolve.ts:261` | Index 192 boundary, limbal kind, gridAddress, eyesShareIndex, metadata and composite clamp are never asserted | Open |
| F026 | Low · P3 | `packages/chara/src/appearance/color-math.ts:104` | `compositeHex` is tested only for white over black | Open |
| F027 | Low · P3 | `packages/chara/test/appearance.test.ts:14` | The mock provider hides errors in highlights/features palette routing | Open |
| F033 | Low · P3 | `packages/chara/src/palettes/default-provider.ts:39` | Validation rejection paths and `PALETTE_LOAD_FAILED` are untested; sparse arrays are accepted | Open |
| F037 | Low · P3 | `packages/chara/test/palettes.test.ts:86` | The deep-freeze guarantee is tested only at the top level | Open |
| F038 | Low · P3 | `scripts/build-palettes.ts:33` | The CLI's pre-read size gate and argument validation are untested | Open |

**Ends with:** `pnpm build && pnpm type-check && pnpm lint && pnpm verify-fixtures && pnpm verify-palettes && pnpm test`. Test-only.

## Wave 9 — packages/chara (tests): XIVAPI budgets, cache admission and resolver scope (SEC-05)

**Anchors F042, F043, F056:** the transport depth/node budgets, most cache-admission gates and the `sameData` rejection path can be removed without a test failing. Plus the LRU touch, schema memo, duplicate-row, redirect, Retry-After, cursor and 2 MiB budget tests, the row/ID limits (F044-F049, F055, F057-F059), and G007: the default native-fetch transport never runs in Node, Node Worker or workerd.
Do this after Wave 2 so the new tests pin the corrected client rather than the old one.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F042 | Medium · P2 | `packages/chara/test/xivapi-client.test.ts:398` | Transport depth/node budgets unpinned; malformed-structure test asserts only the status | Open |
| F043 | Medium · P2 | `packages/chara/src/xivapi/cache.ts:28` | Most `admittedJson` cache-admission gates untested | Open |
| F056 | Medium · P2 | `packages/chara/src/xivapi/rows.ts:175` | The `sameData` rejection path in `cachedRow` is untested | Open |
| F044 | Low · P3 | `packages/chara/src/xivapi/cache.ts:105` | The memory cache's LRU touch is untested (a FIFO cache would pass) | Open |
| F045 | Low · P3 | `packages/chara/src/xivapi/client.ts:357` | Expiry, cap and isolation of the default-schema memo are untested | Open |
| F046 | Low · P3 | `packages/chara/src/xivapi/client.ts:387` | The duplicate-rowId check and row accounting on cache hits are untested | Open |
| F047 | Low · P3 | `packages/chara/test/xivapi-client.test.ts:325` | The redirect test does not pin `REDIRECT_REFUSED` | Open |
| F048 | Low · P3 | `packages/chara/src/xivapi/client.ts:269` | The Retry-After cap boundary and the retry-once rule are untested | Open |
| F049 | Low · P3 | `packages/chara/src/xivapi/client.ts:477` | Cursor, 2 MiB and version-list budgets are tested only above the limit, and the cursor test is masked | Open |
| F055 | Low · P3 | `packages/chara/src/xivapi/rows.ts:67` | The range and sheet guards on item rows are untested | Open |
| F057 | Low · P3 | `packages/chara/src/xivapi/query.ts:65` | The 64-ID / 24-model limits are tested only on the rejecting side; the dye error code is unpinned | Open |
| F058 | Low · P3 | `packages/chara/src/dyes/index.ts:23` | The options guard, which other code relies on, is untested | Open |
| F059 | Low · P3 | `packages/chara/src/xivapi/resolve.ts:158` | The `items`/`facewear` scope prefix on issues and the mixed off-hand case are unpinned | Open |
| G007 | Low · P3 | `test/runtime/smoke.ts:9` | The default native-fetch transport never runs in Node, Node Worker or workerd | Open |

**Ends with:** `pnpm build && pnpm type-check && pnpm lint && pnpm verify-fixtures && pnpm verify-palettes && pnpm test`, then `pnpm test:package`. Test-only.

## Wave 10 — apps/demo (tests): State-machine and UI behaviour tests

Replacement/abort/timeout paths and weak assertions: clear or replacement aborting a lookup and re-enabling Resolve (F067), the worker-termination and deadline test (F068), the Cancel control (F062), post-commit timeout and worker `onerror` (F063), admission limits (F065), the example-fetch failure path (F066), the "Show previous" tautology (F070), and the facewear filter covered only by the skipped live test (F071).
Do this after Wave 5 so the tests pin the fixed state machine.

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F067 | Medium · P2 | `apps/demo/src/state.ts:46` | No test confirms that clear or replacement aborts a lookup and re-enables Resolve | Open |
| F068 | Medium · P2 | `apps/demo/e2e/inspection.spec.ts:4` | Timeout test cannot observe worker termination, and the deadline is pinned only from above | Open |
| F062 | Low · P3 | `apps/demo/src/state.ts:64` | No test exercises the "Cancel lookup" control | Open |
| F063 | Low · P3 | `apps/demo/src/state.ts:104` | The timeout path after inspection has committed, and the worker `onerror` handler, are untested | Open |
| F065 | Low · P3 | `apps/demo/src/state.ts:79` | The size/extension admission gate is tested only from above | Open |
| F066 | Low · P3 | `apps/demo/src/state.ts:154` | Failure and abort of the example fetch, and the diagnostics cap, are untested | Open |
| F070 | Low · P3 | `apps/demo/e2e/resolution.spec.ts:75` | The "Show previous" assertion is a substring tautology | Open |
| F071 | Low · P3 | `apps/demo/src/state.ts:198` | The facewear filter and rendering are covered only by the skipped live test | Open |

**Ends with:** `pnpm --filter @xivcharakit/demo test` and `pnpm test:demo:cloudflare`. Test-only.

## Wave 11 — docs + fixtures manifest: Producer compatibility record and refresh method

**Anchor F091 (partly done):** the refresh method compares the bytes of a few pinned serializer files, which cannot see meaning mismatches. Wave 0 already pinned four semantic source files and documented the Brio eye crossing. Remaining: pin Brio `VectorConverters.cs` and the Ktisis and Anamnesis files in F093 and F095, add a semantic-comparison step to the refresh method in `AGENTS.md` and `docs/compatibility.md`, and reword the remaining "historical" prose.
- **F097:** Anamnesis exports never carry `IsExtendedAppearanceValid`, so their extended colors are never live; disclose it.
- **F098, F094:** the Anamnesis and Ktisis "Partial export: Pending" gates cannot be met; record "unsupported by current producer" with the legacy-build caveat.
- **F099:** Anamnesis files with a large embedded image exceed the 8 MiB default; record the producer limit and give the demo a specific message (whether to raise the default is the maintainer's call).

| ID | Sev · Tier | Location | Item | Status |
|---|---|---|---|---|
| F091 | Medium · P2 | `docs/compatibility.md:15` | Compatibility review never pinned the eye-field semantics, and calls current Brio behaviour "historical" | Open |
| F094 | Low · P3 | `docs/producer-fixture-validation.md:12` | Ktisis partial export is listed "Pending", but current Ktisis cannot export selectively | Open |
| F093 | Low · P3 | `docs/compatibility.md:15` | The Ktisis sources for enums and the writer are not pinned | Open |
| F095 | Low · P3 | `docs/compatibility.md:15` | The Anamnesis files that define metadata and colour/vector formats are not pinned | Open |
| F097 | Medium · P2 | `packages/chara/src/appearance/resolve.ts:140` | Anamnesis exports never carry `IsExtendedAppearanceValid`, so their extended colours are never live; this is not disclosed | Open |
| F098 | Low · P3 | `docs/producer-fixture-validation.md:11` | The Anamnesis "Partial export: Pending" gate cannot be met | Open |
| F099 | Low · P3 | `packages/chara/src/read.ts:13` | The default 8 MiB budget rejects Anamnesis exports with images Anamnesis itself accepts; not documented | Open |

**Ends with:** `pnpm verify-fixtures`; any new pin needs its SHA-256 recomputed from the raw file at the pinned commit. Refresh dates and commits per `AGENTS.md`.

## Open decisions

| # | Decision | Why it is open | Default if nobody decides |
|---|---|---|---|
| D1 | F090 residual: swap eye colors heuristically when only one crossed match is visible? | A one-sided match next to a custom color is evidence, not proof; a false swap mirrors correct colors, and the library has no producer routing by design. | Keep the warning only. |
| D2 | Bump `wrangler` to clear the three `undici` advisories (1 high, 2 moderate, dev dependency only) | `pnpm audit` newly fails and CI runs it; not an audit finding, found while verifying. | Leave; fix before the next CI run that must be green. |
| D3 | Whether to raise the 8 MiB default read budget (F099) | Anamnesis can write files above it; the budget is a documented trade-off. | Keep; document the limit. |
| D4 | Version for the next publish | `0.1.0-beta.3` is already on npm, and Wave 0 changes the appearance policy and the `AppearanceReason` union. | `0.1.0-beta.4` on `next`. |

## Not scheduled

### Register: ruled info or no defect

| ID | Item | Reason | Revisit trigger |
|---|---|---|---|
| F009 | `ModelBase 0` with a non-zero variant is classified `empty` | Matches game semantics and the literal sentences of `docs/compatibility.md`; only the docs are silent. | Add one sentence and a test when Wave 1 or 11 touches that table. |
| F011 | `modelKey` re-reads properties after validating them | Accessor-backed models are outside the contract in `implementation-progress.md`. F054 (same pattern) is scheduled in Wave 3, which is inconsistent. | Revisit if Wave 3 reads once in `modelKey` too. |
| F031 | Four creator palettes are byte-identical | Faithful copy of the 7.57 game file (they differ only in alpha). Do not "correct the offsets". | Optional provenance note with F034. |
| F032 | Shipped `dist` palette chunks are not hash-verified | `build.ts` has no palette transform step; hardening only. | If the build ever transforms palette data. |
| F041 | A cold process never reads the cache with the default schema | Documented 10-minute memo; mechanism is accurate. | Document it and recommend a pinned `rev:` schema for persistent caches. |

### Register: refuted candidates

F008 (`hasEmbeddedImage` for a null or empty image field is intended and tested) and F018 (explicit `undefined` policy options throw by the library's documented convention). See §8 of the report.

### Register: unverified observations

The 22 info-level observations in §9 of the report were never verified. Promote one to a finding only after reading the code it names.

## Standing guidance

- Verify each finding's evidence against the code before fixing: findings are leads, and the first-pass reviewers were wrong about line numbers and mechanisms often enough that the verifiers corrected several anchors (report §9).
- Test first, and watch the new test fail for the stated reason; for any gate-pinning test, break the guarded code on a scratch copy and confirm the test fails.
- Run the standing gate at every wave boundary: `pnpm build && pnpm type-check && pnpm lint && pnpm verify-fixtures && pnpm verify-palettes && pnpm test`, then `pnpm test:package` for any wave that touches the library. On Windows, put `C:\Windows\System32` first on `PATH` for `test:package`: GNU `tar` from Git Bash fails on `C:` paths.
- Producer-format claims need the producer's source at a pinned commit: record the date, release and commit, and say what was source-reviewed versus tested against a real export (`AGENTS.md`).
- Publishing is Actions-only (trusted publishing); deploying the demo (`pnpm deploy:demo`) and any push are the maintainer's call.
- Annotate executed waves in the heading: **✅ COMPLETED <date> <commits>**. This document doubles as the tracker.
- Do not put exploit detail for unpatched findings anywhere but the audit report.
