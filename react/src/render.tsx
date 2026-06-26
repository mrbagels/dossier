import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { enrich, assignIds, collectGlossary, buildToc, toMarkdown, agentDigest, renderShell } from "../../src/generate.mjs";
import { Block, setCtx } from "./blocks";
import type { DossierModel } from "./types";

// Render a Brief to a self-contained HTML artifact (+ Markdown + agent digest)
// via React SSR, reusing the core design system, runtime, enrichment, and the
// shared renderShell() — so the body is React-rendered and the shell is identical.
export async function renderDossier(model: DossierModel): Promise<{ html: string; md: string; digest: string }> {
  await enrich(model);
  assignIds(model.blocks);

  const meta: any = model.meta || {};
  const glossary = new Map<string, string>();
  collectGlossary(model.blocks, glossary);
  setCtx({ glossary, baseUrl: meta.baseUrl || "" });

  const body = renderToStaticMarkup(
    <>{model.blocks.map((b, i) => <Block b={b} key={b.id || i} />)}</>
  );

  const md = toMarkdown(model);
  const digest = agentDigest(model);
  const toc = buildToc(model.blocks);

  const html = renderShell(model, {
    body,
    toc,
    md,
    digest,
    generator: "dossier-react",
    footer: "Generated with Dossier (React)",
  });

  return { html, md, digest };
}
