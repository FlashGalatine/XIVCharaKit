# npm publication runbook

Prepared on 2026-10-20. The maintainer selected **xivcharakit@0.1.0-beta.1** on **next**. This preparation does not publish, reserve the npm name, authorize a merge or change account settings.

## Candidate and verification

Only `packages/chara` is publishable; root and demo stay private. The library has five ESM exports, declarations, zero runtime dependencies, a package-root README and full MIT/third-party legal files. `pnpm test:package` derives the tarball name from committed metadata, scans package/demo outputs and exercises installed consumers across five runtimes. It does not publish.

The manual-only [publish workflow](../.github/workflows/publish.yml) accepts expected version, tag and dry-run inputs. It requires `FlashGalatine/XIVCharaKit`, `refs/heads/main`, a matching committed version/tag and an unused registry version. Prereleases cannot target latest. Dry-run defaults to true and never enters the OIDC publication job. No push, merge or tag automatically publishes.

The verification job runs builds, types, lint, fixture/palette/dye checks, tooling/library/browser tests, audit and the final installed-package gate. It records the checked tarball's SHA-512 integrity, commit and package identity in `release.json`, then retains only that candidate and manifest for seven days. Publication downloads that run's artifact ID, compares both manifest and bytes with the separate verification-job integrity output and rechecks registry availability. It publishes the same tarball with lifecycle scripts disabled, without rebuilding or installing repository dependencies in the privileged job. Registry errors fail closed; only an exact-version 404 passes.

Build tooling stays pinned to Node 22.21.0 and pnpm 10.27.0. The publication job installs npm 11.21.0, compatible with that Node version and OIDC. Ordinary CI retains read-only permissions; only the manual publication job has `id-token: write` and declares the `npm-release` environment. [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [manual workflow dispatch](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## Before the first public release

1. Review and merge the prepared changes, including source/data-rights disposition and prerelease limitations. MIT applies to original code; attribution alone does not resolve all game-data rights. Preserve the separate [notices](../THIRD_PARTY_NOTICES.md) and [provenance](data-provenance.md).
2. Establish a verified confidential security-reporting route and update [SECURITY.md](../SECURITY.md). As checked on 2026-10-20, GitHub private vulnerability reporting is disabled and main has no classic branch protection. These settings were not changed by preparation.
3. Configure reviewed main-branch protection and create the GitHub environment **npm-release**, restricting deployment branches to main and enabling available required-reviewer protection. Verify the repository's plan supports the chosen rules. Leave the repository Actions variable **NPM_RELEASE_ENABLED** absent until setup is complete; setting it to the literal `true` acknowledges readiness but does not itself configure protection.
4. From Actions → **Publish to npm** → Run workflow, select **main**, expected version **0.1.0-beta.1**, tag **next**, and leave **dry_run** checked. Inspect the results and download `npm-candidate`. Compare the tarball's SHA-512 with `release.json` and the prepare-step log. Verify its name/version, README, exports, license and notices. A dry run creates no npm record and uses no OIDC write permission. Hosted execution remains to be verified after merge.
5. Reconfirm the authenticated npm owner and 2FA locally. The previous live `npm whoami` returned **flashgalatine**; 2FA completion was maintainer-reported. Do not put passwords, recovery codes or tokens in chat or the repository. Registry name availability must be rechecked at publication; a 404 is not a reservation.

## One-time bootstrap

npm requires the package to exist before its trusted publisher can be configured. The first release therefore needs an explicitly authorized interactive publication of the reviewed tarball, using the logged-in owner and npm's 2FA prompt. Once the preceding gates and artifact review are complete, the command is:

```sh
npm publish <absolute-path-to-reviewed-xivcharakit-0.1.0-beta.1.tgz> --ignore-scripts --registry=https://registry.npmjs.org --access public --tag next
```

This is a real public registry write, not a dry run; do not execute it as part of preparation. Publish the downloaded, checked artifact rather than the workspace or an unverified rebuild. Local bootstrap does not claim GitHub Actions provenance. Verify published `dist.integrity` against the reviewed manifest, inspect `dist-tags`, and install the exact version in a fresh consumer. [Public package publishing](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages/), [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/).

The bootstrap consumes beta.1. Do not attempt to publish that version again through CI: npm versions are immutable. For the first CI release, prepare and review beta.2 (including committed version and documentation updates), merge it, and run its dry run before configuring trust.

## Trusted publisher and continuing manual releases

On the existing package's npm settings, add the GitHub Actions trusted publisher with these exact values:

| Setting | Value |
| --- | --- |
| Owner | FlashGalatine |
| Repository | XIVCharaKit |
| Workflow filename | publish.yml |
| Environment | npm-release |
| Allowed actions | Enable direct **npm publish**; separate dist-tag management is unnecessary |

Explicitly enable direct publishing when creating this publisher. New configurations default to stage-only permission, which cannot authorize this workflow's `npm publish`. Staging permission may remain enabled, but this workflow does not use it; leave separate `npm dist-tag` permission disabled. [Allowed actions](https://docs.npmjs.com/trusted-publishers/#for-github-actions).

Configure this when the first CI release is ready: npm requires a newly configured publisher's first successful publication within two days. Use the npm web settings; local npm 11.7.0 lacks the newer trust CLI. Trusted CI publication uses OIDC, not the developer's local login or a stored npm write token. [Trusted publisher setup](https://docs.npmjs.com/trusted-publishers/).

After the reporting/rights/protection/trust setup is verified, set the repository Actions variable `NPM_RELEASE_ENABLED=true`. To release each new version, merge its reviewed version/tag change, run the workflow dry run, inspect its artifact, then manually dispatch the same main commit/version/tag with dry-run unchecked. Approve the protected environment if required. The real dispatch repeats verification; inspect that run's artifact before approval. Keep beta releases on `next`; a stable `latest` release needs a deliberate metadata/tag change. After publication, compare registry integrity and dist-tags, install the released package, and check npm's provenance for the CI release.

No automation reserves versions, bumps metadata, moves tags, creates releases or merges PRs. Failed or concurrent publication is not retried by changing a version behind the workflow; review a new committed version instead. Disable releases by removing or setting the enable variable to false.

npm staged publishing is optional and is not used by this workflow. For a new name it creates a public placeholder, so it is not a substitute for a local dry run. [Staged publishing](https://docs.npmjs.com/staged-publishing/).
