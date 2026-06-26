// Ambient declarations for the zero-dep core modules imported from the React port.
declare module "*/generate.mjs" {
  export const slugify: (s: string) => string;
  export const inlineMd: (s: string, ctx: any) => string;
  export const toMarkdown: (model: any) => string;
  export const agentDigest: (model: any) => string;
  export const collectGlossary: (blocks: any[], map: Map<string, string>) => void;
  export const buildToc: (blocks: any[]) => { id: string; label: string; level: number }[];
  export const assignIds: (blocks: any[]) => void;
  export const enrich: (model: any) => Promise<void>;
  export const renderBlock: (b: any, ctx: any) => string;
  export const generate: (model: any) => Promise<{ html: string; md: string; digest: string }>;
  export const renderShell: (
    model: any,
    opts: { body: string; toc: any[]; md: string; digest: string; generator?: string; footer?: string }
  ) => string;
}
declare module "*/tokens.css.mjs" {
  export const CSS: string;
}
declare module "*/runtime.mjs" {
  export const RUNTIME: string;
}
