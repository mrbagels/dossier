<div align="center">

# Dossier

### Stop asking your AI for a Markdown file. Have it build you a Dossier — a self-contained, interactive HTML document for planning, documenting, and deciding *with* AI.

[![License: MIT](https://img.shields.io/badge/license-MIT-c81e4a.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-c81e4a.svg)](#requirements)
[![Runtime deps](https://img.shields.io/badge/runtime%20deps-0-c81e4a.svg)](#how-it-works)
[![Output](https://img.shields.io/badge/output-single%20.html%20file-7048e8.svg)](#how-it-works)
[![Version](https://img.shields.io/badge/version-0.2.0-7048e8.svg)](#)

</div>

When you ask an AI assistant to "write up a plan," "summarize this," or "lay out the
options," it dumps a wall of Markdown. **Dossier replaces that.** Your agent authors a
Dossier instead and hands you **one self-contained, interactive HTML page** — something you
can actually navigate, search, mark up, and hand *back* to the AI to act on.

```
  "write me a markdown file"   →   a flat .md you skim once and lose
  "make me a dossier"          →   one interactive .html: navigable, markable, agent-readable
```

It's built for the back-and-forth that real planning needs:

- **Your agent writes it.** It lays out plans, specs, research, and options — with as much
  depth as the work needs — as a structured document, not a text dump. You don't hand-write anything.
- **You work in it.** Navigate it, search it, expand the details that matter, **tick the
  options you want, and leave notes** — right in the page.
- **You hand it back.** Export your decisions as JSON; the agent implements them. The whole
  document carries its own structured data inside it, so the AI reads it back perfectly — no
  scraping, no lossy copy-paste.

One file. No server, no external assets, works offline. Open it, email it, or embed it in
your wiki.

## Get started

The point of Dossier is to let your **agent** drive it. Install the CLI and the skill once:

```bash
npm install -g github:mrbagels/dossier                 # one line, any platform (Node 18+)
ln -s "$(pwd)/dossier/skill" ~/.claude/skills/dossier  # if cloned; see "Use it from an agent"
```

Then just ask your assistant:

> *"Make me a dossier planning the Q3 migration."*
> *"Turn these five options into a review board I can triage."*
> *"Write this up as a dossier instead of a markdown file."*

It authors a `*.dossier.json` and runs `dossier build` — you get `my-doc.html` (+ `.md`).
[More on the skill ↓](#use-it-from-an-agent)

**Driving it yourself?** Same tool, by hand:

```bash
dossier init my-doc                  # creates my-doc.dossier.json from a starter
#    ...edit my-doc.dossier.json...
dossier build my-doc.dossier.json    # writes my-doc.html  (+ my-doc.md)
open my-doc.html                     # macOS  (Linux: xdg-open · Windows: start)
```

<div align="center">

---

**Documentation**

[How it works](#how-it-works) · [Use it from an agent](#use-it-from-an-agent) ·
[Authoring](#authoring) · [Block types](#block-types) · [Review / triage](#review--triage) ·
[React](#react) · [Embedding](#embedding) · [Development](#development) · [Contributing](#contributing)

---

</div>

## How it works

A Dossier is generated from one JSON document model (which the agent writes). The page you
open is a **projection of that model** — the full model is embedded back into the file as a
`#dossier-model` data island, which is exactly what an agent reads. Everything else is
inlined at build time, so the result needs nothing at view time:

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
- **It round-trips.** The agent edits the JSON and rebuilds; the HTML stays in sync, and the
  island always deserializes back to the exact model — so the human-and-agent loop is lossless.

Every page comes with a sticky table of contents + scroll-spy, in-page search, a command
palette, light/dark theme, reading progress, per-block copy, heading anchors, collapsible
sections, glossary tooltips, and one-click export to Markdown / JSON / agent-digest — all
inlined, all offline, fully responsive down to mobile.

## Use it from an agent

Dossier ships a [Claude Code](https://claude.com/claude-code) skill in [`skill/`](skill/) so
an agent reaches for it automatically whenever you ask for a plan, write-up, report, or
"options to decide on." Install it by linking it into your skills directory:

```bash
ln -s "$(pwd)/skill" ~/.claude/skills/dossier
```

It bundles a [block cheatsheet](skill/references/blocks.md) and a
[starter template](skill/references/starter.dossier.json), and tells the agent to author a
`*.dossier.json` and run `dossier build`. From then on, "make me a dossier…" is all you need.

### Any agent, via MCP

`dossier mcp` runs a [Model Context Protocol](https://modelcontextprotocol.io) server over
stdio, so **any** MCP-capable agent can drive Dossier — including the full human-and-agent
loop. Tools: `dossier_render`, `dossier_validate`, `dossier_read_decisions` (read back the
options a human selected on a review board), `dossier_get_schema`, `dossier_get_starter`.

```jsonc
// e.g. an MCP client config
{ "mcpServers": { "dossier": { "command": "dossier", "args": ["mcp"] } } }
```

## Authoring

You normally let the agent write this, but the model is simple and worth knowing. A dossier
is `{ dossierVersion, kind, meta, blocks[] }`:

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

Full contract: [`schema/dossier.schema.json`](schema/dossier.schema.json).

## Block types

26 built-in (plus your own — see [plugins](#plugins--cli)) — each documented with a
copy-paste JSON example in [`skill/references/blocks.md`](skill/references/blocks.md):

| Group | Blocks |
|---|---|
| **Structure** | `hero`, `section`, `two-col`, `tabs`, `prose` |
| **At a glance** | `summary-cards`, `stat-strip`, `flow`, `timeline`, `callout` |
| **Reference** | `table`, `code` (Shiki), `diagram` (DOT→SVG), `references`, `faq`, `glossary` |
| **Media & data** | `figure` (inlined), `math` (KaTeX→MathML), `chart` (bar/line/area SVG), `footnotes` |
| **Decisions & trust** | `decision-matrix`, `risk-register`, `assumptions`, `action-items`, `review-board`, `receipt` |

## Review / triage

This is where deciding *with* AI happens. Use one `review-board` block for "here are the
options — let's decide." Each candidate is an **expandable row**: collapsed it's scannable
(title, summary, chips, status, a select checkbox); expanded it reveals the full technical
reference the agent loaded (`body` markdown and/or nested `blocks`) plus a notes field.

You filter, search, **tick what to do, and write notes** — then **export a decisions JSON**
(and can re-import to resume). The agent reads the rich reference from the model plus your
decisions and implements them. That's the human-to-agent loop, in one file.

## React

Dossier also ships as typed React/TSX components ([`react/`](react/), `@dossier/react`), for
teams that want to render the same design from a React/Next app.

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

## Plugins & CLI

Add custom block types without forking — a plugin registers a renderer:

```bash
dossier build my.dossier.json --plugin ./my-plugin.mjs
```
```js
// my-plugin.mjs — default-export receives the authoring API
export default function ({ registerBlock, esc }) {
  registerBlock("badge-row", (b) =>
    `<section class="ds-block" data-block="badge-row"><div class="ds-chips">` +
    (b.badges || []).map((x) => `<span class="ds-chip">${esc(x)}</span>`).join("") +
    `</div></section>`);
}
```

The same plugin can also `registerComponent(type, Component)` for the React port, so a
single plugin reaches **full parity** across both renderers (and the Node renderer is used
as a fallback otherwise). See [`examples/plugins/badge-row.plugin.mjs`](examples/plugins/badge-row.plugin.mjs).

The full CLI:

| Command | What it does |
|---|---|
| `dossier init [name] --kind <kind>` | scaffold from a starter (`dossier`, `adr`, `runbook`, `postmortem`, `review-board`) |
| `dossier build <file> [--watch] [--plugin a,b]` | validate + render to `<slug>.html` (+ `.md`) |
| `dossier serve <file> [--open] [--port]` | build + live-reload dev server |
| `dossier validate <file>` | check a model without rendering |
| `dossier diff <old> <new>` | structural diff between two versions |
| `dossier mcp` | run the MCP server (stdio) |

## Embedding

Every page is a complete, style-isolated HTML document, so it embeds anywhere:

```html
<iframe src="my-doc.html" style="width:100%;height:80vh;border:0"></iframe>
```

Cross-link dossiers with `[[other-slug]]` — a relative file link when they sit together, or
an absolute URL when you set `meta.baseUrl` for a hosted site. Dossier is a *companion* to
your docs site, not a replacement for it.

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
