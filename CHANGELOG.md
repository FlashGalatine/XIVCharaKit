# Changelog

## Unreleased

### After beta.3 (not in the published 0.1.0-beta.3)

- Appearance policy `1.1.0`: read bit `0x80` of `Mouth` as the lip-color enable that Anamnesis, Ktisis and Brio all use. A cleared bit now reports the lip as inactive with the new reason `lipDisabled`, where `1.0.0` treated every lip index as enabled. The `AppearancePolicy.version` literal type is now `'1.1.0'`. An absent, null or invalid `Mouth` leaves lip activity unknown. Hrothgar ignores the bit; with an unknown race the lip is active only when the bit is set and unknown otherwise. Also treat bit `0x80` of `FacePaint` as the mirror flag it is in Brio and Ktisis: `FacePaint` 128 (no paint, mirrored) is now inactive instead of showing a face-paint swatch; every value with a non-zero low seven bits is unchanged. Consumers that switch exhaustively on `AppearanceReason` must handle `lipDisabled`.
- Add an `EYE_PAIRING_UNCONFIRMED` warning when one eye's extended color lands on the opposite eye's shader color but a custom color on the other eye hides the second match (Brio v0.7.2+ stores the two eye colors crossed). Colors are not swapped in that case. Document the Brio crossing and pin the reviewed producer sources in the fixture manifest.
- Pin the corrections, per-eye swatches and lip state of the four real producer exports in regression tests.
- XIVAPI: a Stain or Glasses row that the API reports as missing no longer fails the whole lookup. XIVAPI answers a row list that names a missing row with a 404 for the whole request; the client now recognises exactly that answer for the requested sheet, drops the row and asks again for the rest, at one request per missing row inside the 40-request budget. A missing Glasses row resolves to `notFound`; every other 404 is still a failure.
- XIVAPI: `createDyeNameResolver` reads inherited and non-enumerable options as `createXivapiClient` does instead of silently falling back to defaults; a browser's opaque redirect is reported as `REDIRECT_REFUSED`; a cached entry whose rows are out of order is a miss; host cache calls are capped at the request timeout and a slow or hung cache write can no longer lower a complete result; an all-zero off-hand no longer pairs with a main hand.
- Docs: on Cloudflare Workers create the client or resolver per request and share only the cache. A module-scope client hung queued lookups and then stalled the isolate under workerd.

## 0.1.0-beta.3 — 2026-10-22

- Normalize legacy tribe `Helion` to `Helions` while preserving stored evidence, Hrothgar race derivation and palette interpretation. Keep numeric tribe IDs unchanged. This fix is not included in published beta.2.
- Refresh official Anamnesis, Ktisis and Brio release/export/serialization references and record their unchanged format contracts.
- Configure manual demo deployment to `charakit.projectgalatine.com` with shared generated security headers, a `no-transform` response policy and Cloudflare hosting checks in CI.
- Record the verified initial demo deployment and draft the separate XIV Dye Tools integration plan.
- Prepare beta.3 metadata and manual publication instructions with the existing `next` tag and protected approval workflow.

## 0.1.0-beta.2 — 2026-10-22

- Publish through the existing manual GitHub Actions workflow, using `next`, protected environment approval and verified trusted-publisher provenance.
- Update release metadata, package documentation and dispatch instructions.
- No library API, runtime behavior, palette data or dependency changes from beta.1.

## 0.1.0-beta.1 — 2026-10-21

- Replace the bundled English dye-name snapshot with optional cached XIVAPI Stain-name requests. Preserve local parsing/raw IDs and require explicit demo lookup. Remove the unpublished synchronous name/metadata API and snapshot-generation commands.

- Prepare `xivcharakit@0.1.0-beta.1` for `next`, with a package README and manual, dry-run-by-default publishing workflow that checks and publishes the same tarball.

- Adopt the XIVCharaKit identity, `xivcharakit` package imports and demo branding; rename the GitHub repository to `FlashGalatine/XIVCharaKit`.

- License original code under MIT and include Square Enix attribution/non-affiliation notices in the README, demo and distributed legal files.

- Read and inspect full or selectively saved Anamnesis, Ktisis and Brio character documents with bounded parsing and embedded-image omission.
- Preserve stored values alongside identity, equipment, independent dye channels, facewear and diagnostics.
- Interpret appearance swatches with source-labelled creator, shader and extended colors, using versioned palette provenance.
- Retain stored dye IDs locally, including unknown/missing states; resolve English names through optional cached XIVAPI requests.
- Offer optional bounded XIVAPI equipment candidate and facewear lookup, including ambiguity, partial results, cancellation and caching.
- Provide a local reference demo with worker-based inspection, explicit equipment lookup and keyboard/mobile support.
- Check installed package consumers across Node, Node Worker, Chromium, module Web Worker and local workerd; prepare CI and reviewed package/static-site artifacts.

The maintainer published `xivcharakit@0.1.0-beta.1` through the bootstrap process; its tarball matched the reviewed candidate. Only the library is published; the root and demo workspaces remain private, and the website has not been deployed. MIT covers original code; game-derived materials retain separate notices and provenance.
