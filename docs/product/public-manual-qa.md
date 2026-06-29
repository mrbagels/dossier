# Public Manual QA Guide

Use this guide before public announcements, manual dogfooding, or release verification.

## Scope

This checklist covers the `0.5.x` functionality closeout:

| Area | Must verify |
|---|---|
| Core rendering | Sample and showcase build to self-contained HTML and Markdown. |
| Reader UX | TOC, search, command palette, theme toggle, copy controls, anchors, collapsed sections. |
| Process workflows | `process-board`, `code-editor`, `patch-set`, `diff-view`, `verification-run`, `release-checklist`, `process-receipt`. |
| Trust workflows | `trust-report`, `receipt`, `evidence-log`, source/claim/evidence linkage. |
| Agent access | MCP render, validate, read packets, apply packets, record run, record claim, closeout. |
| Live authoring | `dossier serve`, live reload, editor save-back, model editor save-back, patch import validation. |
| Export | Markdown, DOCX, PDF when Playwright is installed. |
| React parity | React SSR/typecheck and native rendering for built-in blocks. |
| Publishing | `catalog` and `publish` static site output. |

## Automated Baseline

Run these from the repo root:

```bash
npm test
node --check src/generate.mjs
node --check src/export.mjs
node --check src/serve.mjs
node --check mcp/server.mjs
node bin/dossier.mjs validate examples/sample.dossier.json
node bin/dossier.mjs validate examples/showcase.dossier.json
node bin/dossier.mjs validate docs/product/process-dossiers/process-dossiers-scope.dossier.json
node bin/dossier.mjs build examples/sample.dossier.json
node bin/dossier.mjs build examples/showcase.dossier.json
node bin/dossier.mjs publish examples --out /tmp/dossier-public-qa
git diff --check
npm pack --dry-run --json
```

React parity:

```bash
cd react
npm ci
npx tsc --noEmit
```

## Manual Browser Smoke

Open:

- `examples/dossier-overview.html`
- `examples/showcase.html`
- `examples/product-launch.html`
- `examples/research-brief.html`
- `examples/engineering-release.html`
- `examples/incident-response.html`
- `examples/implementation-packet.html`
- `docs/product/process-dossiers/process-dossiers-scope.html`

Verify:

- Page loads without console errors.
- No external network is required after opening the file.
- Header controls are usable with keyboard and pointer.
- Search filters visible TOC/content.
- Command palette opens with Cmd/Ctrl-K and closes with Escape.
- Theme toggle switches light/dark.
- Copy buttons copy block text.
- Export menu can copy Markdown, digest, and JSON.
- Source modal opens and closes.
- Mobile width around 390px has no overlapping text or controls.
- Tables, math, tabs, code, diffs, and workflow textareas do not show nested scrollbar chrome at desktop or mobile widths.
- Print preview hides editor controls, TOC, palette, and transient UI.

## Process Workflow Smoke

In `examples/showcase.html`:

- Change at least one `process-board` verdict and note.
- Export process JSON and confirm `schema: "dossier.process/v1"`.
- Change a patch verdict and notes.
- Export patch review JSON and confirm `schema: "dossier.patch-review/v1"`.
- Add a file-level and hunk-level diff review.
- Export diff review JSON and confirm files and hunks are present.
- Check a release gate and add evidence notes.
- Export release JSON and confirm required gate state is present.

## Live Serve Smoke

Run:

```bash
dossier serve examples/showcase.dossier.json --port 4174 --open
```

Verify:

- Page reloads after saving the source JSON.
- `code-editor` blocks show enhanced controls.
- Search inside an editor works.
- JSON format button formats valid JSON and reports invalid JSON without saving.
- Cmd/Ctrl-S saves edited editor content back to the source model.
- Live model editor opens, validates JSON, and saves a harmless title change.
- Patch import accepts a valid `patch-set` and rejects an empty invalid `patch-set`.

Stop the server before release verification completes.

## MCP Smoke

Run an MCP client or a direct node probe against `mcp/server.mjs`:

- `dossier_validate` returns no errors for `examples/showcase.dossier.json`.
- `dossier_render` returns HTML and digest.
- `dossier_read_process` groups process packet verdicts.
- `dossier_read_edits` groups edits by target path.
- `dossier_read_patch_review` groups patch verdicts.
- `dossier_read_diff_review` groups file and hunk verdicts.
- `dossier_read_release` returns gate totals.
- `dossier_read_trust` returns source and claim totals.
- `dossier_record_run` appends a `verification-run`.
- `dossier_record_claim` appends or updates a `trust-report`.
- `dossier_closeout_model` appends a `process-receipt`.
- `dossier_get_packet_schema` returns all packet schemas.

## Release Gate

Before marking a release ready for public manual QA:

- All automated baseline commands pass.
- README version badge matches `package.json`.
- `examples/showcase.dossier.json` shows the release version in the integration report.
- `schema/packets/` includes every packet named in the README.
- GitHub release notes mention user-facing changes and QA status.
- CI is green for the release commit.
- Pages deployment completes successfully after push.

## Known External Gate

Publishing to npm requires registry authentication. If `npm whoami` returns `E401`, do not treat the release as blocked for GitHub/manual QA, but record npm publishing as an external credential step.
