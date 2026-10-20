# XIVCharaKit rename record

The maintainer selected this identity on 2026-10-20:

| Surface | Prepared value |
| --- | --- |
| Project and demo display name | `XIVCharaKit` |
| Public npm package name | `xivcharakit` |
| Public entry points | `xivcharakit`, `/appearance`, `/palettes`, `/dyes`, `/xivapi` |
| Private workspace name | `xivcharakit-workspace` |
| Private demo workspace | `@xivcharakit/demo` |
| GitHub repository | `FlashGalatine/XIVCharaKit` |
| Packed development artifact | `xivcharakit-0.0.0.tgz` |

The package name, workspace dependency, consumer imports, scripts, frozen lockfile, installed-runtime fixtures and demo branding are updated locally. Package acceptance requires the exact `xivcharakit` name. Version 0.0.0 remains private. The previous package name was provisional and unpublished; no compatibility alias or npm deprecation is needed.

The GitHub repository was renamed to `FlashGalatine/XIVCharaKit` on 2026-10-20 after explicit maintainer authorization. This checkout's origin is now `https://github.com/FlashGalatine/XIVCharaKit.git`; the local directory remains unchanged. Dated review/CI links, the historical plan filename and earlier evidence retain their original spelling; they are not active package imports.

## Completed repository operation

Read-only checks on 2026-10-20 confirmed ADMIN access to the existing repository. The API returned 404 for the target repository; this is not a reservation. npm also had no public `xivcharakit` package during naming research; name acceptance and account publishing rights still need verification before publishing.

The authorized operation followed this sequence:

1. Confirmed the old repository, admin access, available target and PR 3 head `4f32d7b30c7ecdc4e3e3721ba81a0704e28317bb` with both hosted CI jobs successful.
2. Ran `gh repo rename XIVCharaKit --repo FlashGalatine/ffxiv-chara --yes`. The repository retained its node ID `R_kgDOVP28QQ`, default branch and admin access.
3. Updated this checkout with `git remote set-url origin https://github.com/FlashGalatine/XIVCharaKit.git`; fetch succeeded.
4. Verified [PR 3](https://github.com/FlashGalatine/XIVCharaKit/pull/3) remained open with the same head and green CI history, then attached its new URL to this chat. Verified that the old repository API URL redirects to the same repository ID and new canonical name.
5. Updated local npm repository/homepage/issue metadata and current documentation. Other clones and saved project paths can be updated deliberately; the local checkout did not need moving.

[GitHub's rename documentation](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) says web and Git traffic to the old location redirect. GitHub Pages project URLs and references to published Actions have separate limitations; this project currently has no deployed Pages site and its CI does not publish a reusable Action. Do not recreate the old repository name, which can override redirects.

The GitHub rename and this checkout's origin update are complete. Package/branding/MIT changes accompany this record in PR 3; hosted CI results quoted above cover the earlier fixture-only head. Evaluate CI for the PR's current head separately. No npm package was published, no Cloudflare service/domain was selected, and no deployment occurred.

## Local verification

Frozen offline installation, production builds, type checks, lint and fixture/palette/dye verification passed. The complete suite passed 324 library tests, 14 tooling tests and 20 browser scenarios (one intentional opt-in live skip). The renamed 40-file tarball passed installed JavaScript/TypeScript and all five runtime probes, with no runtime dependencies and zero native API requests. Desktop/mobile browser checks verified the exact XIVCharaKit title and wordmark, working synthetic-example inspection, and no horizontal overflow, error overlay or console errors. Original-resolution desktop/mobile captures were inspected locally. No active old-name imports remain in packages, apps, scripts or runtime fixtures.
