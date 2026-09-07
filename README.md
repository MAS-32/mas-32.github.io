# MAS · GitHub Pages

Published website: https://mas-32.github.io/

This repository holds the final static website in `site/` and its GitHub Actions deployment configuration. It is not the development repository. No build runs here; only `site/` is uploaded to Pages, so this README and provenance manifest are not website pages.

## First publication

- Source repository: MAS-32/mas-personal-site
- Source PR: https://github.com/MAS-32/mas-personal-site/pull/6
- Source branch: main
- Source merge commit: `d07d3c2b31a164557cdccd3af3aed3e6a4e4da7f`
- Source version: v0.6.0
- Build: `npm ci`, `npm test`, `npm run build`
- File hashes and sizes: `deployment.json`

The source repository remains separate and private. All website content, assets, styles and interaction code are copied from the verified source build without design or path changes. Three.js 0.180.0 runtime and its MIT license are included; the current homepage uses native Canvas and DOM rather than a live Three.js scene.

## Updating safely

1. Develop and test on a unique source-repository branch; merge a reviewed PR and preserve its stable tag.
2. Explicitly select the source merge commit to publish. Build that fixed commit in an isolated checkout.
3. Follow HTML, CSS and module references to prepare the full static artifact. Keep tests, development data, credentials and QA media out of this repository.
4. Fetch this repository's latest main. Create a new deployment branch; update `site/`, the source reference and `deployment.json`; review the diff and test the exact artifact locally.
5. Merge its PR. The Pages workflow deploys main automatically. Verify the HTTPS site, resource hashes, desktop/mobile layouts and key interactions after deployment.

Pages Source must be **GitHub Actions**. The workflow uses `github-pages`, minimal deployment permissions and pinned official Actions releases verified on 2026-09-07. Workflow structure follows [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages); release versions were checked in the official Actions repositories.

Rollback by reverting the faulty deployment commit on a new branch, reviewing and merging the revert, then verifying the resulting Pages deployment. Never force-push or move historical source tags.
