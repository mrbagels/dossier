import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { generate } from "./generate.mjs";
import { validateModel } from "./validate.mjs";
import { applyPresentationOptions } from "./presentation.mjs";

export { generate, validateModel };
export { publishDir } from "./publish.mjs";
export { THEMES } from "./themes.mjs";
export { SKINS, resolveSkin, skinNames } from "./skins.mjs";
// Plugin authoring surface.
export { registerBlock, esc, inlineMd, richTextHtml, slugify, chartSvg, knownBlockTypes, parseUnifiedDiff } from "./generate.mjs";

export async function generateFile(path, opts = {}) {
  const model = JSON.parse(readFileSync(path, "utf8"));
  applyPresentationOptions(model, opts);
  if (opts.validate !== false) {
    const { ok, errors } = validateModel(model);
    if (!ok) {
      const err = new Error("invalid dossier:\n  - " + errors.join("\n  - "));
      err.validation = errors;
      throw err;
    }
  }
  const dir = dirname(path);
  const { html, embedHtml, md } = await generate(model, { baseDir: dir });
  const slug = (model.meta && model.meta.slug) || basename(path).replace(/\.(dossier\.)?json$/i, "");
  const htmlPath = join(dir, slug + ".html");
  const embedPath = join(dir, slug + ".embed.html");
  const mdPath = join(dir, slug + ".md");
  writeFileSync(htmlPath, html);
  if (opts.embed) writeFileSync(embedPath, embedHtml);
  writeFileSync(mdPath, md);
  return { htmlPath, embedPath: opts.embed ? embedPath : null, mdPath, slug };
}
