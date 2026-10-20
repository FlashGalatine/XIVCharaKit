# Implementation progress

Plan: `docs/plans/2026-10-19-chara-library-mvp.md`.
Implementation reopened by the maintainer on 2026-10-19.

The reader foundation covers Task 0 evidence and Tasks 1–2. The second milestone implements Tasks 3–4 (palettes and appearance); independent review is complete and both reported findings are fixed.
Tasks 5–6 add portable XIVAPI transport/cache and equipment candidate resolution. Task 7 adds the local demo and recorded live browser integration. Task 8 distribution/CI remains pending; publication, deployment, and XIV Dye Tools migration are separate scope.

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

## Reader foundation handoff (historical)

Tasks 3–4: complete palette provenance and regeneration inputs, implement the lazy provider, then appearance interpretation with independent swatch expectations. The package remains private; no merge, push, publication, deployment, or existing-product migration was performed.

## Palette and appearance milestone

Reopened by the maintainer's request to proceed. Baseline: `d2a7838`, clean working tree, 122 passing tests. Continue inline on the existing branch; one independent review follows Tasks 3–4.

Shared interfaces: Task 3 supplies `PaletteProvider.getColor` with explicit creator/shader table, palette, index, and optional tribe/gender; Task 4 consumes reader-produced `CharaInspection` evidence without altering it. Optional exports must remain separate from the main entry's static dependency graph.

Decisions before implementation:

- Repack the pinned public generated tables as four hex-only datasets, verifying original index/RGB/hex agreement and recording source and output hashes. No game installation is searched. At initial implementation, real `human.cmp` regeneration was unverified without an explicit source path; supplied-source verification below now closes that check for the baseline.
- Preserve the documented source policy: gamma-2 extended decoding, DeltaE2000 thresholds 6/1, and dark-shader comparison for both dark and light lips. Face paint has no extended color source.
- Ruling: only a declared valid extended block can apply lip opacity or suppress the indexed lip — this follows the brief's extended-activity boundary even though the older source applied alpha zero regardless of the validity flag. Inactive stored opacity remains visible; cost if wrong is a changed preview for contradictory legacy exports.
- Ruling: keep complete all-zero legacy blocks as ambiguous evidence rather than erase them or declare active black colors — the plan requires raw-value preservation and honest ambiguity. A single valid black vector remains usable; cost if wrong is an unresolved preview for an intentionally all-zero complete block.
- Missing highlight/face-paint controls leave activity unknown, with stored swatch evidence still available. Unknown race prevents treating a possible Hrothgar fur index as a lip palette index.
- Ruling: no creator-color fallback when a live extended comparison lacks its shader reference — that would hide missing source evidence. Return unresolved with both available colors retained; cost if wrong is a degraded result for incomplete custom providers.

Task 3 implemented: four versioned data tables, all source/output hashes, immutable metadata, detached color results, lazy per-table loading with coalescing/retry, and the explicit bounded local-file generator. Twenty-one provider tests and five generator tests were observed failing before implementation. Full suite: 148/148. Strict type checks, palette verification and installed JS/TS/Node Worker consumers pass. Build metadata rejects optional code in the main static dependency graph. At this checkpoint, real source regeneration and release/data-rights review remained pending; Task 4 and the independent review followed.

Task 4 implemented: source-separated swatches, gamma-2 extended decoding, CIEDE2000 policy, recorded historical eye correction, inactive/unknown activity, toned ranges, Hrothgar fur semantics, and derived lip composites. Forty-nine initial tests were observed failing before implementation; two extra opacity regressions were also observed failing before implementation. Pre-review suite: 201/201. Installed JS/TS/Node Worker consumers exercise all three exports with no I/O; the tarball contains 28 allowlisted files. All 1,093 local samples completed appearance interpretation, with two honestly unresolved out-of-range slots. Detailed evidence: [appearance validation](security/appearance-validation.md).

Final milestone review: a fresh read-only reviewer found no Critical or Minor issues and two Important provider defects. Regressions reproduced non-string key coercion and changing associations when caller requests were reused during a lazy load. Both are fixed: validate primitive palette names, capture validated scalar coordinates before awaiting, and use the snapshot for lookup/results. Final suite: 205/205; strict type checks, lint, fixture/palette verification, build, and installed JS/TS/Node Worker checks pass. No deferred code findings remain.

The review left real-source regeneration, browser/demo gates, forged inspections or hostile JavaScript providers/getters, and unsupported FacePaint bit semantics outside this milestone. These boundaries stand: injected host functions remain trusted code, the zero-only face-paint rule follows the documented source baseline, and no broader runtime/rendering/source-parity claim is made. Policy rulings above remain explicit; the reviewer found no contradictory evidence.

Next step: Tasks 5–6, portable XIVAPI transport/cache and candidate resolution. Keep the explicit lookup privacy boundary and threat-model network budgets; no proxy or external publication is authorized by these local milestones.

## Supplied human.cmp verification

On 2026-10-19 the maintainer supplied the explicit local source. Its 186,752 bytes and SHA-256 `958e90e635b756fff3e1b9c08b7c33fb08708258eee913b8ab57672b67d5e025` are recorded without the local path. Check-mode generation matched every baseline artifact hash and color count; actual regeneration then left all four data files unchanged and added `generatedFrom` metadata only. The raw source hash was unchanged afterward. The maintainer then confirmed the file is from game version 7.57, which is now recorded in `gameVersion`. This closes the earlier real-source regeneration limitation for all 26,208 palette entries in this dataset; release/data-rights gates remain open. Raw `*.cmp` files are ignored by Git and are absent from the package allowlist.

## XIVAPI transport milestone

Task 5 baseline: `3ae73a5`, clean working tree. Execution stayed inline on the existing branch, with test-driven implementation and one fresh independent read-only review. The existing agreed brief remains the spec; no new publication or deployment scope was added.

Interface check: Task 2 supplies validated equipment lanes and decimal model keys; Task 5 captures only slot/model scalars and returns normalized upstream rows for Task 6. It exposes `createXivapiClient` separately from the future `createXivapiResolver`, keeping transport and candidate matching independently testable. No character documents or dyes enter this API. The new optional export remains outside the main static import graph.

Rulings:

- `baseUrl` names an HTTPS API root including `/api`; aliases use the official `/version` list. Strict supported version/schema grammar is documented. Cache reads require immutable version and canonical response shape; failed refresh never reuses a stale alias. Moving schema selections refresh after ten minutes too, preventing indefinite caching behind a mutable schema alias.
- Cache namespace includes the sorted requested slot/model set. This still keys by model identity and prevents a group-level interruption from establishing a cached miss for one slot. Cost: less cache reuse across different combinations, without leaking character metadata.
- Facewear uses the documented row-list endpoint with `rows=id`. A valid 200 empty list establishes absence; raw 404 does not, since it may describe endpoint/version/schema errors. Cost: one list wrapper instead of single-row response.
- Preserve nullable individual rule evidence rather than requiring all rule columns at once. No inferred wear mask, job eligibility, preferred twin, acquisition or icon fetch is added here.

Initial suite: 32 failures against transport/cache stubs (8 rejection/status checks already passed). Additional failing regressions covered deadline queueing, serialization hooks, admission before cache copying, generic 404 false negatives, and property-order-independent cache validation. All corrections were checked with the full suite. Final focused suite: 52 tests; full suite: 257 tests across 9 files. `pnpm type-check`, `pnpm lint`, `pnpm verify-fixtures`, `pnpm verify-palettes`, and `pnpm test:package` pass. Installed JS/TS/Node Worker checks exercise all four exports; package contains 36 allowlisted files and no runtime dependencies. The package check includes the production build and verifies optional code stays outside main imports.

Independent review found one Important issue (facewear 404 could be a false negative) and one Minor issue (cache adapters reordering JSON properties cause misses). The implementer graded the second Important because canonical JSON adapters are ordinary supported cache implementations. Both reproduced RED→GREEN; no deferred code findings remain. Review set aside Task 6 matching, demo behavior, live browser CORS/browser/workerd execution, release/hosting security, and ongoing packaging/docs. Those rulings stand: future work remains pending, and packaging/docs were verified separately by the implementer. See [XIVAPI validation](security/xivapi-validation.md) and [transport contract](xivapi.md).

Next step: Task 6 candidate resolution, including ambiguity, off-hand/main-hand context and facewear. Browser CORS and browser/workerd runtime acceptance remain Tasks 7–8. No private corpus identifiers were sent upstream, and resource tests used synthetic transport. No push, PR, merge, package publication, deployment or consumer migration was performed.

## Equipment candidate milestone

Task 6 baseline: `ba6acd3`, clean working tree. Execution stayed inline on the existing branch, using the agreed brief, test-driven implementation and one fresh independent review. Pure matching consumes only Task 2 identities and Task 5 admitted rows; the public resolver composes it with transport, keeping network work separate from inspection and appearance.

Rulings:

- Keep matched/notFound/partial/unavailable, plus explicit cancelled inherited from Task 5. Collapsing cancellation into an outage would violate that contract. Cost: callers handle five states.
- Upstream identities remain separate for item/facewear responses, which can differ when a changing alias cannot be resolved. Cost: consumers inspect two identities when relevant.
- Only main-hand rows actually paired by ModelSub or a copied main-hand key become off-hand candidates. Copying every main-hand candidate when just one pairs would add unsupported candidates. Missing ModelSub makes the off-hand incomplete even if a direct candidate is available. Cost: more partial answers when context is missing.
- A resolve call owns one scheduler job and shared request/byte/row/deadline budget. Items run before facewear to preserve the two-active-request bound. The initial composition of two independent client calls failed the aggregate-budget test and was replaced. Cost: facewear waits for items, but completed components remain independently usable.
- The page bound counts item-search cursor pages; facewear uses one nonpaginated sheet response. Both share the total 40-request cap. This follows Task 5's search-cursor wording; cost: up to 20 search pages plus one sheet response, within unchanged request/byte/deadline limits.
- Cache source rows only; recalculate contextual off-hand choices each call. Grouped cache identities include the main hand. Zero model/facewear identifiers remain explicit lookups; hosts should pass inspected worn models and omit absent facewear.
- Retain every candidate and its available rule/level/icon/category evidence, without name-based retirement labels, filtering, preferred twins, acquisition policy or alternate cap. No source evidence supports guessing retirement metadata.

Twenty-nine initial tests failed against the resolver stub. Pre-review resolver suite: 37 tests; full suite: 294/294 across 10 files. The request-budget regression failed before the shared scheduler change. Strict type checks, lint, fixture verification and installed JS/TS/Node Worker checks pass; the private package has 37 allowlisted files and no runtime dependencies. The synthetic equipment fixture contains seven hand-reviewed model/slot cases with a manifest hash. No private samples or live resource probes were used.

Independent review found no Critical, Important or Minor code findings. Its read-only probe additionally verified that 5,000 encountered item rows followed by a facewear row retain matched items and report unavailable facewear with ROW_LIMIT; this is now a retained regression test. The recommendation to clarify search-page counting is adopted in the contract. The reviewer set aside intentionally excluded acquisition/regional/retired-name/UI policies, live upstream/browser/demo/runtime/deployment work, and ongoing packaging/docs. Those boundaries stand; the implementer verified packaging/docs separately. No deferred code findings remain.

Task 6 complete: 38 focused resolver tests and 295/295 full-suite tests across 10 files. `pnpm type-check`, `pnpm lint`, `pnpm verify-fixtures`, `pnpm verify-palettes`, and `pnpm test:package` pass. The package check builds production bundles, verifies optional-module separation, checks 37 allowlisted files, and exercises the installed resolver in JavaScript, TypeScript and a Node Worker. No package was published.

Next step: Task 7, the local demo website. True browser CORS and browser/workerd acceptance remain pending. No push, PR, merge, publication, deployment or consumer migration is part of this milestone.

## Reference website milestone

Task 7 baseline: `dd1ffda`, clean working tree. Execution stayed inline on the existing branch, using the agreed brief, test-first browser scenarios and one fresh read-only review. The private Vite application uses ordinary DOM rendering and built public library exports; parsing/inspection/appearance run in a module Web Worker, and equipment resolution remains an explicit separate action. Exact development dependencies are Vite 8.3.4 and Playwright 1.64.1; no runtime dependency was added to the library.

Rulings and interfaces:

- Preserve the previous valid inspection on rejected replacement; if appearance fails after a new inspection succeeds, keep the new stored evidence and mark swatches unavailable. Cost: two distinct failure paths with honest status messages.
- File admission uses extension and 8 MiB size before reading, then library content recognition. Terminate superseded/five-second worker jobs, abort network work, and guard every asynchronous result by generation. Clear releases references and revokes icon URLs without claiming memory erasure.
- Raw children page in reversible groups of 200; candidate lists page in groups of ten. Bounded previews distinguish JSON scalar types. This bounds rendering while retaining all admitted evidence and candidates for navigation.
- Fetch optional icons only through validated numeric/version-derived XIVAPI asset paths, bounded PNG bodies/dimensions, and revocable local Blob URLs. Icon failures do not invalidate equipment. No backend, telemetry, persistent storage or automatic API lookup was introduced.
- Public examples are exact copies of three reviewed synthetic fixtures. Fixture verification now checks those copies. No private samples, raw game source, generated concept images, or local review screenshots are shipped.

Initial thirteen browser behavior cases were observed failing against the stub. Independent review found appearance-failure status and reversible raw pagination defects, plus ambiguous JSON scalar previews; the last was elevated from Minor to Important by the implementer because the global contract preserves stored evidence. All three reproduced RED→GREEN and are fixed. Additional regressions cover bounded names and candidate pagination. No deferred code findings remain; the broader installed-browser/workerd, CI, release and hosting gates stay in Task 8 or separate deployment scope. An intermediate Chromium navigation failed with `ERR_NO_BUFFER_SPACE` before the app loaded; focused and full reruns passed.

Final verification: 295/295 library tests and 19/19 default Chromium browser scenarios pass, with one intentional opt-in live skip. The separately invoked live browser case also passes. Strict type checks, lint, fixture/palette verification, production builds, locked offline installation, dependency audits (zero known vulnerabilities), and installed JS/TS/Node Worker consumers pass. The private tarball retains 37 allowlisted files and zero runtime dependencies.

Live evidence: synthetic Ktisis Body `361/5` and Glasses `12` resolved to Bloodhempen Chestwrap of Casting and Brown Oval Spectacles. Five GET requests (version, search, Glasses, two assets) returned HTTP 200 with CORS `*`. Assertions checked identifiers/allowed controls only, no request body/Cookie/Authorization/Referer; two icons decoded as 80×80 local Blob images. Observed version `5c744a8d8daafb25`, schema `exdschema@2:rev:e773c41a90aed788cf4c1c48469fa85618ef01fb`. Cancellation and stale responses were checked with controlled upstreams. A future public origin still requires validation; this is no availability guarantee.

The generated desktop reference and final desktop/mobile captures were compared at original resolution; interactive in-app browser checks supplemented Playwright's production-preview coverage. The [demo guide](demo.md) records setup, privacy bounds, live evidence and the seven-point fidelity ledger, including deliberate functional deviations. Production preview headers were exercised; no public hosting headers are claimed.

Next step: Task 8, distribution/runtime acceptance, CI and review artifacts. The package remains private and the website local; no push, PR, merge, publication, deployment or consumer migration was performed.

## Local dye-name follow-up

The maintainer requested dye ID resolution and approved the bounded design in chat: local English names alongside both stored IDs, explicit zero/unknown/missing/null/invalid states, unchanged stored evidence, and no dye identifiers sent upstream. Baseline: `b091a2d`, clean working tree. Task 8 remains pending.

Added the independent optional `ffxiv-chara/dyes` entry with pure `getDyeName` and frozen `DYE_METADATA`. The main static graph still excludes optional data. The demo shows two labelled channels in its Dyes column, with `No dye (0)` as the UI label for the source's `No Color` row. Unknown IDs retain their numbers; invalid or absent fields are not coerced into zero. Names are rendered as text and do not depend on equipment lookup.

The name snapshot is derived from commit-pinned public Stain data: 129 rows, 126 names including row zero; blank rows 126–128 stay unresolved. Surrounding whitespace is trimmed. Its revision remains separate from the supplied game 7.57 appearance palette binary; no parity is inferred. The [provenance guide](data-provenance.md#english-dye-name-snapshot) records source/name hashes, normalization, and the explicit offline generator. Game-data release/notice review remains open.

Test-first evidence: eight known-name cases failed against the null-returning stub; both initial dye browser scenarios failed against the numeric-only UI. The implementation then passed 25 focused dye unit cases. Browser verification exposed two incorrect raw-tree selectors in the new test (a nonexistent label separator, then matching a containing subtree); these were corrected against the existing DOM structure rather than changing product behavior. Final full suite: 320/320 library tests across eleven files and 20/20 default browser scenarios; the separately opt-in live case remains intentionally skipped. No new production request was necessary for this local-only feature.

Final checks: strict type checks, lint, fixture/palette verification, exact pinned-source dye regeneration in check mode, production build and installed JS/TS/Node Worker consumers pass. The tarball contains 39 allowlisted files and zero runtime dependencies; built artifacts pass private-path/canary scans. No dependencies were added. One full test invocation was initially blocked by an automatic approval review usage-limit failure and did not execute; the retry after the maintainer's continuation succeeded.

Independent read-only review found no Critical, Important or Minor findings. The reviewer checked the source hash, all generated names and every uint16 lookup against the pinned CSV, invalid runtime inputs, frozen metadata, declarations and packaging. The implementer's final browser result is recorded above. The reviewer left additional languages/swatches/item IDs, newer-data or 7.57 parity, Task 8/runtime/deployment and legal redistribution clearance outside this bounded feature; those limits stand because the approved snapshot is explicit and release/runtime gates remain open. No deferred code findings remain.

Visual QA: the in-app browser loaded the example and showed No dye (0), Goobbue Grey (3), and Ash Grey (2) before lookup. Original-resolution Playwright captures at desktop 1374×1145 and mobile 390×844 show distinct channel rows, readable names/IDs and the existing horizontal-table hint; mobile has no horizontal page overflow. This intentionally changes the previous compact numeric Dyes column to two name/ID lines. Header, swatches and explicit lookup flow remain consistent with the existing layout. No console warnings/errors were observed.
