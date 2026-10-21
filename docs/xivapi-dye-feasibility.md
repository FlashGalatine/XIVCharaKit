# Dye-name lookup feasibility

**Follow-up status:** the maintainer approved implementation; the local working tree now replaces the name snapshot with cached optional lookup. See the [current API](api.md#cached-dye-names). The investigation below preserves the earlier probe and recommendation.

Investigated on 2026-10-20 after the maintainer requested checking XIVAPI or another source before bundling dye names. This records live read-only evidence and the recommendation made before implementation.

## Distinct datasets

The bundled character palettes are four generated creator/shader lookup tables derived from the supplied `human.cmp`: 26,208 entries for skin, hair, eyes, highlights, facial features, lips and face paint. `xivcharakit/palettes` loads these tables lazily, and appearance interpretation uses them to map a stored color index and applicable tribe/gender to RGB/hex. They are character-appearance tables, separate from equipment Stain names.

At the time of investigation, `xivcharakit/dyes` imported a compact 126-name English snapshot and exposed synchronous, no-I/O `getDyeName` plus source metadata. Removing that snapshot and introducing remote resolution was a deliberate API/behavior change, even before the first publication. The optional XIVAPI client then exposed item search and facewear lookup but had no Stain lookup.

## Verified upstream behavior

XIVAPI documents [single-row reads, selected fields, language decorators and batches of known row IDs](https://v2.xivapi.com/docs/guides/sheets/).

Two small public requests were made, using only generic known Stain IDs and an Origin header for the local preview. No character export, filename or player metadata was sent:

```text
GET https://v2.xivapi.com/api/sheet/Stain/3?fields=Name,Color&language=en
```

This returned HTTP 200, row ID 3, English name `Goobbue Grey`, numeric Color 9013124, and `Access-Control-Allow-Origin: *`. The Color field describes the equipment stain's color; it does not replace character skin/hair/eye palette tables.

A second request selected rows `0,3,125,126` and only `Name@lang(en)`, `Name@lang(ja)`, `Name@lang(de)`, `Name@lang(fr)`, using URL-encoded field syntax and the first response's exact version/schema:

```text
version=0874aee069e1e7c4
schema=exdschema@2:rev:e773c41a90aed788cf4c1c48469fa85618ef01fb
```

The batch returned HTTP 200, the requested version/schema and four rows, again with the wildcard CORS header. Row 0 had localized no-color names; rows 3 and 125 had nonempty names in all four requested languages; row 126 had empty names in all four. Blank rows must remain distinguishable from missing rows and network failure. These are dated API observations, not an exhaustive compatibility test or a real browser/deployed-origin acceptance check.

## Recommended direction

Use an optional asynchronous Stain-name lookup and request only the distinct dye IDs needed for the current inspection. Cache successful results by upstream version/schema and language. This avoids shipping the complete dye-name snapshot and avoids fetching the entire sheet for a few IDs. XIVAPI is a verified first source; another external provider is not needed to establish feasibility. Host-supplied name providers remain an option for consumers with their own offline data.

Parsing/inspection should continue to work locally without network access. Name resolution should be an explicit host action, retain original dye IDs in both channels, label valid zero locally as no dye, and keep raw IDs usable when lookup is cancelled, blank, missing or unavailable. It must not silently convert the existing synchronous function into a network operation.

Implementation would also need to update the current identifier-only privacy contract: dye IDs would join the outbound lookup inputs after an explicit action, while source documents, character metadata and unrelated appearance values remain local. Reuse the existing transport's validation, bounded-response, deadline, cancellation and caching patterns with appropriate Stain types and diagnostics. The demo, tests, documentation and artifact checks must be updated together when the snapshot is removed. Full browser verification and a new final candidate remain necessary for that implementation.

This investigation does not change or remove the character palette tables and does not settle their separate release disposition. No new dataset was bundled, and no npm publication or additional repository/account setting change was performed.
