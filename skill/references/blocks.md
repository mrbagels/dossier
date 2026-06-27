# Dossier, block catalog

Every block is an object in `blocks[]` with a `type`. Text fields accept inline
markdown (`**bold**`, `` `code` ``, `[label](url)`, `[[slug]]`, `[[Term]]`). `id` is
optional (auto-derived). `section`, `two-col`, and `tabs` nest other blocks.

## hero, page opener (use one, first)
```json
{ "type": "hero", "eyebrow": "Kicker", "title": "The headline",
  "lede": "One or two sentence summary.",
  "pills": ["Tag A", "Tag B"],
  "sideCards": [ { "label": "Status", "value": "Review" }, { "label": "Owner", "value": "Kyle" } ] }
```

## prose, rich text
```json
{ "type": "prose", "heading": "Optional H2", "markdown": "Paragraph one.\n\nParagraph two with **bold**." }
```

## section, titled container (nests blocks)
```json
{ "type": "section", "title": "Section title", "subtitle": "Optional lede.",
  "framed": true, "blocks": [ /* nested blocks */ ] }
```

## two-col, two columns (each nests blocks)
```json
{ "type": "two-col", "left": [ /* blocks */ ], "right": [ /* blocks */ ] }
```

## summary-cards, equal outlined cards (for key points)
```json
{ "type": "summary-cards", "cards": [
  { "title": "For humans", "body": "...", "tone": "accent" },
  { "title": "For agents", "body": "...", "tone": "highlight" } ] }
```
`tone`: `neutral | accent | highlight | success | warning | danger`.

## stat-strip, KPI figures
```json
{ "type": "stat-strip", "stats": [ { "value": "21", "label": "Block types" }, { "value": "0", "label": "Runtime deps" } ] }
```

## flow, numbered steps
```json
{ "type": "flow", "title": "Optional", "steps": [ { "title": "Author", "body": "Write JSON." }, { "title": "Generate", "body": "Run the CLI." } ] }
```

## timeline, phases with status
```json
{ "type": "timeline", "title": "Roadmap", "phases": [
  { "label": "Phase 1", "body": "Foundation.", "status": "done", "date": "Q1" },
  { "label": "Phase 2", "body": "Catalog.", "status": "in-progress" } ] }
```
`status`: `done | in-progress | planned | blocked`.

## table, hairline table
```json
{ "type": "table", "title": "Optional", "columns": ["A", "B"], "rows": [ ["1", "2"], ["3", "4"] ] }
```

## callout, quiet left-rule aside
```json
{ "type": "callout", "tone": "tip", "title": "Note.", "body": "Body text." }
```
`tone`: `info | ok | warn | danger | tip`.

## code, syntax-highlighted (Shiki, build-time)
```json
{ "type": "code", "lang": "ts", "filename": "optional.ts", "code": "const x = 1" }
```

## tabs, tabbed panes (each nests blocks)
```json
{ "type": "tabs", "tabs": [ { "label": "One", "blocks": [ /* blocks */ ] }, { "label": "Two", "blocks": [ ... ] } ] }
```

## faq, accordion
```json
{ "type": "faq", "title": "Optional", "items": [ { "q": "Question?", "a": "Answer." } ] }
```

## references, source table
```json
{ "type": "references", "items": [ { "label": "Source", "url": "https://…", "signal": "Why it matters", "use": "How to use it" } ] }
```

## decision-matrix, static options × criteria
```json
{ "type": "decision-matrix", "title": "Where it lives",
  "criteria": ["Cross-project", "Public later"],
  "options": [ { "name": "Standalone", "scores": ["Yes", "Easy"], "recommended": true },
               { "name": "Monorepo", "scores": ["No", "Hard"] } ] }
```

## risk-register, static risk table
```json
{ "type": "risk-register", "risks": [ { "risk": "Scope creep", "likelihood": "medium", "impact": "high", "mitigation": "Freeze schema first." } ] }
```
`likelihood`/`impact`: `low | medium | high`.

## action-items, interactive checklist (persists + exports)
```json
{ "type": "action-items", "title": "Next steps", "items": [ { "title": "Do X", "owner": "agent", "status": "todo" } ] }
```
`status`: `todo | doing | done | blocked`.

## assumptions, assumptions & open-questions register
```json
{ "type": "assumptions", "items": [ { "statement": "We can host these.", "kind": "open-question", "status": "unverified" } ] }
```
`kind`: `assumption | open-question`. `status`: `unverified | verified | rejected`.

## glossary, definitions (resolves `[[Term]]` tooltips elsewhere)
```json
{ "type": "glossary", "terms": [ { "term": "dossier-model", "definition": "The embedded source-of-truth JSON island." } ] }
```

## diagram, Graphviz DOT → inline SVG (build-time, browserless)
```json
{ "type": "diagram", "title": "Pipeline", "format": "dot",
  "spec": "digraph { rankdir=LR; a -> b; b -> c; }" }
```
Use DOT. (Mermaid `format` falls back to showing source.)

## figure, image with caption (inlined as a data URI at build time)
```json
{ "type": "figure", "src": "./diagram.png", "alt": "...", "caption": "What it shows." }
```
Local paths are read and inlined (self-contained). `data:`/`https:` sources pass through.

## math, LaTeX → MathML (build-time, self-contained, no fonts/CSS)
```json
{ "type": "math", "tex": "E = mc^2", "display": true }
```

## footnotes, numbered notes; `[^id]` in any text field links to them
```json
{ "type": "footnotes", "items": [ { "id": "src", "text": "The source, **inline** formatted." } ] }
```
Reference a note inline with `[^src]`. Place the `footnotes` block near the end.

## chart, bar / line / area, rendered to inline SVG (build-time, no dependency)
```json
{ "type": "chart", "title": "Quarterly", "chartType": "bar",
  "data": [ { "label": "Q1", "value": 12 }, { "label": "Q2", "value": 18 } ] }
```
`chartType`: `bar | line | area`. Bars/lines use the accent color and adapt to the theme.

## receipt, provenance panel (trust for agent-authored docs)
```json
{ "type": "receipt", "generatedBy": "research agent", "model": "claude-opus-4-8",
  "date": "2026-06-26", "confidence": "medium", "tools": ["web search"],
  "sources": [ { "label": "Spec", "url": "https://…" } ],
  "notes": "What was assumed or what failed." }
```
Pair with footnote citations (`[^id]`) for grounded, auditable documents.

## review-board, interactive triage / decision surface
Each candidate is an expandable row: collapsed shows title/summary/chips/status/select;
expanded shows the full reference (`body` markdown and/or nested `blocks`) + a notes
field. Reader filters, searches, ticks decisions, writes notes, exports a decisions JSON
(and can re-import). Load as much reference detail per candidate as you want.
```json
{ "type": "review-board", "title": "Features, triage and decide",
  "candidates": [
    { "id": "command-palette", "title": "Command palette",
      "summary": "Cmd-K to jump and run actions.",
      "category": "Navigation", "status": "shipped", "impact": "High", "effort": "Small",
      "body": "Full technical reference in **markdown**, as long as needed.\n\nMultiple paragraphs ok.",
      "blocks": [ { "type": "code", "lang": "ts", "code": "// nested reference blocks render when expanded" } ],
      "details": { "Shortcut": "Cmd/Ctrl-K" },
      "badges": ["nav"] } ] }
```
`candidate.id` must be kebab-case (it keys the exported decisions JSON).
