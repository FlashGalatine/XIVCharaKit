# XIV Dye Tools Integration Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` for inline execution, or `superpowers:subagent-driven-development` if the maintainer chooses delegation. Read the target repository's `AGENTS.md`, root `CLAUDE.md`, and affected units' guidance first. Steps use checkboxes for tracking. This is a draft for review; implementation has not been authorized by the request to draft it.

**Goal:** Make XIVCharaKit the character-file reader and appearance interpreter used by XIV Dye Tools' web app and shared bot commands, while preserving its application features and host policies.

**Architecture:** Add a shared adapter in `@xivdyetools/core`, using `xivcharakit` for bounded reading/inspection and `xivcharakit/appearance` for color interpretation. Supply the existing creator/shader data through a host palette provider, and project results into a small application model. Keep dye matching/localization, sessions, equipment enrichment, game rules, acquisition data and exports in XIV Dye Tools.

**Tech stack:** TypeScript ESM, pnpm 11.17.0, Turborepo, Vitest, Vite/Lit, module Web Workers, and Cloudflare Workers. Follow the target's root Node floor (`>=22.13.0`) for development; separately validate the published core package's advertised Node floor (`>=18.0.0`).

**Spec:** [Consumer migration brief](../../../migration.md), [library API](../../api.md), [appearance semantics](../../api.md#appearance-interpretation-xivcharakitappearance), and the compatibility decisions below.

**Execution root:** `C:\dev\XIVProjects\xivdyetools`. All task paths refer to that repository unless explicitly prefixed `XIVCharaKit:`. This plan is stored in the library repository for handoff; its Markdown reference links resolve relative to this document. An executor can read it here while working in the target repository; copying files is not required.

## Baseline and scope

Reviewed local sources on **2026-10-22**. Target Git HEAD reports `d50927c2744887a1cabf232303bc622f511ef263` on `main`. A normal status inspection returned `this operation must be run in a work tree` in this session, so cleanliness is unverified. Recheck the actual worktree before implementation. No target files, dependencies, or deployments were changed while drafting.

| Component | Reviewed baseline | Relevant implementation |
| --- | --- | --- |
| XIVCharaKit | `0.1.0-beta.2`, source `8f30f7b4a20b857a5efa1aa1dc4c0b0d9ed1b48b` | Five public exports; published release integrity/provenance verified earlier in this chat |
| Core | `5.14.0` | `packages/core/src/services/chara/{chara-parser,chara-resolver,chara-models,chara-shader-colors}.ts` |
| Web app | `5.15.5` | `chara-file-loader.ts` → shared `CharaSessionService` → Swatch Matcher / Glamour Reader |
| Shared bot logic | `4.10.0` | `packages/bot-logic/src/commands/{swatch,glamour}.ts` |
| Discord worker | `5.8.15` | Shared attachment guards and command handlers |
| API worker | `0.20.0` | `/v1/chara/resolve`, icon proxy, regional names, acquisition and twin selection |

The integration target is **exactly `xivcharakit@0.1.0-beta.3` once published and verified**, not a floating `next` tag. Review its eventual registry artifact against its own CI release manifest before installation. The historical beta.2 integrity is `sha512-i0Kno7HGUeBs9h9pPVCVxanofG2tXb/O125/bB7tCjqj4qrYmXhmoF0sRhcRbBrg60veMCoUL7Tg0iUpUsOauw==`; it cannot substitute for beta.3 verification.

Beta.2 is a historical comparison baseline, not a promise of complete host parity. The host accepts the legacy `Helion` tribe alias, while published beta.2 lists `Helions` without that alias. The beta.3 candidate fixes this gap with inspection and actual-palette regressions, following the 2026-10-22 producer-source refresh. Publish and verify beta.3 before consumer adoption; preparing this candidate does not change the published beta.2 artifact. Any additional blocking gap found during comparison requires its own reviewed library change and exact version pin.

## Global constraints

- Keep `MAX_CHARA_FILE_BYTES = 8_192`. Check browser `File.size` before reading and Discord metadata plus actual streamed bytes before parsing. Pass `{ maxBytes: MAX_CHARA_FILE_BYTES }` to the new reader adapter as a second boundary. Do not lower shared image-upload limits or inherit the library's 8 MiB default.
- Honor `minimumReleaseAge: 1440` and the existing `allowBuilds` policy. Wait for an eligible package release; do not add a standing exception or install-script permission for this integration.
- Original library code is MIT; retain its complete code license, third-party notices and Square Enix attribution/non-affiliation language. Game-derived data has separate notices. Do not redistribute raw `human.cmp`.
- Import through public exports only. Runtime imports are `xivcharakit` and `xivcharakit/appearance`; `PaletteProvider` types can come from `xivcharakit/palettes`. The first migration does not import the bundled default palette provider, `/dyes`, or `/xivapi` into application code.
- Preserve the existing offline dye database and all six locales: `en`, `de`, `fr`, `ja`, `ko`, `zh`. A Stain ID is not an item ID; facewear colors are not stains.
- Keep the browser's API-worker boundary and CSP. The reference demo's direct XIVAPI transport is not the host integration architecture. Retain the host's current lookup trigger and identifier-only request allowlist.
- Raw documents, embedded image payloads and arbitrary unknown fields must not enter sessions, telemetry, logs, caches, requests, SVG/PNG cards or exports. Only the web file card may show a bounded local nickname/file label. Bot output keeps neutral localized titles.
- Preserve published `parseCharaFile`, `resolveCharaColors`, `ParsedCharaFile`, `ResolvedCharaCharacter`, model helpers and `CharacterColorService` contracts during this additive migration. Add new entry points; removing or changing legacy APIs requires a separate semver decision.
- No existing application feature is removed: nearest-dye matching, grid links, shared sessions, twin selection, in-game rules, acquisition lines, regional names, GPOSERS/Markdown export and icon proxy remain host responsibilities.
- Refresh the latest official Brio, Ktisis and Anamnesis release/export sources before implementation compatibility claims, following XIVCharaKit's `AGENTS.md`. Record source review separately from actual producer-export tests. Future Evercold free colors remain a later format task, based on actual exports.

## Review focus

1. Partial files and malformed fields must not fabricate a complete appearance, an undyed channel, or an empty equipment slot. Task 3 owns these assertions.
2. Inactive lip alpha, historical eye correction and unavailable shader data must retain the library's evidence-based meanings. Tasks 1–3 own these assertions.
3. A clear, refused replacement, delayed read or delayed worker result must preserve the intended session and lookup consent. Tasks 4–5 own these assertions.
4. New inspection metadata must not escape through bot titles, error text, telemetry, export lists or resolver payloads. Tasks 3, 5 and 6 own these assertions.
5. A shared core dependency must not load duplicate palettes, trigger network activity on import, or break installed ESM/Node/Workers consumers. Tasks 2 and 7 own these assertions.

## Ownership and decisions

| Responsibility | Owner after integration |
| --- | --- |
| JSON admission, field states, enum normalization, model evidence | XIVCharaKit |
| Gamma-2 decoding, creator/shader comparison, activation, lip composition, eye correction | XIVCharaKit appearance interpreter |
| Existing palette storage and independent Swatch Matcher grids | `CharacterColorService` + `chara-shader-colors.ts`, accessed through a `PaletteProvider` |
| UI model, localization, nearest-dye matching and session lifecycle | XIV Dye Tools core adapter and application hosts |
| Equipment families, preferred twins, retired/acquisition metadata, ko/zh names, icons, KV | Existing API worker |
| Worn-slot filtering for application dye badges | Core adapter: only complete worn models, with valid nonzero channel IDs |

Use the existing host provider first. This avoids shipping a second palette corpus and leaves independent Swatch Matcher/public core APIs intact. Importing the library's default provider is a simpler alternative for a new application, but offers no initial benefit here. Replacing both the parser and the API worker in one change would combine unrelated transport, cache and product-policy migrations; defer that work.

### Compatibility decisions to encode before switching consumers

| Case | Current host behavior | Planned new import behavior / gate |
| --- | --- | --- |
| Partial equipment-only document | Rejected when no color key exists | Accept a supported character document; unresolved appearance stays explicit, and valid gear remains useful. This is an intentional app change with tests and release notes. |
| Unknown tribe/gender or malformed color | Some cases reject the whole file | Preserve valid independent equipment/appearance and show localized unresolved warnings. Do not guess missing context or silently coerce invalid values. Legacy APIs retain their old behavior. |
| `Au Ra` / `AuRa`, feminine/masculine enums | Host types use `AuRa`, `Male` / `Female` | Explicit normalized mapping to host types; use the canonical race, not a contradictory declared race. |
| Legacy `Helion` | Accepted as `Helions` | Fixed in the beta.3 candidate with regressions; verify the published beta.3 release contains it before adoption. Do not fork the producer parser inside the adapter. |
| Missing/fractional model lanes | Old parser defaults missing lanes to zero and floors positive fractions | Do not invent or floor lanes. Require complete uint16 models; omit incomplete/invalid models from lookup and show a bounded warning while retaining valid other slots. |
| Invalid dye or zero dye | Old parser emits positive finite dyes, even fractions; suppresses zero | Require uint16 channel IDs. Keep valid models usable; emit badges only for valid nonzero dyes on worn slots and retain a diagnostic for invalid channels, without calling them undyed. |
| Explicit false/missing highlight or face-paint control | Old parser treats missing controls permissively | Follow library activity evidence. Missing required controls can be unresolved rather than enabled; show why. |
| Lip alpha zero with extended data inactive | Old resolver makes the lip inert whenever stored alpha is zero | Follow library activation: inactive stored alpha must not suppress an indexed lip. Pin this corrected behavior in both web and bot tests. |
| Historical crossed eyes | Old resolver and library have distinct guard conditions | Use library correction only with its complete evidence and live extended data. Keep original fields out of output mutation; show the effective corrected preview. |
| Missing shader reference | Old resolver falls back to creator comparison | Remain unresolved; do not use creator color as a pretend shader reference. |
| Embedded image under 8 KiB | Current parser ignores a populated `Base64Image` | Preserve omission, including null/empty placeholders; do not introduce a new blanket image-field rejection. The byte cap still refuses large image-bearing files. |
| Duplicate keys, depth/node limits, unsafe numbers | Current native JSON behavior is less restrictive | Accept the library's bounded refusal, with fixed localized errors and prior-session retention. |

The comparison report must record each difference as preserved, intentionally adopted, or blocking. No unexplained difference may pass the consumer-switch gate.

## Shared interface contract

Create `packages/core/src/services/chara/chara-library-types.ts` with these additive exports. Existing types remain unchanged:

```ts
import type { AppearanceSlotInspection } from 'xivcharakit/appearance';
import type { Field } from 'xivcharakit';
import type { ResolvedCharaCharacter } from './chara-resolver.js';

export type ImportedCharaSlot = Omit<
  AppearanceSlotInspection, 'storedIndex' | 'storedExtended'
> & { index: number | null; indexState: Field<number>['state'] };

export interface CharaImportIssue {
  code: string;
  severity: 'info' | 'warning' | 'error';
  path: readonly (string | number)[];
}

export interface ImportedCharaCharacter extends Omit<ResolvedCharaCharacter, 'slots'> {
  slots: ImportedCharaSlot[];
  issues: CharaImportIssue[];
}
```

New functions, exported from core's existing root barrel:

```ts
inspectCharaForTools(input: string | Uint8Array): CharaInspection;
createCharaPaletteProvider(colors: CharacterColorService): PaletteProvider;
resolveCharaForTools(
  inspection: CharaInspection,
  colors: CharacterColorService,
  dyes?: StainIdLookup,
): Promise<ImportedCharaCharacter>;
```

`inspectCharaForTools` calls the library reader with the 8,192-byte limit, then inspection. `resolveCharaForTools` consumes only reader-produced inspections, calls `resolveAppearance` with the host provider, and projects the result. It does not retain `document`, `fields`, `raw`, or `storedExtended` in the returned application object. Deduplicate issues by code/path/severity, cap at 64, and use the fixed `ISSUES_TRUNCATED` code. Diagnostic paths admit only known schema-field segments and bounded nonnegative integer indices, to at most 32 segments; replace unrecognized source keys with the literal `unknown`. UI copy comes from code maps, never the library's English message or arbitrary raw values.

Use the eight-slot order `leftEye`, `rightEye`, `hair`, `highlights`, `skin`, `limbal`, `lip`, `facePaint`. `displayHex` is the color-matching input; `lipComposite.hex` supplies the labelled lip preview when present. `effectiveExtendedHex` is corrected preview evidence; `extendedHex` remains the original decoded color. An unresolved slot has no winning color and must not enter dye matching.

Producer/nickname are bounded to 256 UTF-16 code units in the adapter. Map valid normalized identity fields explicitly (`Au Ra` → `AuRa`, `Masculine` → `Male`, `Feminine` → `Female`). Project only complete worn models and valid positive facewear IDs. Preserve zero-versus-invalid channel semantics in diagnostics, even though the host's dye badge list intentionally omits undyed channels.

## Task 1: Establish compatibility and accept an exact dependency candidate

**Files:** `packages/core/package.json`, `pnpm-lock.yaml`; create `packages/core/src/services/chara/__tests__/chara-library-parity.test.ts` and `docs/research/2026-10-22-xivcharakit-integration.md`.

**Consumes:** The candidate's five published exports and existing reviewed host fixtures/tests. **Produces:** A reviewed exact version pin and a complete difference register that gates Tasks 3–6.

- [ ] Refresh target worktree/HEAD and package versions using its checkout rules; isolate implementation from other live sessions. Record the producer release/source refresh. Do not alter compatibility claims from stale source notes.
- [ ] Write comparison tests for all eight colors, both dye channels, worn/empty/incomplete gear, both Glasses shapes, identity aliases, activation, eye correction, dark/light lips, Hrothgar fur and all-zero extended blocks. Use explicit expected values, not a snapshot copied from one implementation.
- [ ] Run `pnpm --filter @xivdyetools/core exec vitest run src/services/chara/__tests__/chara-library-parity.test.ts --coverage.enabled=false`; before adding the dependency, expect an unresolved `xivcharakit` import.
- [ ] After beta.3 publication, once its registry artifact passes integrity/provenance review and the 24-hour release-age policy, install with `pnpm --filter @xivdyetools/core add --save-exact xivcharakit@0.1.0-beta.3`. Keep it a runtime dependency of core; downstream packages consume core's facade.
- [ ] Run the comparison test and classify differences against the table above. Verify beta.3 includes the checked-in `Helion` regression. Any other missing required alias is blocking: request a separately reviewed library fix/release, verify that new artifact and age, update the exact pin, and rerun. Do not weaken expectations to force a candidate through.
- [ ] Record the final candidate, test evidence and approved behavioral differences. Commit the dependency, tests and register together only after the gate passes.

## Task 2: Bridge existing palettes without duplicating data

**Files:** Create `packages/core/src/services/chara/chara-palette-provider.ts` and `__tests__/chara-palette-provider.test.ts`; reuse `CharacterColorService.ts` and `chara-shader-colors.ts`.

**Consumes:** `CharacterColorService`, `charaShaderHex`, library `PaletteRequest`. **Produces:** `createCharaPaletteProvider(colors): PaletteProvider` for Task 3.

- [ ] Write tests that request creator/shader colors independently, map `features` to `getTattooColors()`, and map all nine palette names. Race palettes must translate `Masculine`/`Feminine` to host genders; invalid/missing coordinates return null before loading data.
- [ ] Run the new file with core's focused Vitest command; expect failure because the provider does not exist.
- [ ] Implement the creator mapping through `getEyeColors`, `getHighlightColors`, `getTattooColors`, `getLipColorsDark/Light`, `getFacePaintColorsDark/Light`, `getSkinColors` and `getHairColors`. Shader requests use `charaShaderHex` only for its six supported palettes; unsupported light/face-paint shader tables return null.
- [ ] Return canonical hex, RGB tuple, exact request coordinates and `datasetVersion: 'xivdyetools-host-palette-bridge/1'` (a bridge identifier, not a game patch). Omit optional metadata until the host can substantiate its complete provenance contract; never borrow the bundled provider's 7.57 metadata for different source data.
- [ ] Verify unknown palettes, out-of-range indices, detached results and loader failure/retry. Confirm no runtime import of `createDefaultPaletteProvider` and no network calls. Run the provider and existing character/shader tests; commit when green.

## Task 3: Implement the shared reader and application projection

**Files:** Create `chara-library-types.ts`, `chara-library.ts` and `__tests__/chara-library.test.ts` under `packages/core/src/services/chara/`; modify `packages/core/src/index.ts` for additive exports.

**Consumes:** Task 1's accepted candidate and Task 2's provider. **Produces:** The shared interface contract above; old parser/resolver exports remain operational.

- [ ] Write tests for the exact new signatures and DTO shape. Include UTF-8 byte boundaries at 8,191 / 8,192 / 8,193 bytes, a multibyte string, image omission, prototype-shaped keys, duplicate decoded keys and structural refusals. Assert no import-time or parse-time network/storage calls.
- [ ] Pin the byte boundary with `expect(() => inspectCharaForTools('{"LEyeColor":0}'.padEnd(8_192))).not.toThrow()` and `expect(() => inspectCharaForTools('{"LEyeColor":0}'.padEnd(8_193))).toThrowError(expect.objectContaining({ code: 'INPUT_TOO_LARGE' }))`.
- [ ] Add projection tests for valid partial equipment-only input, malformed color plus valid gear, incomplete gear, empty-slot stains, second-channel-only dyes, missing/null/invalid/zero dyes, numeric enums and contradictory Race/Tribe. Assert raw document/image/name canaries are absent from serialized projected output except the explicitly bounded local labels.
- [ ] Test model lanes, facewear and dyes at 65,535 and 65,536, plus negative/fractional/string values. Add an unknown property-name canary inside a diagnostic path and assert the projection substitutes `unknown` rather than retaining that key.
- [ ] Add color assertions for inactive alpha zero, unavailable shader data, missing control flags, Hrothgar, unknown race, all-zero blocks, and live/non-live crossed eyes. Assert original versus effective eye color remains distinguishable and unresolved slots have `displayHex: null`.
- [ ] Run the new tests and observe missing-entry-point failures. Implement the two facade functions and application types, reusing the provider and library interpretation rather than reimplementing gamma, DeltaE, eye swapping or lip compositing.
- [ ] Verify valid dye badges still use `dyes.getByStainId`, with unknown stains returning `dye: null`. Keep the nearest-dye matcher outside the facade. Cap/deduplicate diagnostics and project fixed codes without English/raw messages.
- [ ] Run the new suite, Task 1 parity tests and all existing core chara tests. The legacy API tests must still pass unchanged. Commit the facade and projection tests.

## Task 4: Add a cancellable browser inspection service

**Files:** Create `apps/web-app/src/workers/chara-inspection.worker.ts`, `src/services/chara-inspection-protocol.ts`, `chara-inspection-service.ts`, and `src/services/__tests__/chara-inspection-service.test.ts`.

**Consumes:** Core's new facade and `ImportedCharaCharacter`. **Produces:** `inspectCharaBytes(bytes: ArrayBuffer): Promise<ImportedCharaCharacter>` and `cancelCharaInspection(): void` for the loader. Define a bounded `CharaInspectionError` with code `unreadable | workerFailed | timedOut | superseded`.

The protocol request is `{ type: 'inspect'; id: number; bytes: ArrayBuffer }`. Responses are `{ type: 'success'; id: number; result: ImportedCharaCharacter }` or `{ type: 'error'; id: number; code: 'unreadable' | 'workerFailed' }`. IDs are positive safe integers; only the active ID may settle the promise. The host synthesizes `timedOut` and `superseded`. Transfer `[bytes]` rather than copying the input buffer.

- [ ] Write tests for valid worker results, error/message validation, worker startup failure, timeout, transfer of bytes, replacement and explicit cancellation. Timeout is exactly `5_000` ms; a late result must never publish after cancellation.
- [ ] Run the focused service test and observe failure before implementation.
- [ ] Use `new Worker(new URL('../workers/chara-inspection.worker.ts', import.meta.url), { type: 'module' })`. Terminate each completed, failed, superseded or overdue worker; a Promise race alone is insufficient. A successful message contains the projected DTO, never the inspection/document.
- [ ] Worker-local code constructs `CharacterColorService`, reads/inspects bytes, resolves appearance through the host provider and looks up dye badges from the existing offline database. Validate responses before accepting them: exactly eight unique appearance slots, at most twelve unique models, 24 dye channels and 64 diagnostics, canonical hex or null, uint16 identifiers, 256-unit local labels and at most 256 KiB of serialized projected data. Cross-thread DTOs are a separate boundary.
- [ ] Run the focused tests and a production-build module-worker smoke. Verify failure permits the next import to retry; commit the isolated service before wiring views.

## Task 5: Switch web imports and render the new evidence states

**Files:** Modify `apps/web-app/src/services/{chara-file-loader,chara-session-service}.ts`, `src/components/{chara-file-card,chara-ui,chara-sheet,glamour-block,glamour-list-actions}.ts`; affected existing service/component tests; `src/locales/{en,de,fr,ja,ko,zh}.json`; `e2e/{swatch-chara-session,glamour-reader}.spec.ts`.

**Consumes:** Task 4's service and Task 3's DTO. **Produces:** One shared in-memory session for Swatch Matcher and Glamour Reader, with localized unresolved/error evidence.

- [ ] Write loader regressions before switching: extension/size rejection before any byte read, two overlapping reads, replacement during worker work, clear during worker work, a refused replacement leaving an admitted pending import intact, and retention of the last valid session after an invalid import.
- [ ] Write view tests for all five interpretations, unknown/missing context, partial gear-only input and corrected eye preview. An unresolved state is distinct from explicitly inactive; unknown diagnostic codes use a localized generic fallback. Keep grid links only when a valid grid coordinate exists.
- [ ] Run these tests to expose the old loader/type/state assumptions. Replace main-thread `file.text()` parsing with capped `file.arrayBuffer()` and the inspection service. Retain the loader generation check around both reading and worker resolution; clear invalidates pending reads as well as workers.
- [ ] Add `cancelCharaLoad(): void` to the loader: increment its generation and call `cancelCharaInspection`. Wire it into the file card's clear action before `CharaSessionService.setSession(null)`. A refused drop must not call it. Route/locale changes still preserve the shared session.
- [ ] Change session/view annotations to `ImportedCharaCharacter` / `ImportedCharaSlot`. Use `displayHex` for dye matching and labelled `lipComposite` for the preview; keep the existing exact/closest matching and offline database. Map diagnostic codes to literal locale keys in all six locale files.
- [ ] Keep normalized producer-only parse telemetry and fixed errors; do not log or send documents, diagnostics containing raw values, file names or nicknames. Preserve `chara-resolve-service.ts`'s host API, cancellation and cache behavior; test that only validated model lanes and optional facewear leave the browser.
- [ ] Run affected Vitest files, `pnpm --filter xivdyetools-web-app exec playwright test e2e/swatch-chara-session.spec.ts e2e/glamour-reader.spec.ts --project=chromium`, repeat those scenarios with `--project=mobile-chrome`, and `pnpm --filter xivdyetools-web-app run build:check`. Use mocks, not production security probes. Commit once the session and rendering gates pass.

## Task 6: Switch the shared bot commands without changing transport policy

**Files:** Modify `packages/bot-logic/src/commands/{swatch,glamour}.ts`, corresponding tests and `__fixtures__/chara-fixtures.ts`; affected `packages/bot-logic/src/i18n/locales/{en,de,fr,ja,ko,zh}.json`; verify existing `apps/discord-worker/src/utils/chara-attachment.test.ts` and `src/handlers/commands/{swatch,glamour}.test.ts`.

**Consumes:** Core facade and projected DTO. **Produces:** Existing `SwatchResult` / `GlamourResult` contracts, SVG/embeds and equipment-resolver payloads, backed by the library.

- [ ] Add tests for the new color states, partial valid gear, no useful swatches, zero versus missing dyes, unknown stains and the Task 1 semantic corrections. Pin exact match/closest dye behavior independently of the parser.
- [ ] Add nickname/author/file-name/unknown-field canaries and assert none reach titles, SVG/PNG inputs, embeds, logs, callbacks or exports. Keep `/swatch`'s nickname stripping immediately after projection and `/glamour`'s existing allowlist destructuring.
- [ ] Run the focused command tests and observe the old-path behavior failures. Switch both commands to `inspectCharaForTools` → `resolveCharaForTools`; update winning-color helpers to use the new slots. Add fixed localized unresolved warnings without exposing English library messages. Do not change successful public result shapes.
- [ ] Preserve attachment extension, CDN host, redirect, timeout, declared-size and streamed-byte checks. Keep bot command invocation as the host's lookup action and the existing API-worker service binding. CF Worker synchronous parsing remains admission-bounded; do not claim a Promise timeout can preempt it.
- [ ] Run both shared command suites, bot locale-quality checks, attachment tests, Discord handler tests and a local workerd bundle smoke. Verify the Node-based Stoat consumer still builds through the transitive core change, without enabling new platform commands. Commit the bot migration.

## Task 7: Validate distribution, attribution and the release boundary

**Files:** `packages/core/{package.json,NOTICE,CHANGELOG.md}`, affected units' technical/layperson changelogs and versions, `docs/versions.md`, `docs/user-guides/web-app/glamour-reader.md`; create `apps/web-app/scripts/copy-chara-notices.mjs` and generated `apps/web-app/public/licenses/xivcharakit.txt`, wiring the copy explicitly into `apps/web-app/package.json`'s build command. Modify `apps/web-app/src/components/about-modal.ts`, its existing test and the six web locale files for the notice link. Update the target root/unit `CLAUDE.md` facts.

**Consumes:** Completed migrations. **Produces:** Reviewable release artifacts and a beta-first rollout checklist; this task does not grant merge, package-publish or deployment permission.

- [ ] Add a failing notice-generation regression as `apps/web-app/scripts/copy-chara-notices.test.mjs`; run it with `node --test apps/web-app/scripts/copy-chara-notices.test.mjs` and wire that command into the web test gate. Require both installed `dist/LICENSE` and `dist/THIRD_PARTY_NOTICES.md` texts to appear verbatim. Implement generation from the dependency resolved by `packages/core`, not a guessed hoisted path or an export the package does not expose. Record attribution in core's `NOTICE`; add a localized `/licenses/xivcharakit.txt` link in `about-modal.ts` and pin it in `about-modal.test.ts`.
- [ ] Verify an isolated packed-core consumer resolves the exact new runtime dependency and additive APIs, with no workspace alias/link leakage. Test the existing advertised Node 18 floor as well as current development Node and local workerd before retaining that claim. If a floor fails, stop for an explicit engine/semver decision.
- [ ] Run `pnpm turbo run build type-check lint test --filter=...@xivdyetools/core`, `pnpm --filter xivdyetools-web-app run build:check`, `pnpm dead-code:check`, `pnpm docs:check-versions` and `pnpm docs:check-links`. Run relevant repository script/workflow invariant gates under its current guidance. Do not solve failures by weakening budgets, coverage, reachability or locale gates.
- [ ] Inspect the produced web/Worker bundles: no default library palette tables, direct XIVAPI browser transport, raw samples/images, test canaries or unexpected Node built-ins. Compare startup/lazy chunk sizes and worker CPU/memory observations with the pre-migration baseline.
- [ ] Verify legal links and module-worker CSP on a local production artifact, then on an authorized beta deployment. Use synthetic files and controlled API errors; preserve the API worker's acquisition/twin/rule/regional behavior. Record real producer-fixture tests separately from synthetic/corpus aggregate checks.
- [ ] Bump core for its additive public API and runtime dependency, and version affected bot/app units for their changes under current release policy. Preserve old exported APIs and document the intentional new-import behavior. Publish shared packages only via the existing manual trusted-publishing workflow when authorized.
- [ ] Open a PR against `main` when requested. Require fresh CI and beta acceptance before production approval; merging target `main` can deploy production, so it is not a harmless documentation step. Roll back with a revert restoring the previous dependency/consumer path through the normal PR flow, not a public runtime parser toggle or a force push.

## Definition of done

- Web Swatch Matcher, web Glamour Reader, `/swatch` and `/glamour` use the accepted library facade; old published parser/resolver entry points still pass their contract tests.
- The compatibility register has no unexplained differences or blocking aliases; intentional appearance/partial-document changes have independent assertions and localized UX.
- 8 KiB admission, safe projected output, latest-selection/clear semantics, offline dye behavior, equipment API contracts and all six locales pass their gates.
- Existing character grids, matching, sessions, equipment twins/rules/acquisition, icons and GPOSERS/Markdown output retain their host behavior.
- Installed-package/runtime, bundle, notice, CI and authorized beta checks are recorded. Production rollout follows a separate explicit release action.

## Follow-up projects, outside this first integration

1. **API-worker transport reuse:** Evaluate `xivcharakit/xivapi` behind `/v1/chara/*`, retaining preferred-twin/retired filtering, acquisition, ko/zh merging, icon proxy and KV/rate-limit contracts. Library `partial`, `unavailable` or `cancelled` must never be translated into the host's definitive null/missing-item result; cache only complete evidence with a new namespace. Budget library deadlines against the host's existing request deadline. This needs its own adapter design and tests.
2. **Broader XIVAPI offloading:** Revisit dye names, localization and build-time metadata using [the existing feasibility research](../../xivapi-dye-feasibility.md). Preserve offline core consumers and regional coverage until an explicit product decision changes them.
3. **Legacy API/data retirement:** Remove duplicate parser/resolver code and reconsider palette ownership only in a planned major core release, after external consumers have a migration path. `CharacterColorService` still serves independent grids, so replacing the chara pipeline alone does not make it dead code.
4. **Evercold:** Refresh actual game/producer export formats for eye/hair/skin free colors when available, update the library with permissioned regression fixtures, and upgrade the pinned consumer deliberately. Keep legacy palette support and avoid nearest-grid coercion of future direct colors.

## Draft review / execution handoff

Review the recommended ownership, intentional behavior changes and compatibility gate before starting implementation. Decide the execution method at that time under the target's agent guidance; this draft does not request a new chat, delegate work, install a dependency, publish a package, or authorize production changes.
