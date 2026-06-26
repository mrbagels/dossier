<div align="center">

# Dossier

### Turn a JSON file into a polished web page — one self-contained `.html` file your team and your AI agents can both read.

[![License: MIT](https://img.shields.io/badge/license-MIT-c81e4a.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-c81e4a.svg)](#requirements)
[![Runtime deps](https://img.shields.io/badge/runtime%20deps-0-c81e4a.svg)](#how-it-works)
[![Output](https://img.shields.io/badge/output-single%20.html%20file-7048e8.svg)](#how-it-works)
[![Version](https://img.shields.io/badge/version-0.1.2-7048e8.svg)](#)

</div>

You write a small JSON file. Dossier gives you back **one self-contained `.html` page** — a
report, plan, spec, or review that looks great in any browser, that you can email as a
single file or drop straight into your wiki. And because the page carries its own
structured data inside it, **an AI agent can read it straight back** — no scraping.

No build pipeline. No server. No external files, fonts, or scripts to load. Just one
portable HTML file (plus a Markdown copy) that works offline.

```
   my-doc.dossier.json  ──►  dossier build  ──►  my-doc.html      (+ my-doc.md)
                                                  one file · opens anywhere · works offline
```

## Install

One line, any platform — you just need [Node](https://nodejs.org) 18+:

```bash
npm install -g github:mrbagels/dossier
```

Prefer not to install? Run it on demand: `npx github:mrbagels/dossier build my-doc.dossier.json`

## Quick start

```bash
dossier init my-doc                  # creates my-doc.dossier.json from a starter
#    ...edit my-doc.dossier.json...
dossier build my-doc.dossier.json    # writes my-doc.html  (+ my-doc.md)
open my-doc.html                     # macOS  (Linux: xdg-open · Windows: start)
```

Open the page and try dark mode, the search box, `Cmd/Ctrl-K`, and the interactive review
board at the bottom.

**Or let an AI agent build one for you.** Dossier ships a [Claude Code](https://claude.com/claude-code)
skill, so you can just say *"make a dossier summarizing this"* — [details below](#use-it-from-an-agent).

<div align="center">

---

**Documentation**

[How it works](#how-it-works) · [Authoring](#authoring) · [Block types](#block-types) ·
[Review / triage](#review--triage) · [The skill](#use-it-from-an-agent) · [React](#react) ·
[Embedding](#embedding) · [Development](#development) · [Contributing](#contributing)

---

</div>

## How it works

The page you open is a **projection of the JSON you wrote** — the full model is embedded
back into the file as a `#dossier-model` data island, which is exactly what an agent reads.
Everything else is inlined at build time so the result needs nothing at view time:

```
my-doc.dossier.json ──► enrich ──► render ──► self-contained .html  (+ .md, + agent digest)
                         │                     │
                         │                     └─ <script id="dossier-model"> ← the source model
                         ├─ Shiki: code → highlighted HTML (light/dark via CSS variables)
                         └─ Graphviz WASM: DOT → inline SVG
```

- **Zero runtime dependencies in the output.** Shiki (highlighting), Graphviz-WASM
  (diagrams), and React (the optional port) run only at build time — none ship to the viewer.
- **One design system.** Tokens, the small inlined client runtime, and the HTML shell are
  shared by both renderers (`renderShell()` is the single source of truth).
- **It round-trips.** Edit the JSON, rebuild — the HTML stays in sync, and the island
  always deserializes back to the exact model.

Each page comes with a sticky table of contents + scroll-spy, in-page search, a command
palette, light/dark theme, reading progress, per-block copy, heading anchors, collapsible
sections, glossary tooltips, and one-click export to Markdown / JSON / agent-digest — all
inlined, all offline, fully responsive down to mobile.

## Authoring

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

- **`kind`** — `reader | review-board | dossier | adr | runbook | research | comparison`; selects sensible defaults.
- **`meta`** — `title` (required), `slug`, `eyebrow`, `lede`, `crumbs`, `status`, `owner`,
  `updated`, `version`, `tags`, `baseUrl` (for hosted cross-links), `theme` (token
  overrides), `lifecycle` (status banner), `changelog`.
- **`blocks`** — ordered; `section`, `two-col`, and `tabs` nest other blocks. Text fields
  accept inline markdown: `**bold**`, `` `code` ``, `[label](url)`, `[[slug]]`
  cross-document links, and `[[Term]]` glossary tooltips.

The full contract is [`schema/dossier.schema.json`](schema/dossier.schema.json). The
`dossier init` starter is a working example to edit.

## Block types

21 in total — every one documented with a copy-paste JSON example in
[`skill/references/blocks.md`](skill/references/blocks.md):

| Group | Blocks |
|---|---|
| **Structure** | `hero`, `section`, `two-col`, `tabs`, `prose` |
| **At a glance** | `summary-cards`, `stat-strip`, `flow`, `timeline`, `callout` |
| **Reference** | `table`, `code` (Shiki), `diagram` (DOT→SVG), `references`, `faq`, `glossary` |
| **Decisions** | `decision-matrix`, `risk-register`, `assumptions`, `action-items`, `review-board` |

## Review / triage

For "here are N options — decide which to implement," use one `review-board` block. Each
candidate is an **expandable row**: collapsed it's scannable (title, summary, chips,
status, a select checkbox); expanded it reveals the full technical reference (`body`
markdown and/or nested `blocks` — load as much detail as you want) plus a notes field.

The reader filters and searches, ticks decisions, writes notes, and **exports a decisions
JSON** (and can re-import to resume). An implementing agent then reads the rich reference
from the model plus your decisions — closing the human-to-agent loop.

## Use it from an agent

Dossier ships a [Claude Code](https://claude.com/claude-code) skill in [`skill/`](skill/)
so an agent reaches for it whenever you ask for a doc, plan, report, or review. Install it
by linking it into your skills directory:

```bash
ln -s "$(pwd)/skill" ~/.claude/skills/dossier
```

It bundles a [block cheatsheet](skill/references/blocks.md) and a
[starter template](skill/references/starter.dossier.json), and tells the agent to author a
`*.dossier.json` and run `dossier build`. Then just ask: *"make a dossier summarizing X"*
or *"turn these options into a review board I can triage."*

## React

Dossier also ships as typed React/TSX components ([`react/`](react/), `@dossier/react`),
for teams that want to render the same design from a React/Next app.

```ts
import { renderDossier } from "@dossier/react";
const { html, md } = await renderDossier(model);   // -> the same self-contained file
```

```tsx
// or render blocks live inside an app (optional Motion entrance animation when hydrated)
import { DossierDocument } from "@dossier/react";
<DossierDocument model={model} animate />
```

The `<Block>` dispatcher covers all 21 block types and reuses the core's CSS, runtime, and
enrichment, so SSR output matches the Node generator. See [`react/README.md`](react/README.md).

## Embedding

Every page is a complete, style-isolated HTML document, so it embeds anywhere:

```html
<iframe src="my-doc.html" style="width:100%;height:80vh;border:0"></iframe>
```

Cross-link dossiers with `[[other-slug]]` — a relative file link when they sit together,
or an absolute URL when you set `meta.baseUrl` for a hosted site. Dossier is a *companion*
to your docs site, not a replacement for it.

## Development

```
src/            zero-dependency Node generator (generate.mjs, theme, runtime, renderers)
react/          typed React/TSX port (SSR + live components)
schema/         dossier.schema.json — the document contract
skill/          Claude Code skill (SKILL.md + references + starter)
examples/       sample.dossier.json
docs/DESIGN.md  the design system + decisions
```

```bash
git clone https://github.com/mrbagels/dossier.git && cd dossier
npm install && npm link
dossier build examples/sample.dossier.json && open examples/dossier-overview.html

cd react && npm install
npx tsx src/cli.tsx ../examples/sample.dossier.json && npx tsc --noEmit
```

## Requirements

Node.js >= 18 to build. The generated pages need only a browser.

## Contributing

Issues and PRs welcome. Keep the output self-contained (no view-time network), keep one
accent in the design, and add new block types to both renderers + the schema + the cheatsheet.

## License

[MIT](LICENSE) — do whatever you want with it.
