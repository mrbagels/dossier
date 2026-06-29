<div align="center">

# Dossier

### A self-contained, interactive HTML artifact for planning, deciding, editing, verifying, releasing, and handing work back to AI agents.

[![License: MIT](https://img.shields.io/badge/license-MIT-c81e4a.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-c81e4a.svg)](#requirements)
[![Version](https://img.shields.io/badge/version-0.5.3-7048e8.svg)](#release-status)
[![Output](https://img.shields.io/badge/output-single%20HTML%20file-7048e8.svg)](#how-dossier-works)
[![Runtime](https://img.shields.io/badge/viewer%20runtime-zero%20external%20assets-c81e4a.svg)](#how-dossier-works)
[![Agent Ready](https://img.shields.io/badge/agent%20ready-MCP%20%2B%20packets-0f7a52.svg)](#agent-workflows)
[![Blocks](https://img.shields.io/badge/built--in%20blocks-42-9a5b00.svg)](#block-catalog)
[![Live demo](https://img.shields.io/badge/live%20demo-open-7048e8.svg)](https://mrbagels.github.io/dossier/)

<a href="https://mrbagels.github.io/dossier/"><img src="docs/assets/showcase.png" alt="A Dossier rendered from one JSON file" width="860"></a>

**[Open the live demo](https://mrbagels.github.io/dossier/)** | **[Read the process scope](docs/product/process-dossiers/process-dossiers-scope.md)** | **[View the block cheatsheet](skill/references/blocks.md)** | **[Manual QA guide](docs/product/public-manual-qa.md)**

</div>

## What It Is

Dossier turns an AI response into a durable working artifact.

Instead of asking an agent for a Markdown plan that gets lost in a thread, ask it for a Dossier. It creates one `*.dossier.json` model, builds a polished HTML file, embeds the source model back into that file, and gives humans and agents a shared control surface.

```
AI produces structured model
        |
        v
*.dossier.json  ->  dossier build  ->  self-contained .html + .md
        ^                                  |
        |                                  v
agent reads packets  <-  human decisions, edits, evidence, release gates
```

Use it for planning, specs, research, code implementation packets, patch review, QA checklists, release gates, incident response, integration loops, and any process where humans and agents need to pass structured state back and forth.

## Why It Exists

| Old flow | Dossier flow |
|---|---|
| AI writes a long Markdown dump. | AI builds an interactive artifact with a typed source model. |
| Human comments in the chat. | Human decides inside the artifact with verdicts, notes, gates, and edits. |
| Agent re-reads an ambiguous transcript. | Agent reads versioned packets through HTML export or MCP tools. |
| Evidence is scattered across logs, PRs, and messages. | Evidence, claims, sources, commands, diffs, and receipts live together. |

The core idea: **a dossier is not just a document. It is a portable human-agent process packet.**

## Quick Start

Install from GitHub:

```bash
npm install -g github:mrbagels/dossier
```

Create and build a document:

```bash
dossier init my-plan --kind plan
dossier build my-plan.dossier.json
open my-plan.html
```

Or let an agent do it:

```text
Make me a Dossier for this refactor. Include work items, patch review, verification, risks, and a release gate.
```

The agent should write `my-refactor.dossier.json`, run `dossier build`, and give you `my-refactor.html` plus `my-refactor.md`.

## Choose A Workflow

| If you need... | Start with... | Main blocks |
|---|---|---|
| Strategy, options, tradeoffs | `dossier init roadmap --kind plan` | `review-board`, `decision-matrix`, `assumptions`, `action-items` |
| Actual code editing loop | `--kind implementation` | `process-board`, `code-editor`, `patch-set`, `diff-view`, `verification-run`, `process-receipt` |
| Review or bug bash | `--kind review` | `finding-list`, `diff-view`, `comment-thread`, `verdict-gate`, `trust-report` |
| Debugging | `--kind debug` | `evidence-log`, `patch-set`, `verification-run`, `decision-log` |
| Dependency dogfood | `--kind integration-loop` | `cycle-board`, `integration-report`, `upstream-response`, `process-receipt` |
| Release readiness | `--kind release` | `release-checklist`, `risk-register`, `verification-run`, `trust-report`, `process-receipt` |
| Incident response | `--kind incident` | `timeline`, `evidence-log`, `decision-log`, `verification-run`, `process-receipt` |
| A folder of docs | `dossier publish docs --out site` | catalog, cross-links, static site output |

## Example Gallery

The repo ships focused examples so people can see Dossier as more than a plan document. Build them all with:

```bash
node bin/dossier.mjs build examples/*.dossier.json
npm run site
```

| Example | Source | What it showcases | Use it when |
|---|---|---|---|
| [Block showcase](examples/showcase.html) | [`examples/showcase.dossier.json`](examples/showcase.dossier.json) | All 42 blocks, reader controls, export packets, process blocks, trust reports. | You want to inspect the full product surface. |
| [System overview](examples/dossier-overview.html) | [`examples/sample.dossier.json`](examples/sample.dossier.json) | Compact overview, hero, stats, flow, tables, and core export behavior. | You want the smallest useful starting point. |
| [Product launch](examples/product-launch.html) | [`examples/product-launch.dossier.json`](examples/product-launch.dossier.json) | Product microsite, hero media, FAQ, launch claims, and polished public copy. | You need a product page, feature brief, or launch note. |
| [Research brief](examples/research-brief.html) | [`examples/research-brief.dossier.json`](examples/research-brief.dossier.json) | Decision matrix, assumptions, references, and source-backed trust ledger. | You need research synthesis or competitive analysis. |
| [Engineering release](examples/engineering-release.html) | [`examples/engineering-release.dossier.json`](examples/engineering-release.dossier.json) | Release checklist, verification receipts, trust claims, and closeout. | You need public QA or release readiness. |
| [Incident response](examples/incident-response.html) | [`examples/incident-response.dossier.json`](examples/incident-response.dossier.json) | Timeline, evidence log, decision log, risk register, remediation board. | You need an incident or post-incident packet. |
| [Implementation packet](examples/implementation-packet.html) | [`examples/implementation-packet.dossier.json`](examples/implementation-packet.dossier.json) | Process board, editable code, patch set, diff review, and verification plan. | You need agentic code editing with human approval. |

The Pages build also emits a hosted gallery at `examples.html`, with every example cross-linked as a static Dossier site.

## Feature Map

| Area | What is included |
|---|---|
| Self-contained output | One HTML file, one Markdown export, embedded JSON model, no view-time network. |
| Reader UX | Sticky TOC, search, command palette, scroll progress, dark mode, section collapse, copy buttons, heading anchors, row anchors. |
| Agent usability | Embedded `#dossier-model`, agent digest, versioned packets, MCP read/write tools, starter templates. |
| Human control | Review boards, process verdicts, release gates, patch verdicts, diff file and hunk comments. |
| Editing | In-place text editing, `code-editor` blocks, edit packet export/import, `dossier serve` save-back. |
| Live authoring | Local dev server, reload, live model editor, patch import, JSON validation before write. |
| Code review | Unified diff parser, file summaries, hunk rendering, patch sets, review packets. |
| Evidence | Verification runs, evidence logs, process receipts, generation receipts, trust reports. |
| Trust | Structured source records, per-claim status and confidence, source/evidence links, MCP trust readback. |
| Publishing | `catalog` and `publish` commands for static dossier sites. |
| Export | HTML, Markdown, DOCX, PDF through Playwright, plus React SSR/components. |
| Extensibility | Plugin renderer registry for Node and React block components. |

## How Dossier Works

Dossier has one source of truth: the JSON model.

```json
{
  "dossierVersion": "1.0",
  "kind": "implementation",
  "meta": {
    "title": "Session refactor",
    "slug": "session-refactor",
    "status": "review"
  },
  "blocks": [
    { "type": "hero", "title": "Session refactor", "lede": "A bounded implementation packet." },
    { "type": "process-board", "title": "Work", "items": [] },
    { "type": "verification-run", "title": "Verification", "runs": [] },
    {
      "type": "trust-report",
      "title": "Trust report",
      "sources": [
        { "id": "verification", "label": "Verification", "kind": "command", "trust": "pending" }
      ],
      "claims": [
        { "id": "ready", "claim": "Ready for review.", "status": "unverified", "confidence": "unknown", "sources": ["verification"] }
      ]
    }
  ]
}
```

Build-time enrichments are baked into the HTML:

| Enrichment | Where it runs | Viewer requirement |
|---|---|---|
| Shiki code highlighting | Build time | None |
| Graphviz DOT diagrams | Build time | None |
| KaTeX math | Build time | None |
| SVG charts with axes, gridlines, and value labels | Build time | None |
| Figures | Build time, local images inlined | None |
| Mermaid diagrams | Optional Playwright path | Browser only for build |
| PDF export | Optional Playwright path | Browser only for export |

The generated HTML includes:

- `#dossier-model`: the embedded JSON source model.
- `#dossier-markdown`: the Markdown export.
- `#dossier-digest`: a compact agent-readable digest.
- Inlined CSS and runtime JavaScript.
- No external assets or remote scripts.

## Agent Workflows

Dossier is designed to be driven by agents, not only read by humans.

### Claude Code Skill

This repo ships a skill in [`skill/`](skill/). Link it into your skill directory:

```bash
ln -s "$(pwd)/skill" ~/.claude/skills/dossier
```

Then ask:

```text
Make me an implementation dossier for this change. Include source context, work items, proposed patch sets, diff review, test evidence, a trust report, and release gates.
```

The skill points the agent at:

- [`skill/SKILL.md`](skill/SKILL.md), the agent instructions.
- [`skill/references/blocks.md`](skill/references/blocks.md), copy-paste examples for every block.
- [`schema/dossier.schema.json`](schema/dossier.schema.json), the full contract.

### MCP Server

Run:

```bash
dossier mcp
```

Example MCP client config:

```json
{
  "mcpServers": {
    "dossier": {
      "command": "dossier",
      "args": ["mcp"]
    }
  }
}
```

Core MCP tools:

| Tool family | Tools |
|---|---|
| Render and validate | `dossier_render`, `dossier_validate`, `dossier_get_schema`, `dossier_get_starter` |
| Read human state | `dossier_read_decisions`, `dossier_read_process`, `dossier_read_edits`, `dossier_read_verdicts`, `dossier_read_release` |
| Review packets | `dossier_read_patch_review`, `dossier_read_diff_review` |
| Trust and provenance | `dossier_read_trust`, `dossier_record_claim` |
| Update models | `dossier_apply_edits`, `dossier_apply_process`, `dossier_apply_patch_review`, `dossier_record_run`, `dossier_attach_patchset` |
| Closeout | `dossier_resume_context`, `dossier_closeout_digest`, `dossier_closeout_model` |
| Packet schemas | `dossier_get_packet_schema` |

Packet contracts live in [`schema/packets/`](schema/packets/):

`process`, `edits`, `verdicts`, `release`, `patch-review`, `diff-review`, `trust`, and `closeout`.

## Process Dossiers

Planning is one process. Dossier now covers the rest of the AI-assisted work loop.

### Implementation Loop

1. Agent writes a context-rich implementation dossier.
2. Human reviews `process-board` items and `patch-set` proposals.
3. Human leaves notes, approves patches, or requests revision.
4. Agent reads packets through MCP or exported JSON.
5. Agent edits the real codebase in the host environment.
6. Verification runs, evidence, trust claims, release gates, and closeout receipts are appended.

### Release And Incident Flow

| Release | Incident |
|---|---|
| `release-checklist` tracks required gates. | `timeline` tracks events and mitigation. |
| `verification-run` records test and build evidence. | `evidence-log` records observations and links. |
| `trust-report` records which claims are grounded. | `decision-log` records operational decisions. |
| `process-receipt` closes out the release. | `process-receipt` closes out remediation. |

## Live Editing

Static artifacts work anywhere. For authoring, run:

```bash
dossier serve my-doc.dossier.json --open
```

`dossier serve` adds development-only live tools:

- Live reload when the source model changes.
- Save-back for `code-editor` blocks.
- Line numbers, search, JSON formatting, tab indentation, copy, and Cmd/Ctrl-S in editor blocks.
- A live model editor that can validate and save the full JSON model.
- Patch import that appends a validated `patch-set` block.

The saved model is validated before writing. Invalid saves return a 400 and do not touch disk.

## Block Catalog

42 built-in block types, plus plugins:

| Group | Blocks |
|---|---|
| Structure | `hero`, `section`, `two-col`, `tabs`, `prose` with paragraphs, bullets, and numbered lists |
| At a glance | `summary-cards`, `stat-strip` with deltas, `flow`, `timeline`, `callout` |
| Reference | `table`, `code`, `code-editor`, `patch-set`, `diff-view`, `diagram`, `references`, `faq`, `glossary` |
| Media and data | `figure`, `math`, `chart` with static labels, `footnotes` |
| Decisions | `decision-matrix`, `risk-register`, `assumptions`, `action-items`, `review-board`, `verdict-gate`, `decision-log` |
| Process | `process-board` with row anchors, `verification-run`, `evidence-log`, `process-receipt`, `finding-list`, `comment-thread`, `cycle-board`, `integration-report`, `upstream-response`, `release-checklist` |
| Trust | `trust-report`, `receipt` |

Every block has a copy-paste example in [`skill/references/blocks.md`](skill/references/blocks.md).

## CLI Reference

| Command | What it does |
|---|---|
| `dossier init [name] --kind <kind>` | Scaffold from a starter. |
| `dossier build <file> [--watch] [--plugin a,b]` | Validate and render to `<slug>.html` plus `<slug>.md`. |
| `dossier serve <file> [--open] [--port]` | Build, serve, live reload, and enable save-back tools. |
| `dossier validate <file>` | Validate a model without rendering. |
| `dossier diff <old> <new>` | Structural diff between two dossier models. |
| `dossier catalog <dir>` | Build an index model for a folder of dossiers. |
| `dossier publish <dir> --out site` | Build every dossier plus an `index.html` catalog into a static site. |
| `dossier export <file> --format docx\|md\|pdf` | Export to Word, Markdown, or PDF. |
| `dossier mcp` | Run the MCP server over stdio. |

## React

Dossier also ships a typed React port in [`react/`](react/):

```ts
import { renderDossier } from "@mrbagels/dossier-react";

const { html, md } = await renderDossier(model);
```

```tsx
import { DossierDocument } from "@mrbagels/dossier-react";

<DossierDocument model={model} animate />
```

The React dispatcher covers the built-in blocks, reuses the core design system, and falls back to registered Node renderers for plugin blocks.

## Plugins

Register custom blocks without forking:

```bash
dossier build my.dossier.json --plugin ./my-plugin.mjs
```

```js
export default function ({ registerBlock, esc }) {
  registerBlock("badge-row", (b) =>
    `<section class="ds-block" data-block="badge-row"><div class="ds-chips">` +
    (b.badges || []).map((x) => `<span class="ds-chip">${esc(x)}</span>`).join("") +
    `</div></section>`);
}
```

React plugins can call `registerComponent(type, Component)` for native component parity. See [`examples/plugins/badge-row.plugin.mjs`](examples/plugins/badge-row.plugin.mjs).

## Publishing And Embedding

Publish a dossier folder:

```bash
dossier publish docs --out site
```

Embed a generated artifact anywhere:

```html
<iframe src="my-doc.html" style="width:100%;height:80vh;border:0"></iframe>
```

Cross-link dossiers with `[[other-slug]]`. Use relative links when files sit together, or set `meta.baseUrl` for hosted sites.

## Optional Browser Features

Most features need no browser automation. Two features use Playwright:

```bash
npm i playwright mermaid
npx playwright install chromium
```

| Feature | Without Playwright | With Playwright |
|---|---|---|
| Mermaid diagrams | Render as source text with an install hint. | Render to static SVG at build time. |
| PDF export | Prints an install hint. | Exports a print-styled PDF. |

## Release Status

Current patch train:

| Version | Focus |
|---|---|
| `0.5.1` | Live editor adapter, model editor, patch import, review packets, expanded MCP write tools. |
| `0.5.2` | Static publishing, catalog index, React parity for process blocks. |
| `0.5.3` | Trust reports, provenance packet, MCP trust tools, README and public manual QA readiness. |

Manual QA entrypoint: [`docs/product/public-manual-qa.md`](docs/product/public-manual-qa.md).

## Development

```bash
git clone https://github.com/mrbagels/dossier.git
cd dossier
npm install
npm test
node bin/dossier.mjs build examples/sample.dossier.json
node bin/dossier.mjs build examples/showcase.dossier.json

cd react
npm install
npx tsc --noEmit
```

Project map:

| Path | Purpose |
|---|---|
| `src/` | Core Node generator, runtime, theme, validation, exports, serve mode. |
| `react/` | Typed React renderer and components. |
| `schema/` | Document schema and packet schemas. |
| `mcp/` | MCP server. |
| `skill/` | Agent skill and block references. |
| `examples/` | Sample and showcase models. |
| `docs/product/` | Durable product scope and QA docs. |
| `.github/workflows/` | CI and Pages demo deployment. |

Before opening a PR or cutting a release:

```bash
npm test
node bin/dossier.mjs validate examples/sample.dossier.json
node bin/dossier.mjs validate examples/showcase.dossier.json
cd react && npx tsc --noEmit
```

## Requirements

Node.js 18 or newer to build. Generated pages need only a browser.

## Contributing

Issues and PRs are welcome. Keep generated output self-contained, keep agent-readable contracts explicit, and add tests for new blocks or packets.

When adding a block type, update:

| Surface | File |
|---|---|
| Node render and Markdown | `src/generate.mjs` |
| React render | `react/src/blocks.tsx` |
| Types | `react/src/types.ts` |
| Schema | `schema/dossier.schema.json` |
| Validator | `src/validate.mjs` |
| DOCX export, if applicable | `src/export.mjs` |
| Agent docs | `skill/references/blocks.md` |
| Showcase | `examples/showcase.dossier.json` |
| Tests | `test/dossier.test.mjs` |

CI runs tests on Node 18, 20, and 22. The Pages demo redeploys on pushes to `next`.

## License

[MIT](LICENSE).
