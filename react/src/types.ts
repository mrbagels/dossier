// Types for the Dossier document model (React port).
// The dispatcher accepts a loose Block; named variant interfaces are exported for consumers.

export interface SideCard { label: string; value: string; note?: string }
export interface Lifecycle { stage?: "scratchpad" | "review" | "durable"; note?: string; promoteTo?: string }
export interface ChangelogEntry { version: string; date?: string; summary?: string; changes?: string[] }

export interface DossierMeta {
  title: string;
  slug?: string;
  eyebrow?: string;
  lede?: string;
  crumbs?: string[];
  status?: string;
  owner?: string;
  project?: string;
  created?: string;
  updated?: string;
  version?: string;
  tags?: string[];
  baseUrl?: string;
  theme?: Record<string, string>;
  features?: Record<string, boolean>;
  lifecycle?: Lifecycle;
  changelog?: ChangelogEntry[];
}

export type BlockType =
  | "hero" | "prose" | "section" | "two-col" | "summary-cards" | "stat-strip"
  | "flow" | "timeline" | "table" | "callout" | "code" | "tabs" | "faq"
  | "references" | "decision-matrix" | "risk-register" | "action-items"
  | "assumptions" | "glossary" | "diagram" | "review-board";

// A block is discriminated by `type`; variant fields are loosely typed for the dispatcher.
// `_hl` / `_svg` are populated by the build-time enrichment pass.
export interface Block {
  id?: string;
  type: BlockType | string;
  _hl?: string;
  _svg?: string;
  [k: string]: any;
}

export interface ReviewCandidate {
  id: string;
  title: string;
  summary: string;
  scope?: string;
  category?: string;
  status?: string;
  impact?: string;
  effort?: string;
  body?: string;
  blocks?: Block[];
  details?: Record<string, string>;
  badges?: string[];
}

export interface DossierModel {
  dossierVersion?: string;
  schema?: string;
  kind?: string;
  meta: DossierMeta;
  blocks: Block[];
}
