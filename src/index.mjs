import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { generate } from "./generate.mjs";
import { validateModel } from "./validate.mjs";

export { generate, validateModel };
export { registerBlock } from "./generate.mjs";

export async function generateFile(path, opts = {}) {
  const model = JSON.parse(readFileSync(path, "utf8"));
  if (opts.validate !== false) {
    const { ok, errors } = validateModel(model);
    if (!ok) {
      const err = new Error("invalid dossier:\n  - " + errors.join("\n  - "));
      err.validation = errors;
      throw err;
    }
  }
  const dir = dirname(path);
  const { html, md } = await generate(model, { baseDir: dir });
  const slug = (model.meta && model.meta.slug) || basename(path).replace(/\.(dossier\.)?json$/i, "");
  const htmlPath = join(dir, slug + ".html");
  const mdPath = join(dir, slug + ".md");
  writeFileSync(htmlPath, html);
  writeFileSync(mdPath, md);
  return { htmlPath, mdPath, slug };
}
