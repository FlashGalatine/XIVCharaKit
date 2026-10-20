# Optional XIVAPI transport

The optional `xivcharakit/xivapi` export provides `createXivapiResolver`, `createXivapiClient`, `createMemoryCache`, and their types. Tasks 5–6 implement transport/cache and candidate matching. Importing the export or creating a client/resolver performs no I/O. The adapter has no runtime dependencies and uses standard fetch, readable streams, URL, and AbortSignal APIs.

```ts
import { createXivapiClient, createMemoryCache } from 'xivcharakit/xivapi';

const client = createXivapiClient({ cache: createMemoryCache() });
// Run after the host's explicit equipment-lookup action.
const items = await client.searchItems([{ slot: 'Body', base: 361, variant: 5 }]);
const facewear = await client.getGlasses(8);
```

`searchItems(models, { signal? })` accepts known slots with validated uint16 lanes. At most 24 supplied entries collapse to twelve unique slot/key lookups; conflicting models for one slot are invalid. Validated scalar identities are captured before asynchronous work. Queries use fixed grammar and encoded decimal packed keys, including weapon triples. Extra properties never reach requests. `getGlasses(id, { signal? })` accepts uint16 row IDs and uses `sheet/Glasses?rows=id`. Only a validated successful empty list proves absence; HTTP 404 can describe a bad endpoint/version/schema and stays unavailable.

Both return `LookupResult` with detached rows ordered by row ID, canonical upstream `version`/`schema` or null, bounded issues, and status:

| Status | Meaning |
| --- | --- |
| `complete` | All pages and received rows passed validation; an empty set is definitive for this lookup/version |
| `partial` | Valid associated rows were retained, but a page, row, budget or upstream check prevented completeness |
| `unavailable` | An incomplete lookup retained no valid associated rows |
| `cancelled` | This subscriber cancelled; no rows are returned to it |

Item rows retain decimal `modelMain`, nullable `modelSub`, supported slots, selected localized names, numeric icon reference, nullable level/UI category, and rules. Missing/invalid rule values stay null; missing race/gender columns stay absent from `rules.wear`. This layer does not select preferred candidates, infer eligibility/acquisitions/off-hand relationships, or fetch icons. Names are untrusted text. Invalid/conflicting/unassociated rows prevent completeness.

## Host options

| Option | Default and accepted values |
| --- | --- |
| `baseUrl` | `https://v2.xivapi.com/api`; trusted custom HTTPS API root with no credentials/query/fragment |
| `version` | `latest`; 1–64 ASCII letters/digits/dots/underscores/hyphens, starting with a letter or digit |
| `schema` | `exdschema@2:ver:request`, or `exdschema@2:rev:` plus 1–40 lowercase hexadecimal digits |
| `languages` | en/ja/de/fr; a nonempty subset, deduplicated and sorted |
| `timeoutMs` | 10,000; positive integer up to 10,000, covering headers and body |
| `maxPages` | 20; positive integer up to 20 |
| `fetch` / `cache` | Optional trusted host adapters; no implicit cache |

Invalid host options throw `XivapiInputError` (`INVALID_OPTIONS`); invalid direct identifiers throw `INVALID_LOOKUP` before requests. Upstream issue codes include `NETWORK_ERROR`, `TIMEOUT`, `DEADLINE`, `UPSTREAM_UNAVAILABLE`, `REDIRECT_REFUSED`, `BODY_UNAVAILABLE`, `MALFORMED_RESPONSE`, `RESPONSE_IDENTITY`, `INVALID_ROW`, `CONFLICTING_ROW`, `INVALID_CURSOR`, `REPEATED_CURSOR`, `PAGE_LIMIT`, `ROW_LIMIT`, `REQUEST_LIMIT`, `RESPONSE_LIMIT`, `RETRY_LIMIT`, `QUEUE_FULL`, and `CANCELLED`. Native errors and upstream error bodies are never quoted.

Requests omit credentials, use no-referrer policy/manual redirects, and send only `Accept: application/json`. No authorization or forbidden browser User-Agent is set. Injected fetch can change behavior and remains host responsibility. Document/file names, authors, character information, appearance, and stains are not accepted by the lookup contract. Equipment identifiers can still be distinctive and upstream sees ordinary connection metadata. Custom endpoint support is not an SSRF firewall: server hosts must restrict any configuration exposed to untrusted callers.

## Work and response bounds

Page limits count item-search cursor pages. A whole resolution permits at most twenty search pages plus one nonpaginated facewear sheet response, within its combined forty-request budget.

An operation includes version lookup, queueing, cache calls, pages and retry backoff: 30 seconds, 40 requests, and at most 20 pages. A client instance permits two active operations and sixteen queued operations. Equivalent lookups coalesce with independent subscriber cancellation and detached results. Shared transport aborts when the last subscriber cancels or its deadline expires. A late subscriber inherits the remaining deadline. Retry once for 429/503 only; absent Retry-After uses 250 ms, while supplied numeric/date delays must be finite and at most two seconds. Cancellation, other HTTP errors and redirects are never retried.

Bodies require bounded readable streams: 2 MiB per response, 10 MiB aggregate exposed decoded chunks including errors/retries. Failure cancels consumption; no unbounded JSON fallback. The shared bounded parser admits depth 32, 100,000 nodes including properties, keys of 1,024 and ordinary strings of 65,536 code units, with duplicate decoded key rejection and finite/safe-integral number rules before building an over-limit graph. API Base64Image keys receive ordinary limits, without the character reader's omission exception. Rows are limited to 500 per page and 5,000 encountered per operation including duplicates, names to 1,024, and opaque cursors to 2,048 code units. These are resource controls, not hard heap/CPU guarantees; async deadlines cannot preempt synchronous admitted parsing.

## Row cache contract

`ResolutionCache.get(key)` and `set(key, CachedRows, ttlMs)` store normalized public rows, never character selections. Namespace format 1 includes API root, immutable version, canonical schema, field/locale selection and the sorted slot/model set or glasses ID. Grouped keys keep an incomplete group from becoming a complete miss. Canonical version keys are sixteen lowercase hexadecimal digits; canonical schemas use full forty-digit revisions. Aliases resolve via `/version` and refresh after ten minutes. Failed refresh discards stale mappings and cannot read previous-version cache entries. Moving schemas also refresh after ten minutes; continuation pins the first canonical response schema. Inconsistent/invalid response identities are incomplete. Failed version resolution permits alias requests, but storage still requires canonical response identities and alias-keyed cache reads never occur.

Only complete positive sets use seven-day TTL and complete empty sets ten minutes; partial/failed/cancelled sets are never cached. Inputs undergo iterative structural/JSON-shape/cycle admission before copying/serialization, then identity/completeness/association/row checks. Invalid entries are misses; oversized complete results remain usable without caching. Cache errors cannot manufacture complete data. The optional memory cache caps 128 LRU entries and 8 MiB serialized data including keys, with TTL and detached values. Custom adapters own capacity/storage policy. Object property order does not affect validity; unknown/invalid fields remain rejected.

Protocol references, verified 2026-10-19: official [search/pagination](https://v2.xivapi.com/docs/guides/search/), [fields/languages/row lists](https://v2.xivapi.com/docs/guides/sheets/), [pinning](https://v2.xivapi.com/docs/guides/pinning/), and [OpenAPI](https://v2.xivapi.com/api/openapi.json); commit-pinned source conventions are linked in the implementation plan. [Installed-package consumers](security/distribution-validation.md) now verify the mocked contract in Node/Node Worker, Chromium/module Web Worker and local workerd. Task 7's [live browser check](demo.md#live-integration-evidence) verified direct CORS, canonical upstream identities, and two icons from localhost in Chromium. A future deployed origin still requires acceptance checks.

## Equipment candidate resolution

`createXivapiResolver(options?: XivapiOptions): EquipmentResolver` uses the same host configuration and bounds as the low-level client. Its `resolve(input: EquipmentResolveInput, options?: { signal?: AbortSignal }): Promise<EquipmentResolution>` accepts only `models` and optional `glassesId`. Call it after an explicit host lookup action. Pass inspected worn models; no document or character information is required. All identifiers and request options are validated before I/O. Empty models with no facewear perform no I/O. A requested zero ID/model remains an explicit lookup; the resolver does not turn zero into absent input.

Each requested slot appears in `result.items` with a detached `model`, decimal `modelKey`, status, `ambiguous`, and all `candidates` in ascending item ID order. Only received candidates are known: `ambiguous: false` with an incomplete status does not prove uniqueness. Candidate fields are `itemId`, localized `names`, `iconId`, nullable `levelEquip`/`uiCategory`, nullable/partial `rules`, and `viaMainHand`. Matching a model identifies possible items, not the original inventory identity. No preferred twin, eight-alternate cap, retired-name filtering, inferred acquisition, or job/race eligibility decision is imposed. Unobtainable-looking names remain candidates without guessed retirement metadata; missing rule evidence remains unknown.

`result.facewear` is null only when no ID was requested. Otherwise it contains `id`, status, and normalized Glasses candidates (`rowId`, names, iconId). `result.upstream.items` and `.facewear` each contain version/schema evidence, or null for an unrequested component; requested failures can have null identities. Do not combine these into an invented common version. If a changing alias cannot be resolved and the two responses differ, both identities remain visible. Component outages do not hide successful results from the other component. Issues are merged under `items`/`facewear` paths and remain capped at 64 with a truncation marker.

| Status | Meaning |
| --- | --- |
| `matched` | Complete evidence produced at least one candidate |
| `notFound` | A complete successful lookup produced no candidate for this input; the stored identifier is retained |
| `partial` | Some evidence is incomplete; this includes an empty slot within a batch that retained rows elsewhere |
| `unavailable` | The lookup could not retain valid row evidence |
| `cancelled` | This caller cancelled; no candidate results are returned to it |

Pure matching first associates item rows by both slot and packed model. Shared armor keys cannot cross slots, while ring rows can match both requested ring slots. Main-hand candidates are matched to the requested main-hand key. For an off-hand, only those main-hand rows whose `ModelSub` equals the off-hand key are paired; a copied main-hand key also pairs. Paired candidates take priority over standalone OffHand rows and carry `viaMainHand: true`. Other main-hand families sharing that ModelSub never enter the search. If no contextual candidate pairs, direct OffHand matching provides shields and other independent models. Missing main-hand `ModelSub` leaves off-hand status partial with `INCOMPLETE_OFFHAND_CONTEXT`, including when no candidate was retained. Absent main-hand input permits only direct OffHand matching. Partial upstream batches stay partial for every requested slot, even slots with no candidates; an outage never becomes notFound.

One resolve call owns one coalesced queue entry, 30-second deadline, and combined 40-request/10-MiB/5,000-encountered-row budget across item and facewear lookup, including version resolution, cache reads, retries and queue time. Items run before facewear inside that operation; at most two operations can consume requests at once and sixteen can wait. Successful earlier components remain usable if a later component fails. Caller cancellation interrupts the entire operation independently of other subscribers. The shared cache stores upstream model rows only; off-hand selections are recalculated with the current main hand on every resolve, and final character-specific selections are never cached.
