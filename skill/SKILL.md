---
name: dossier
description: Generate a polished, self-contained, agent-readable HTML dossier (plus Markdown) from structured content — research reports, plans, specs, architecture/decision (ADR) docs, runbooks, postmortems, or an interactive review/triage surface for deciding which items to implement. Use when the user wants a doc, plan, report, brief, spec, or review as a shareable artifact, or wants a structured decision surface they can mark up and hand back to an agent.
metadata:
  short-description: Render JSON document models into self-contained, agent-readable HTML dossiers
---

# Dossier

Dossier turns **one JSON document model** into a polished, **self-contained** HTML
artifact (plus a Markdown export). The visible HTML is a projection of an embedded
`#dossier-model` JSON island, so humans get a themed, interactive page and agents read
one block instead of scraping. It is a companion to a docs/wiki — link or `<iframe>` it
anywhere. No server, no external assets, works offline.

This skill bundles a block cheatsheet (`references/blocks.md`) and a starter template
(`references/starter.dossier.json`). The full JSON Schema lives in the Dossier repo at
`schema/dossier.schema.json`.

## When to use this

- A research report, plan, spec, brief, architecture doc, ADR, runbook, or postmortem
  that should be a clean, shareable, durable artifact (not just chat text).
- An **interactive review/triage surface**: a list of candidate items (features, ideas,
  risks), each with deep reference detail, that a human selects + annotates and exports
  back as JSON for an agent to implement. Use the `review-board` block for this.
- Any time the user says "make a doc/plan/report/brief/review/page for this."

Prefer this over dumping long Markdown when the content benefits from structure,
navigation, or a decision loop.

## Setup (once)

Install the `dossier` CLI — one line, any platform (needs Node 18+):
```
npm install -g github:mrbagels/dossier
```
Or run without installing: `npx github:mrbagels/dossier build <file>`. To scaffold a new
document: `dossier init <name>` writes `<name>.dossier.json` from the starter.

## Workflow

1. **Write the model.** Author a `<slug>.dossier.json` conforming to the schema. Start
   from `references/starter.dossier.json` and consult `references/blocks.md` for every
   block type. Keep `meta.slug` kebab-case (it names the output files and cross-links).
2. **Generate.**
   ```
   dossier build path/to/<slug>.dossier.json
   ```
   Writes `<slug>.html` and `<slug>.md` next to the JSON.
3. **Show it.** `open <slug>.html` so the user can view it. For durable docs, save the
   `.dossier.json` + outputs under the project's `docs/`.

The generator validates and lints; malformed JSON fails loudly. Re-run after edits — the
HTML stays in sync with the JSON (round-trip).

Other commands: `dossier validate <file>` (check without rendering), `dossier serve <file>
--open` (live-reload preview while iterating), `dossier diff <old> <new>` (what changed),
`dossier init <name> --kind adr|runbook|postmortem|review-board`, and `--plugin <file>` to
add custom block types. For programmatic / multi-agent use, `dossier mcp` exposes
render/validate/read-decisions as MCP tools. Block types beyond the basics — `figure`,
`math`, `chart`, `footnotes` (with inline `[^id]`), and `receipt` (provenance) — are in
`references/blocks.md`.

### React variant (optional)

For React/Next codebases, the same design renders via typed TSX components:
```
cd react && npm install && npx tsx src/cli.tsx <file>   # -> <slug>.react.html
```
Identical output; reuses the same design system. Importable: `import { renderDossier } from "@mrbagels/dossier-react"`.

## Authoring essentials

Top-level shape:
```json
{
  "dossierVersion": "1.0",
  "kind": "dossier",
  "meta": { "title": "...", "slug": "kebab-case", "status": "review", "updated": "2026-06-26" },
  "blocks": [ { "type": "hero", "...": "..." }, { "type": "section", "blocks": [ ... ] } ]
}
```

- **`kind`**: `reader | review-board | dossier | adr | runbook | research | comparison`.
- **`meta`**: `title` (required), `slug`, `eyebrow`, `lede`, `crumbs[]`, `status`,
  `owner`, `updated`, `version`, `tags[]`, `baseUrl` (for hosted cross-links),
  `theme` (per-project token overrides), `lifecycle` (banner), `changelog`.
- **`blocks[]`**: ordered. `section`, `two-col`, and `tabs` nest other blocks. Lead with
  a `hero`. See `references/blocks.md` for all 21 types.
- **Inline markdown** in text fields: `**bold**`, `` `code` ``, `[label](url)`,
  `[[other-slug]]` (cross-artifact link), `[[Term]]` (glossary tooltip).
- **Code**: `{ "type": "code", "lang": "ts", "code": "..." }` — highlighted at build
  (Shiki, light/dark). **Diagrams**: `{ "type": "diagram", "format": "dot", "spec": "digraph {...}" }`
  → inline SVG (Graphviz). Use Graphviz DOT.

## The review/triage surface (key pattern)

For "here are N options, decide which to implement," use one `review-board` block. Each
candidate is an expandable row: scannable collapsed (title, summary, chips, status,
select checkbox), expanding to its full reference (`body` markdown and/or nested
`blocks` — load as much technical detail as you want) plus a notes field. The reader
filters/searches, ticks decisions, writes notes, and **exports a decisions JSON** (and
can re-import). Pair the rich reference in the model with the exported decisions to
implement. See `references/blocks.md` → `review-board`.

## What the reader gets (built in)

Sticky TOC with scroll-spy, in-page search, command palette (Cmd/Ctrl-K), light/dark
theme, reading progress + time, per-block copy, heading anchor links, collapsible
sections, back-to-top, glossary tooltips, lifecycle banner, and one-click export to
Markdown / JSON / agent-digest — all inlined, all offline, fully responsive.

## Conventions

- One `hero` first; group with `section`s; reserve outlined cards (`summary-cards`,
  `stat-strip`) for collections, not prose.
- Set `meta.slug`; co-locate related dossiers so `[[slug]]` links resolve, or set
  `meta.baseUrl` when hosting.
- Embed in a wiki with `<iframe src="<slug>.html">` — it's style-isolated.
- Do not hand-write HTML/CSS; only author the JSON model.
