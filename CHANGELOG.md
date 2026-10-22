# Changelog

## Unreleased

### 0.1.0-beta.3 candidate

- Normalize legacy tribe `Helion` to `Helions` while preserving stored evidence, Hrothgar race derivation and palette interpretation. Keep numeric tribe IDs unchanged. This fix is not included in published beta.2.
- Refresh official Anamnesis, Ktisis and Brio release/export/serialization references and record their unchanged format contracts.
- Configure manual demo deployment to `charakit.projectgalatine.com` with shared generated security headers, a `no-transform` response policy and Cloudflare hosting checks in CI.
- Record the verified initial demo deployment and draft the separate XIV Dye Tools integration plan.
- Prepare beta.3 metadata and manual publication instructions with the existing `next` tag and protected approval workflow. Publication remains a separate action.

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
