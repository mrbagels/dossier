// Public entry for @dossier/react.
//
// renderDossier(model) -> { html, md, digest }  — SSR a self-contained artifact.
// <Block b={...}/>                                — render an individual block (live or SSR).
// setCtx({ glossary, baseUrl })                   — set inline-markdown resolution context.

export { renderDossier } from "./render";
export { Block, setCtx, registerComponent } from "./blocks";
export { DossierDocument } from "./document";

export type {
  DossierModel,
  DossierMeta,
  Block as BlockModel,
  BlockType,
  ReviewCandidate,
  SideCard,
  Lifecycle,
  ChangelogEntry,
} from "./types";
