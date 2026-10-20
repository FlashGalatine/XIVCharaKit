# Local character inspector

The private `apps/demo` application consumes only the library's built public exports. It demonstrates local inspection and swatches, stored-value evidence, and a separate optional equipment lookup. It does not edit or write character files.

## Run and test

Use the repository's pinned Node and pnpm versions:

```sh
pnpm install --frozen-lockfile
pnpm --filter @xivcharakit/demo exec playwright install chromium
pnpm dev
```

For the production artifact, run `pnpm build`, then `pnpm preview` at `http://127.0.0.1:4173`. The preview supplies restrictive CSP, no-referrer, nosniff, and disabled camera/microphone/geolocation headers. Development HMR is not the header acceptance environment. A future static host must configure and verify these headers itself; the Vite preview configuration does not deploy them anywhere.

`pnpm test` runs the library suite and production-preview Chromium scenarios. All default API responses are mocked; the live case is deliberately skipped. Run only the demo tests with `pnpm --filter @xivcharakit/demo test`. Playwright owns port 4173 during its run; stop any separate preview on that port first. Reports are ignored local artifacts under `.superpowers`.

The separately invoked, low-volume live check uses only the public synthetic Ktisis example:

```powershell
$env:CHARA_LIVE_SMOKE = '1'
pnpm --filter @xivcharakit/demo exec playwright test e2e/live.spec.ts
Remove-Item Env:CHARA_LIVE_SMOKE
```

Optionally set `DEMO_QA_DIR` to an existing local directory to save the request audit and screenshot. This opt-in check contacts production XIVAPI; it is not an adversarial or load test.

## Local state and rendering

Files must have a `.chara` name and be at most 8 MiB before reading. A dedicated module Web Worker reads, parses, inspects, and interprets appearance. A five-second host timeout and worker termination bound superseded work; a worker improves responsiveness without promising a hard memory sandbox. The library still validates content and its own structural budgets, so renaming a pose file is insufficient.

An invalid replacement retains the previous valid inspection. Appearance failure after successful inspection retains the new stored values and reports unavailable swatches. Clear/replacement cancels work, discards stale results using generation guards, releases references, and revokes icon Blob URLs. This is not a promise of secure memory erasure.

Imported text uses text nodes. Names and scalar previews are bounded; JSON scalar types remain distinguishable. Raw trees load 200 children per page, with previous/next controls. Candidate disclosures show ten sorted matches per page without dropping candidates from the library result. Embedded image payloads are omitted by the reader and are never decoded or displayed. Swatches use canvas under the production CSP and retain accessible hex/source text.

The three public examples are exact copies of reviewed synthetic fixtures, not redistributed private exports. Their manifest identifies the source fixtures; `pnpm verify-fixtures` checks byte equality. Producer labels describe compatible field shapes rather than real-export certification.

Both stored dye channels show a local English name with the numeric ID, using the library's optional `/dyes` export. A valid zero is labelled `No dye (0)`; blank/unknown source IDs show `Unknown dye (ID)`. Missing, null and invalid fields remain distinct, and the raw values are unchanged. The [Stain snapshot](data-provenance.md#english-dye-name-snapshot) is versioned independently of appearance palettes. Names are available before equipment lookup and remain available during an API outage; dye IDs never enter requests.

## Network and storage boundary

Selecting a file and computing swatches sends no character-dependent requests. Bundled JavaScript/palettes and selected public examples are ordinary same-origin static fetches. There is no telemetry, automatic persistence, or document use of browser storage.

Only **Resolve equipment** starts XIVAPI work. It sends validated worn model identifiers and nonzero facewear IDs with fixed query/version/schema controls. File contents, names, authors, nicknames, appearance and dyes are excluded. An upstream still observes the equipment identifiers and ordinary connection metadata. Requests omit credentials and referrers. API failures preserve the local inspection; candidate sets do not establish original inventory items.

Icons are optional. The demo derives fixed XIVAPI asset paths from validated numeric icon IDs and a canonical version; remote URLs/names never become image sources. PNG responses are bounded to 256 KiB each, 2 MiB aggregate, and sixteen unique icons, with a five-second per-icon timeout. Signature/IHDR dimensions must be at most 256 by 256 before creating a local Blob URL. Icon failure does not invalidate matching results. There is no backend/proxy or persistent API cache.

## Verification recorded on 2026-10-19

The subsequent MIT adoption adds a persistent Square Enix attribution/non-affiliation footer. The MIT code license excludes game-derived materials. Footer links serve the complete `LICENSE.txt` and `THIRD_PARTY_NOTICES.txt`, generated from the repository's canonical legal files during production builds and served directly in development. These legal files are allowlisted static outputs; real producer test exports remain excluded.

The Task 7 default run passed 295 library tests and 19 Chromium browser tests, with one intentional live-test skip. Strict type checks, lint, fixture/palette verification, production builds, locked offline installation, and installed JS/TS/Node Worker package consumers passed. That tarball retained 37 allowlisted files and zero runtime dependencies. Dependency audits reported zero known vulnerabilities. The later dye and distribution milestones are recorded in [implementation progress](implementation-progress.md) and the [installed-runtime evidence](security/distribution-validation.md); this paragraph preserves Task 7's historical counts.

Browser cases cover all three examples, partial files, hostile literal text, image omission, actual canvas pixels, keyboard selection/clear, invalid replacements, pre-read limits, worker timeout, unavailable palettes, raw scalar types/paging, long names, API failure, all candidate pages, overlapping files/clear during lookup, request minimization and storage canaries. Cancellation and late-response handling were verified against controlled upstream responses, without security probes against production.

Initial thirteen behavior tests failed against the stub. Subsequent regressions failed before the relevant corrections. Independent read-only review found two Important issues (appearance failure state and reversible raw pagination) and one scalar-type ambiguity, elevated to Important by the implementer because raw evidence must remain distinguishable. All three were corrected with regressions; no deferred code findings remain. One intermediate browser run failed before application navigation with Chromium `ERR_NO_BUFFER_SPACE`; the focused rerun and subsequent full run passed.

### Live integration evidence

An ordinary synthetic Ktisis lookup passed both interactive in-app browser inspection and the separate opt-in Chromium test. It resolved Body model `361/5` (packed `328041`) to **Bloodhempen Chestwrap of Casting**, and facewear `12` to **Brown Oval Spectacles**. The observed canonical version was `5c744a8d8daafb25`, schema `exdschema@2:rev:e773c41a90aed788cf4c1c48469fa85618ef01fb`.

The recorded test observed five GETs: version, item search, Glasses row list, and two asset requests. All returned HTTP 200 with `Access-Control-Allow-Origin: *`; request assertions found no body, Cookie, Authorization or Referer. Both icons decoded as 80 by 80 pixels and used local Blob URLs. These are dated observations from localhost, not a guarantee of future upstream availability or a deployed-origin check. No private corpus identifiers were used.

## Visual validation and fidelity ledger

A generated 1374 by 1145 desktop concept served as the styling reference. The implementation uses ordinary DOM/CSS, system fonts and canvas; no concept image is shipped. Playwright captured full-page desktop screenshots at that native viewport and mobile screenshots at 390 by 844. The in-app browser was also inspected interactively at the native viewport. The concept and both captures were opened at original resolution for direct comparison.

| Reference point | Render comparison and disposition |
| --- | --- |
| Wordmark, title, primary action and example copy | The wordmark is now `XIVCharaKit`, replacing the original `ffxiv-chara` name. The `Library demo` hierarchy, character inspector heading, Choose/Resolve/Clear actions and three producer examples remain. Dynamic states add factual status copy. |
| Desktop structure | Retained the 296-pixel pale rail, white content area, teal actions, thin borders and small corner radii. |
| Typography | Preserved large page title, section hierarchy and monospaced evidence. System fonts avoid external requests; exact generated glyph shapes are not reproduced. |
| Appearance cards | Retained the two-by-four desktop grid and source disclosures. Added a thin canvas border after inspection showed white swatches disappearing against white. Actual library colors/availability replace illustrative concept values. |
| Equipment | Retained four evidence columns and the right-side explicit lookup action. Stored models and both dye IDs occupy their correct columns; illustrative concept values were corrected. |
| Stored values and vertical rhythm | Moved the live status into the rail and made the stored-value hint visible in the closed summary after comparison. Functional help, paging and status content can extend the page beyond the concept height. |
| Mobile | Stacked file controls before content, retained two swatch columns, and added a keyboard-focusable horizontal equipment region with a scroll hint. Verified no horizontal page overflow. |

The final comparison found no material unresolved layout mismatch. Conditional cancellation, failure messages, source evidence, real data and pagination are intentional functional additions. Desktop/mobile/live captures and the generated reference remain local review artifacts; no private source images or files were added to the public artifact.
