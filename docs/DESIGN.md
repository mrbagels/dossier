# Dossier, Design Record

> Durable record of locked decisions. Update this when a decision changes.

## What it is

Dossier turns **one JSON document model** into a polished, self-contained HTML
artifact (plus a Markdown export). The visible HTML is a *projection* of an embedded
JSON island, so:

- **Humans** get a beautiful, themed, interactive page.
- **Agents** read one `<script type="application/json" id="dossier-model">` block to get
  the full structured content, no DOM scraping.
- **Exports** (Markdown, JSON, agent digest) derive losslessly from the same model.

It is a *companion* to a normal docs/wiki stack, not a replacement: artifacts are
linkable and embeddable (iframe today, `*.embed.html` variant for inline use).

## Locked decisions

| Decision | Choice |
| --- | --- |
| Hosting / scope | Standalone, global, cross-project. Own repo `~/Developer/products/dossier`. |
| Open source | Build open-source-shaped (zero-dep, all original code, MIT-ready) but stay `UNLICENSED`/private for now. Publishing later = add LICENSE + flip repo. |
| Host integration | A host app or monorepo can vendor or import this as a package. The core stays decoupled from any host. |
| Render model | Hybrid: build-time generator emits self-contained HTML + embedded JSON island + minimal inlined JS for interactivity. |
| Generator stack | Zero-dependency Node, single-file-style ESM modules. Runs via `node` / `npx`. |
| First build | Full design system + full component catalog + selected features (not a minimal slice). |
| Name | **Dossier.** Skill `dossier`, schema namespace `dossier/v1`, CSS prefix `ds-`, header field `dossierVersion`. |
| Brand | Berry: crimson/rose accent (`#e11d48`), purple highlight (`#7048e8`), plum neutral. Light + dark. Per-project token overrides via `meta.theme`. |

## Foundation (always built)

Data backbone (embedded JSON island, stable `data-id`/`data-block` typing, canonical
front-matter, `dossierVersion`/schema header) · pipeline (schema, generator,
validation+lint, presets, the `dossier` skill) · render baseline (hybrid render,
light/dark theming + per-project overrides, Markdown + JSON export) · the full static
component catalog (hero, summary cards, sections, two-col, flow, timeline, tables,
callouts, code, stat strip, tabs, FAQ, references, plus **static** decision-matrix and
risk-register display blocks).

## Selected optional features

In: 1 TOC/scroll-spy · 2 reading progress · 3 in-page search · 4 command palette ·
5 collapse/expand + persist · 7 per-block copy · 8 agent digest export ·
10 cross-artifact links · 14 assumptions register · 15 changelog/version diff ·
16 annotation/review mode · 17 approve/reject verdicts · 18 interactive action items ·
21 import-JSON round-trip · 22 lifecycle banner · 23 diagrams to SVG ·
24 syntax highlighting · 25 glossary tooltips.

Out: 6 density/font controls · 9 print/PDF refinement · 11 citation system ·
12 confidence/freshness · 13 generation receipt · 19 interactive decision matrix ·
20 interactive risk register · 26 catalog/index generator. (19/20 ship as static
display blocks only.)

## Embeddability & hosting

- Every artifact is a complete, style-isolated HTML file → `<iframe src>` embeds today.
- Generator also emits `*.embed.html` (chrome stripped) for inline embedding; all CSS is
  namespaced under `ds-` to minimize host-page bleed.
- Files are self-contained, so any static host works (docs site static dir, GitHub Pages).
- Cross-artifact links (`[[slug]]`): relative file links when co-located (no hosting
  needed); absolute URLs when `meta.baseUrl` is set.

## Build order

1. Schema + design tokens/themes. ✅
2. Generator engine + data island + Markdown export. ✅
3. Full static catalog. ✅
4. The 18 selected features. ✅
5. Shiki syntax highlighting + diagram→SVG (build-time). ✅
6. React/TSX port (SSR to the same self-contained file). ✅
7. Shared `renderShell()` (one shell for JS + React). ✅
8. Skill + global wiring. ✅

## Global wiring + skill

- `npm link` exposes the **`dossier`** CLI on PATH: `dossier build <file.dossier.json>`.
- The **`dossier` skill** lives at `~/dotfiles/ai/shared/skills/dossier/`
  (SKILL.md + `references/blocks.md` catalog + `references/starter.dossier.json`). It tells
  agents when to reach for a Brief, how to author the JSON, and to run the CLI.

## Build-time dependencies

The **output stays self-contained** (highlighted code + diagram SVG are inlined; no
view-time network). These run only at generate time:

- `shiki`, dual-theme (light/dark) highlighting via CSS variables, zero client JS.
- `@hpcc-js/wasm-graphviz`, `diagram` blocks with `format: "dot"` → inline SVG, browserless.

The "zero-dependency" promise now means **zero runtime dependencies in the artifact**,
not a dependency-free toolchain.

## React port (`react/`)

Typed TSX components (`Block` dispatcher over all 21 types) rendered via
`react-dom/server` `renderToStaticMarkup`, **reusing the core `CSS`, `RUNTIME`, and
enrichment** (`enrich`/`assignIds`/`buildToc`/`toMarkdown`/`agentDigest`/`inlineMd`) as
the single source of truth. Produces the same self-contained artifact; `tsc --noEmit`
clean. The shell template is currently duplicated in `react/src/render.tsx`, a future
cleanup is to extract a shared `renderShell()` from the core so both paths share it.
