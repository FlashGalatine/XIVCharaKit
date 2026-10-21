# npm publication runbook

Prepared on 2026-10-20. The maintainer selected **xivcharakit@0.1.0-beta.1** on **next**. Preparation does not publish or reserve the npm name. At the maintainer's subsequent step-2 request, GitHub private vulnerability reporting was enabled and verified; publication and other account/protection changes remain separate actions.

**Current status — 2026-10-21:** the maintainer published beta.1, and its registry SHA-512 and downloaded tarball matched the reviewed candidate byte-for-byte. Both `next` and `latest` point to beta.1. npm rejected removal of `latest` with HTTP 400; the maintainer elected to leave both tags unchanged. The GitHub trusted-publisher connection is verified, and `NPM_RELEASE_ENABLED=true` is set. The first CI publication still needs a new version and the normal manual dispatch/approval process; do not republish beta.1. The earlier bootstrap checklist below is retained as setup history and procedure.

## Candidate and verification

Only `packages/chara` is publishable; root and demo stay private. The library has five ESM exports, declarations, zero runtime dependencies, a package-root README and full MIT/third-party legal files. `pnpm test:package` derives the tarball name from committed metadata, scans package/demo outputs and exercises installed consumers across five runtimes. It does not publish.

The manual-only [publish workflow](../.github/workflows/publish.yml) accepts expected version, tag and dry-run inputs. It requires `FlashGalatine/XIVCharaKit`, `refs/heads/main`, a matching committed version/tag and an unused registry version. Prereleases cannot target latest. Dry-run defaults to true and never enters the OIDC publication job. No push, merge or tag automatically publishes.

The verification job runs builds, types, lint, fixture/palette checks and dye-lookup tests, tooling/library/browser tests, audit and the final installed-package gate. It records the checked tarball's SHA-512 integrity, commit and package identity in `release.json`, then retains only that candidate and manifest for seven days. Publication downloads that run's artifact ID, compares both manifest and bytes with the separate verification-job integrity output and rechecks registry availability. It publishes the same tarball with lifecycle scripts disabled, without rebuilding or installing repository dependencies in the privileged job. Registry errors fail closed; only an exact-version 404 passes.

Build tooling stays pinned to Node 22.21.0 and pnpm 10.27.0. The publication job installs npm 11.21.0, compatible with that Node version and OIDC. Ordinary CI retains read-only permissions; only the manual publication job has `id-token: write` and declares the `npm-release` environment. [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [manual workflow dispatch](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## Before the first public release

1. Preparation and the subsequent notice/cached-dye changes were reviewed and merged through [PR 3](https://github.com/FlashGalatine/XIVCharaKit/pull/3) and [PR 4](https://github.com/FlashGalatine/XIVCharaKit/pull/4). Post-merge Ubuntu/Windows CI and the fresh hosted dry run passed for `90abb4721b35b3c8d564e8c1a6855fd8c9de0e8a`. MIT applies to original code and original synthetic fixture contributions; preserve the separate [notices](../THIRD_PARTY_NOTICES.md) and [provenance](data-provenance.md).
2. Confidential reporting is enabled and verified through [GitHub private vulnerability reporting](https://github.com/FlashGalatine/XIVCharaKit/security/advisories/new), as documented in [SECURITY.md](../SECURITY.md). The [data redistribution review](data-redistribution-review.md) records the maintainer's 2026-10-21 decision to ship the bundled appearance palettes with existing notices and provenance. The raw `human.cmp` remains excluded, and dye names use optional cached XIVAPI lookup. The retain/remove decision is closed; the decision does not grant third-party rights or change the MIT code-license boundary.
3. GitHub protections were configured and read back on 2026-10-21; see the exact [configuration below](#github-protections-configured-2026-10-21). `main` requires PRs, both GitHub Actions CI jobs, an up-to-date branch and resolved conversations, including for administrators. The **npm-release** environment permits only the `main` branch and requires **FlashGalatine** approval with administrator bypass disabled. After bootstrap and trusted-publisher verification, **NPM_RELEASE_ENABLED** was set to `true`; the variable does not itself configure protection.
4. From Actions → **Publish to npm** → Run workflow, select **main**, expected version **0.1.0-beta.1**, tag **next**, and leave **dry_run** checked. Inspect the results and download `npm-candidate`. Compare the tarball's SHA-512 with `release.json` and the prepare-step log. Verify its name/version, README, exports, license and notices. A dry run creates no npm record and uses no OIDC write permission. The [fresh dry run](https://github.com/FlashGalatine/XIVCharaKit/actions/runs/39541256961) passed for `90abb4721b35b3c8d564e8c1a6855fd8c9de0e8a`, with publication skipped; the downloaded 42-file candidate, source metadata, README/legal bytes and independent prepare-log SHA-512 were verified. This supersedes the [initial candidate](https://github.com/FlashGalatine/XIVCharaKit/actions/runs/39488195133). Rebuild and verify a new candidate if package inputs change.
5. Reconfirm the authenticated npm owner and 2FA locally. The previous live `npm whoami` returned **flashgalatine**; 2FA completion was maintainer-reported. Do not put passwords, recovery codes or tokens in chat or the repository. Registry name availability must be rechecked at publication; a 404 is not a reservation.

## GitHub protections configured 2026-10-21

- `main` has classic branch protection requiring `Verify (ubuntu-24.04)` and `Verify (windows-2025)`, each pinned to GitHub Actions app ID `15368`, with strict/up-to-date checks.
- Pull requests and resolved review conversations are required. Administrator enforcement is enabled; force pushes and branch deletion are disabled. Merge commits remain allowed, matching the existing workflow.
- The required approving-review count is zero for this solo-maintainer repository. PRs and CI remain mandatory; a second person's approval is not enforced. Continue the independent review process before merging.
- The `npm-release` environment has a single allowed deployment policy: branch `main`, with no tags allowed. Its required reviewer is **FlashGalatine**. Self-approval is permitted so the sole maintainer can approve a manually initiated release; this is a manual gate, not two-person authorization.
- Environment administrator bypass is disabled. The API creates the reviewer and branch policies; the GitHub settings UI was used to disable bypass, then all settings were read back through the API. Future API reconfiguration must also verify the bypass value rather than assume its default is safe.
- At initial protection setup, `NPM_RELEASE_ENABLED` was absent. After beta.1 bootstrap and trusted-publisher verification, it was set to `true`. No credentials or environment secrets were added. No real CI publication or approval was dispatched to test the gate. The ordinary dry run skips the publication job and therefore does not exercise manual approval or OIDC trust.

## One-time bootstrap

npm requires the package to exist before its trusted publisher can be configured. The first release therefore needs an explicitly authorized interactive publication of the reviewed tarball, using the logged-in owner and npm's 2FA prompt. Once the preceding gates and artifact review are complete, the command is:

```sh
npm publish <absolute-path-to-reviewed-xivcharakit-0.1.0-beta.1.tgz> --ignore-scripts --registry=https://registry.npmjs.org --access public --tag next
```

This is a real public registry write, not a dry run; do not execute it as part of preparation. Publish the downloaded, checked artifact rather than the workspace or an unverified rebuild. Local bootstrap does not claim GitHub Actions provenance. Verify published `dist.integrity` against the reviewed manifest, inspect `dist-tags`, and install the exact version in a fresh consumer. [Public package publishing](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages/), [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/).

The bootstrap consumed beta.1. Do not attempt to publish that version again through CI: npm versions are immutable. For the first CI release, prepare and review beta.2 (including committed version and documentation updates), merge it, run its dry run and confirm that the trusted publisher remains valid before dispatching publication.

## Trusted publisher and continuing manual releases

On the existing package's npm settings, add the GitHub Actions trusted publisher with these exact values:

| Setting | Value |
| --- | --- |
| Owner | FlashGalatine |
| Repository | XIVCharaKit |
| Workflow filename | publish.yml |
| Environment | npm-release |
| Allowed actions | Enable direct **npm publish**; separate dist-tag management is unnecessary |

On 2026-10-21, authenticated `npm trust list xivcharakit` using npm 11.21.0 confirmed an existing matching connection, ID `0f3ef803-6625-4812-ab46-7502bdb20037`, with `publish` and `stage publish` permissions and no separate dist-tag permission. No duplicate connection was created. GitHub's release-enable variable was then set and read back as `true`. Branch/environment protections remained intact, including the main-only deployment policy and disabled administrator bypass. The global npm 11.7.0 installation was unchanged; the newer CLI was invoked through a pinned `npm exec` package.

Explicitly enable direct publishing when creating this publisher. New configurations default to stage-only permission, which cannot authorize this workflow's `npm publish`. Staging permission may remain enabled, but this workflow does not use it; leave separate `npm dist-tag` permission disabled. [Allowed actions](https://docs.npmjs.com/trusted-publishers/#for-github-actions).

npm requires a newly configured publisher's first successful publication within two days. The connection's creation/expiry time and an actual successful OIDC publication have not been verified by this setup; confirm validity before the first CI release and recreate an expired connection if needed. Trusted CI publication uses OIDC, not the developer's local login or a stored npm write token. [Trusted publisher setup](https://docs.npmjs.com/trusted-publishers/).

The repository Actions variable `NPM_RELEASE_ENABLED=true` is now set following reporting, palette-disposition, protection and trust verification. To release each new version, merge its reviewed version/tag change, run the workflow dry run, inspect its artifact, then manually dispatch the same main commit/version/tag with dry-run unchecked. Approve the protected environment. The real dispatch repeats verification; inspect that run's artifact before approval. Publish future betas using `next`; leave the existing beta.1 tags as selected by the maintainer, and deliberately promote `latest` when a stable release is ready. After publication, compare registry integrity and dist-tags, install the released package, and check npm's provenance for the CI release.

No automation reserves versions, bumps metadata, moves tags, creates releases or merges PRs. Failed or concurrent publication is not retried by changing a version behind the workflow; review a new committed version instead. Disable releases by removing or setting the enable variable to false.

npm staged publishing is optional and is not used by this workflow. For a new name it creates a public placeholder, so it is not a substitute for a local dry run. [Staged publishing](https://docs.npmjs.com/staged-publishing/).
