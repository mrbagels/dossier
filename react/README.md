# @dossier/react

Typed React/TSX components for [Dossier](../). Render the same self-contained design via
SSR, or use the block components live inside a React/Next app.

## SSR a self-contained artifact

```ts
import { renderDossier } from "@dossier/react";

const { html, md, digest } = await renderDossier(model); // model: DossierModel
```

Reuses the core design system, client runtime, and build-time enrichment (Shiki +
Graphviz), so the output matches the Node generator. CLI:

```bash
npx tsx src/cli.tsx ../examples/sample.dossier.json   # -> *.react.html
```

## Use blocks live in a React app

```tsx
import { Block, setCtx } from "@dossier/react";

setCtx({ glossary: new Map(), baseUrl: "" });
<Block b={model.blocks[0]} />
```

Import the core stylesheet (`src/theme/tokens.css.mjs` exports the `CSS` string) once at
your app root for the `ds-` classes.

## Extending with live interactivity (Base UI / Motion)

The static artifact needs no client framework — its interactivity is a small vanilla
runtime, so the generated HTML works with zero JS dependencies. When you mount these
components **live (hydrated)** in a React app, that's the right place to layer richer
interaction libraries:

- **[Motion](https://motion.dev)** — wrap blocks in `motion.*` with `initial={false}` so
  SSR output stays correct and hydration adds entrance/gesture animation.
- **[Base UI](https://base-ui.com)** — swap the native `<details>`/dialog affordances for
  fully accessible overlays when you need them.

These are intentionally **not** baked into the static generator, where they would add no
runtime benefit (there is no client React at view time).

## API

| Export | Description |
|---|---|
| `renderDossier(model)` | SSR → `{ html, md, digest }` (self-contained artifact). |
| `Block` | Component dispatcher over all 21 block types. |
| `setCtx({ glossary, baseUrl })` | Inline-markdown resolution context (call before rendering). |
| `DossierModel`, `BlockModel`, `ReviewCandidate`, … | Types. |
