# XIVAPI transport validation

Task 5 implements transport/cache. Task 6 candidate matching and Tasks 7–8 browser/demo/runtime checks remain pending. This is implementation evidence, not a security certification.

Transport tests use synthetic responses and injected fetch. No private corpus values were sent to XIVAPI, and automated resource-limit tests never contacted production. Official docs/OpenAPI and commit-pinned public sources supply the protocol reference.

The suite covers grouped decimal identities, request minimization, locales/schema/version, opaque cursors and continued fields, cursor/page/request/row/byte bounds, malformed/excessive JSON, identity changes, unrelated rows, partial preservation, missing rules, queue/concurrency bounds, operation deadlines, stalled headers/body, retries, independent shared cancellation, final-subscriber abortion, and backoff/queue cancellation. Cache tests cover aliases and failed refresh, namespace isolation, positive/negative expiry, detached values, invalid/cyclic/accessor/hooked data, completeness/association, property ordering, entry count and serialized capacity. A complete 5,000-row response demonstrates cache admission before copying or adapter invocation.

Initial behavior tests failed against stubs. Further failing regressions exposed queued operations starting at their expired deadline, nonenumerable serialization hooks, cache admission after cloning, ambiguous facewear HTTP 404s, and property-order-dependent cache hits. Corrections retain partial rows and fixed bounded issues.

Independent read-only review found one Important issue (404 false negatives) and one Minor issue (cache order interoperability). The implementer graded the latter Important because ordinary canonical-JSON adapters otherwise cannot hit valid entries. Both were reproduced and corrected. The review set aside candidate resolution, demo behavior, real browser CORS/browser/workerd execution, publication/hosting security, and packaging/docs still being edited. Future gates remain pending; the implementer verifies packaging/docs separately. No deferred code findings remain.

Final command evidence and handoff: [implementation progress](../implementation-progress.md). Contract and bounds: [XIVAPI reference](../xivapi.md).
