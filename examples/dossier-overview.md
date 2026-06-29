---
title: "Dossier, System Overview"
slug: "dossier-overview"
status: "review"
updated: "2026-06-29"
---
# One JSON file in, a beautiful agent-readable page out

Dossier renders a single document model into a self-contained, themed, interactive HTML artifact. The page you see is a projection of the embedded **[[dossier-model]]** data island, so agents read one block while humans get the rendered view.

**42** Block types · **18** Selected features · **1** JSON file to author · **0** Runtime dependencies

### For humans

A polished, themed reading surface with TOC, search, command palette, and one-click export.

### For agents

The full structured model lives in `#dossier-model`, read one block, no DOM scraping.

### For your wiki

Self-contained files embed via iframe and link with `[[slug]]` cross-references.


## How a Brief is produced

The agent writes JSON; the generator owns all design and interactivity.

1. **Author**, An agent emits a `brief.json` conforming to the schema.
2. **Validate**, The generator lints the model and assigns stable block ids.
3. **Render**, JSON becomes HTML + the embedded data island + Markdown.
4. **Use**, Read, review, export, embed, or round-trip back to an agent.

> **Composable.** Sections, two-col, and tabs nest other blocks, so layouts build up from the same primitives.

> **Self-contained.** No external network calls; everything inlines so the file works offline and emails cleanly.



## Roadmap

- **Phase 1** (done), Schema + tokens/themes.
- **Phase 2** (done), Generator engine + data island + Markdown export.
- **Phase 3** (done), Full static catalog.
- **Phase 4** (done), Process dossier closeout.
- **Phase 5** (done), Bug bash, release polish, gallery examples, and public QA guide.


## Reference

### Authoring

```bash
node bin/dossier.mjs build examples/sample.dossier.json
# -> writes dossier-overview.html + .md
```

### FAQ

**Does it replace my docs site?**

No. It is a companion: linkable, embeddable, exportable artifacts alongside your normal wiki.

**How do agents read it?**

They parse the `#dossier-model` JSON island, or consume the Markdown / agent-digest exports.



### Where it lives

| Option | Cross-project | Public later | Reusable |
| --- | --- | --- | --- |
| Standalone repo | Yes | One-line flip | Consumes as pack |
| Inside a monorepo | No | Hard | Native but coupled |

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Scope creep across 18 features | medium | medium | Build catalog first, then features against a frozen schema. |
| Borrowed code complicates open-sourcing | low | high | Write 100% original, zero-dep code. |

| Source | Signal | Use |
| --- | --- | --- |
| Deep-dive reference | Static reader pattern | Baseline for the read-only Brief layout. |
| Review board reference | Interactive decision surface | Basis for the review-board block. |


### Next implementation steps

- [ ] Bug bash process dossier workflows. (@agent)
- [ ] Polish release artifacts. (@agent)
- [ ] Dogfood MCP process packets in another agent. (@agent)

### Assumptions & open questions

- (assumption/unverified) Briefs usually sit in the same folder, so relative [[slug]] links suffice.
- (open-question/unverified) Should the catalog generator (#26) come back later as an index Brief?

### Glossary

- **dossier-model**: The embedded JSON data island that is the source of truth for the rendered page.
- **agent digest**: A compact, token-efficient text summary of the Brief for downstream agents.

### Pipeline

```dot
digraph { rankdir=LR; bgcolor="transparent"; node [shape=box style=rounded fontname="Inter" fontsize=12 color="#c81e4a" fontcolor="#1a1822"]; edge [color="#8b8698"]; "brief.json" -> "generator"; "generator" -> "brief.html"; "generator" -> "brief.md"; "brief.html" -> "#dossier-model island"; }
```

## Optional features, triage and decide

### Command palette (shipped)

Cmd-K to jump to sections and run document actions.

Opens with **Cmd/Ctrl-K**. Lists every section heading plus document actions (toggle theme, copy Markdown, download JSON, view source). Arrow keys move, Enter activates, Esc closes.

The command list is built at render time from the table of contents, so it stays in sync with the document automatically.

```ts
// commands are derived from the embedded model
const commands = toc.map(t => ({ label: t.label, run: () => jump(t.id) }))
```

- **Shortcut:** Cmd/Ctrl-K
- **Source:** Built from TOC

### Changelog / version diff (shipped)

Diff two dossier models structurally from the CLI.

Because every Dossier embeds its full source model, two versions can be compared structurally rather than as text. Run `dossier diff old.dossier.json new.dossier.json` to see added, removed, and changed blocks.

| Change | Block | Detail |
| --- | --- | --- |
| Added | risk-register | New risks section |
| Changed | timeline | Phase 3 set to in-progress |


### Syntax highlighting (Shiki) (shipped)

Build-time, theme-aware highlighting with zero client JS.

Run Shiki at generate time to emit pre-highlighted, inline-styled code with light and dark variants driven by CSS variables. No client runtime and no network: the highlighted HTML is baked into the file.


### Diagram to inline SVG (shipped)

Render Graphviz DOT and Mermaid to static SVG at build time.

DOT diagrams render through Graphviz WASM, and Mermaid diagrams render through the optional headless browser path when available. The resulting SVG is inlined into the artifact so view-time loading stays self-contained.


