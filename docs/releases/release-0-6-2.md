---
title: "Release 0.6.2 Evidence"
slug: "release-0-6-2"
status: "ready"
updated: "2026-06-30T15:06:47.000Z"
---
# Release 0.6.2

Evidence collected for changes from v0.6.1 to cb4c99c.

**0.6.2** Version · **1** Commits · **4** Changed files · **8** Checks · **0** Dirty entries

## Release gates

- [x] Package version resolved (required), 0.6.2
- [x] Git HEAD resolved (required), cb4c99ceee30c08c29e157ebfa7d60580ed3cf14
- [x] Working tree clean before evidence write (required), No git status entries before writing release evidence.
- [x] Release commits collected (required), 1 commit(s) from v0.6.1..HEAD
- [x] Verification commands recorded (required), npm test, node bin/dossier.mjs validate examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json docs/releases/0.6.1.dossier.json, node bin/dossier.mjs build examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json, cd react && npx tsc --noEmit, npm publish --dry-run --access public, brew install --build-from-source mrbagels/dossier/dossier, brew test mrbagels/dossier/dossier, brew audit --strict --formula mrbagels/dossier/dossier
- [ ] npm package dry run recorded, Run npm pack --dry-run --json before publishing.

## Verification evidence

Commands that completed before this evidence dossier was collected.

### npm test (passed)

```sh
npm test
```

- **Expected:** Command completes before release evidence collection.
- **Actual:** Completed before this release dossier was generated.

### node bin/dossier.mjs validate examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json docs/releases/0.6.1.dossier.json (passed)

```sh
node bin/dossier.mjs validate examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json docs/releases/0.6.1.dossier.json
```

- **Expected:** Command completes before release evidence collection.
- **Actual:** Completed before this release dossier was generated.

### node bin/dossier.mjs build examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json (passed)

```sh
node bin/dossier.mjs build examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json
```

- **Expected:** Command completes before release evidence collection.
- **Actual:** Completed before this release dossier was generated.

### cd react && npx tsc --noEmit (passed)

```sh
cd react && npx tsc --noEmit
```

- **Expected:** Command completes before release evidence collection.
- **Actual:** Completed before this release dossier was generated.

### npm publish --dry-run --access public (passed)

```sh
npm publish --dry-run --access public
```

- **Expected:** Command completes before release evidence collection.
- **Actual:** Completed before this release dossier was generated.

### brew install --build-from-source mrbagels/dossier/dossier (passed)

```sh
brew install --build-from-source mrbagels/dossier/dossier
```

- **Expected:** Command completes before release evidence collection.
- **Actual:** Completed before this release dossier was generated.

### brew test mrbagels/dossier/dossier (passed)

```sh
brew test mrbagels/dossier/dossier
```

- **Expected:** Command completes before release evidence collection.
- **Actual:** Completed before this release dossier was generated.

### brew audit --strict --formula mrbagels/dossier/dossier (passed)

```sh
brew audit --strict --formula mrbagels/dossier/dossier
```

- **Expected:** Command completes before release evidence collection.
- **Actual:** Completed before this release dossier was generated.


### Commits

| Commit | Summary |
| --- | --- |
| cb4c99c | Prepare package manager distribution |

### Changed files

| File | Status |
| --- | --- |
| README.md | changed |
| examples/showcase.html | changed |
| package-lock.json | changed |
| package.json | changed |

## Collected provenance

### Git HEAD

- **kind:** command
- **source:** git rev-parse HEAD
- **trust:** high

cb4c99ceee30c08c29e157ebfa7d60580ed3cf14

### Release range

- **kind:** command
- **source:** git
- **trust:** high

v0.6.1..HEAD

### Working tree status

- **kind:** command
- **source:** git status --short
- **trust:** high

Clean before evidence write.


## Release trust report

Claims downstream agents can consume before continuing a release.

### Sources

- **source-git-head:** Git HEAD (high)
  cb4c99ceee30c08c29e157ebfa7d60580ed3cf14
- **source-git-status:** Git status (high)
  Clean
- **source-verification:** Verification commands (high)
  npm test, node bin/dossier.mjs validate examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json docs/releases/0.6.1.dossier.json, node bin/dossier.mjs build examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json, cd react && npx tsc --noEmit, npm publish --dry-run --access public, brew install --build-from-source mrbagels/dossier/dossier, brew test mrbagels/dossier/dossier, brew audit --strict --formula mrbagels/dossier/dossier

### Claims

- **Release evidence was collected from cb4c99c.** (verified), confidence: high
  - Sources: source-git-head
  - Evidence: git-head
- **The working tree was clean before writing release evidence.** (verified), confidence: high
  - Sources: source-git-status
  - Evidence: git-status
- **Verification commands completed before evidence collection.** (verified), confidence: high
  - Sources: source-verification
  - Evidence: npm-test, node-bin-dossier-mjs-validate-examples-dossier-json-docs-product, node-bin-dossier-mjs-build-examples-dossier-json-docs-product-pr, cd-react-npx-tsc-noemit, npm-publish-dry-run-access-public, brew-install-build-from-source-mrbagels-dossier-dossier, brew-test-mrbagels-dossier-dossier, brew-audit-strict-formula-mrbagels-dossier-dossier

## Release evidence receipt

- **outcome:** ready-for-publish
- **owner:** release automation
- **date:** 2026-06-30T15:06:47.000Z
- **Changed files:** README.md, examples/showcase.html, package-lock.json, package.json
- **Commands:** npm test, node bin/dossier.mjs validate examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json docs/releases/0.6.1.dossier.json, node bin/dossier.mjs build examples/*.dossier.json docs/product/process-dossiers/process-dossiers-scope.dossier.json docs/releases/0.6.0.dossier.json, cd react && npx tsc --noEmit, npm publish --dry-run --access public, brew install --build-from-source mrbagels/dossier/dossier, brew test mrbagels/dossier/dossier, brew audit --strict --formula mrbagels/dossier/dossier
- **Follow-ups:** Run npm pack --dry-run --json before publishing.
