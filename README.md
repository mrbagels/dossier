<div align="center">

# Dossier

**One JSON file in, a beautiful, self-contained, agent-readable HTML document out.**

[![License: MIT](https://img.shields.io/badge/license-MIT-c81e4a.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-c81e4a.svg)](#requirements)
[![Runtime deps](https://img.shields.io/badge/runtime%20deps-0-c81e4a.svg)](#architecture)
[![Output](https://img.shields.io/badge/output-self--contained-7048e8.svg)](#architecture)
[![Version](https://img.shields.io/badge/version-0.1.0-7048e8.svg)](#)

</div>

Dossier renders a single JSON document model into a polished, **fully self-contained**
HTML artifact (plus a Markdown export). The visible page is a projection of an embedded
`#dossier-model` JSON island, so **humans get a themed, interactive document** and
**agents read one structured block** instead of scraping the DOM. No server, no external
assets, works offline — email it, commit it, or `<iframe>` it into your wiki.

```
   doc.dossier.json  ──►  dossier build  ──►  doc.html   (+ doc.md)
                                              ├─ themed, interactive, responsive
                                              ├─ #dossier-model island (agents read this)
                                              └─ zero external assets (works offline)
```

---

## Table of contents

- [Why Dossier](#why-dossier)
- [Features](#features)
- [Quick start](#quick-start)
- [Use it from an agent (the skill)](#use-it-from-an-agent-the-skill)
- [Authoring a dossier](#authoring-a-dossier)
- [The review / triage surface](#the-review--triage-surface)
- [Architecture](#architecture)
- [React](#react)
- [Embedding](#embedding)
- [Development](#development)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

## Why Dossier

LLMs and humans both produce a lot of structured documents — research reports, plans,
specs, decision records, runbooks, reviews. Plain Markdown is hard to navigate and
plain HTML is hard for an agent to read back. Dossier gives you **both at once**:

- **For humans** — a clean, modern, editorial/SaaS reading surface with navigation,
  search, theming, and one-click export.
- **For agents** — the complete structured model lives in `#dossier-model`. Read one
  block; no scraping. Markdown and an "agent digest" export are derived from the same model.
- **For your stack** — one portable file. Link it, embed it, version it. It is a
  *companion* to your docs site, not a replacement.

## Features

| | |
|---|---|
| **Self-contained** | One HTML file. CSS, JS, highlighted code, and diagrams are all inlined. No network at view time. |
| **Agent-readable** | Source-of-truth JSON embedded as `#dossier-model`; lossless Markdown + JSON + digest export. |
| **21 block types** | Hero, sections, two-col, cards, stats, flow, timeline, tables, callouts, code, tabs, FAQ, references, decision matrix, risk register, action items, assumptions, glossary, diagrams, prose, and an interactive review board. |
| **Editorial design** | Near-monochrome with one accent, serif display headline, light + dark, first-class responsive/mobile. |
| **Syntax highlighting** | [Shiki](https://shiki.style) at build time — dual light/dark via CSS variables, zero client JS. |
| **Diagrams** | Graphviz DOT to inline SVG at build time (browserless WASM). |
| **Interactive reader** | Sticky TOC + scroll-spy, in-page search, command palette, reading progress, per-block copy, heading anchors, collapsible sections, back-to-top, glossary tooltips. |
| **Decision loop** | The `review-board` block: select + annotate items, export decisions JSON, re-import to resume. |
| **Two renderers** | A zero-dependency Node generator and a typed React/TSX SSR port — same design, one source of truth. |

## Quick start

```bash
git clone https://github.com/mrbagels/dossier.git
cd dossier
npm install        # build-time deps: shiki, @hpcc-js/wasm-graphviz
npm link           # puts `dossier` on your PATH (or: npm install -g .)

# render the included example
dossier build examples/sample.dossier.json
open examples/dossier-overview.html
```

That writes `dossier-overview.html` and `dossier-overview.md` next to the JSON. Open the
HTML and try dark mode, `Cmd/Ctrl-K`, the search box, and the review board at the bottom.

To author your own, copy the starter and edit it:

```bash
cp skill/references/starter.dossier.json my-doc.dossier.json
# edit my-doc.dossier.json ...
dossier build my-doc.dossier.json && open my-doc.html
```

## Use it from an agent (the skill)

Dossier ships a [Claude Code](https://claude.com/claude-code) skill in
[`skill/`](skill/) so an agent reaches for it whenever you ask for a doc, plan, report,
or decision/review surface.

Install it by linking the skill into your skills directory:

```bash
ln -s "$(pwd)/skill" ~/.claude/skills/dossier
```

The skill bundles a full [block cheatsheet](skill/references/blocks.md) and a
[starter template](skill/references/starter.dossier.json), and instructs the agent to
author a `*.dossier.json` and run `dossier build`. Then just ask: *"make a dossier
summarizing X"* or *"turn these options into a review board I can triage."*

## Authoring a dossier

A dossier is `{ dossierVersion, kind, meta, blocks[] }`:

```json
{
  "dossierVersion": "1.0",
  "kind": "dossier",
  "meta": { "title": "My title", "slug": "my-doc", "status": "review", "updated": "2026-06-26" },
  "blocks": [
    { "type": "hero", "eyebrow": "Kicker", "title": "Headline", "lede": "One-sentence summary." },
    { "type": "section", "title": "Details", "blocks": [
      { "type": "callout", "tone": "tip", "title": "Note.", "body": "Sections nest other blocks." }
    ] }
  ]
}
```

- **`kind`**: `reader | review-board | dossier | adr | runbook | research | comparison` — selects defaults.
- **`meta`**: `title` (required), `slug`, `eyebrow`, `lede`, `crumbs`, `status`, `owner`,
  `updated`, `version`, `tags`, `baseUrl`, `theme` (token overrides), `lifecycle`, `changelog`.
- **`blocks`**: ordered; `section`, `two-col`, and `tabs` nest. Text fields take inline
  markdown (`**bold**`, `` `code` ``, `[label](url)`, `[[slug]]` cross-links, `[[Term]]` glossary).

The complete contract is in [`schema/dossier.schema.json`](schema/dossier.schema.json);
every block type is documented with examples in [`skill/references/blocks.md`](skill/references/blocks.md).

## The review / triage surface

For "here are N options — decide which to implement," use one `review-board` block. Each
candidate is an **expandable row**: collapsed it's scannable (title, summary, chips,
status, a select checkbox); expanded it reveals the full technical reference (`body`
markdown and/or nested `blocks` — load as much detail as you want) plus a notes field.

The reader filters/searches, ticks decisions, writes notes, and **exports a decisions
JSON** (and can re-import to resume). An implementing agent then reads the rich reference
from the model plus your decisions — closing the human to agent loop.

## Architecture

The visible HTML is a *projection* of the embedded model. The build inlines everything:

```
dossier.json ──► enrich ──► render ──► self-contained .html  (+ .md, + agent digest)
                  │                     │
                  │                     └─ <script id="dossier-model"> ← the source model (agents read this)
                  ├─ Shiki: code → highlighted HTML (light/dark via CSS vars)
                  └─ Graphviz WASM: DOT → inline SVG
```

- **Zero runtime dependencies in the artifact.** Shiki, Graphviz-WASM, and (for the
  React port) React are **build-time only** — none ship to the viewer.
- **One design system.** Tokens, the inlined client runtime, and the HTML shell are
  shared by both renderers (`renderShell()` is the single source of truth).
- **Round-trips.** Edit the JSON, rebuild; the HTML stays in sync. The island always
  deserializes back to the exact model.

## React

For React/Next codebases, the same design renders via typed TSX components
([`react/`](react/)):

```bash
cd react && npm install
npx tsx src/cli.tsx ../examples/sample.dossier.json   # -> *.react.html
```

```ts
import { renderDossier } from "@dossier/react";
const { html, md } = await renderDossier(model);
```

The `<Block>` dispatcher covers all 21 block types and reuses the core's CSS, runtime,
and enrichment, so the output matches the Node generator.

## Embedding

Every artifact is a complete, style-isolated HTML document, so it embeds anywhere:

```html
<iframe src="my-doc.html" style="width:100%;height:80vh;border:0"></iframe>
```

Cross-link dossiers with `[[other-slug]]` — resolves to a relative file when co-located,
or to an absolute URL when you set `meta.baseUrl` for a hosted site.

## Development

```
src/            zero-dependency Node generator (generate.mjs, theme, runtime, renderers)
react/          typed React/TSX SSR port
schema/         dossier.schema.json — the document contract
skill/          Claude Code skill (SKILL.md + references)
examples/       sample.dossier.json
docs/DESIGN.md  design system + decisions
```

```bash
dossier build examples/sample.dossier.json   # JS generator
cd react && npx tsx src/cli.tsx ../examples/sample.dossier.json && npx tsc --noEmit
```

## Requirements

Node.js >= 18. That's it — the generated artifacts need only a browser.

## Contributing

Issues and PRs welcome. Keep the artifact self-contained (no view-time network), keep one
accent in the design, and add new block types to both renderers + the schema + the
cheatsheet.

## License

[MIT](LICENSE) — do whatever you want with it.
