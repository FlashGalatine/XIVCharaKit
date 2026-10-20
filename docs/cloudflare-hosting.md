# Cloudflare demo hosting proposal

Researched on 2026-10-20 after the maintainer selected Cloudflare for hosting exploration. This document proposes the next hosting milestone; it does not configure or deploy a service.

## Proposed fit

Use **Workers Static Assets** to serve the existing Vite output at `apps/demo/dist`. Cloudflare documents an assets-only deployment without a Worker script. This matches the current application: parsing and appearance run in the browser, and optional equipment requests go directly to XIVAPI. No backend or storage binding is needed for this flow. See [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/).

Build from the repository root using the pinned Node/pnpm versions, frozen installation and `pnpm build`. Serve only the checked demo output, never the repository root, private corpus or real producer test fixtures. Keep the existing synthetic public examples.

## Hosting preparation

The current security headers are Vite preview settings; building static files does not deploy those settings. Add a reviewed `_headers` file in the demo public directory so Vite copies it to the output. Workers Static Assets supports this file for asset responses. Carry over the existing CSP, referrer, MIME and permissions policies, then verify their actual deployed responses. See [Cloudflare headers](https://developers.cloudflare.com/workers/static-assets/headers/).

Add a dedicated demo Wrangler configuration pointing at its dist directory, separate from the installed-package runtime test configuration. Select the service name, account and initial hostname before deployment. The app currently has one page and no client-side route hierarchy; SPA fallback is not required for its present navigation. Verify missing assets fail rather than returning misleading HTML.

Run a local Cloudflare preview and browser acceptance before deployment. After an authorized preview deployment, verify headers, JavaScript/module-worker loading, lazy palettes, synthetic examples, file selection, explicit lookup/CORS/icons and stale-result handling from that origin. Do not claim localhost integration establishes deployed-origin compatibility.

Keep package publication/licensing and demo hosting decisions explicit. No account login, DNS change, Cloudflare resource creation or automatic deployment workflow is included in this fixture PR.
