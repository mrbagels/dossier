import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { generate } from "./generate.mjs";

export { generate };

export async function generateFile(path) {
  const model = JSON.parse(readFileSync(path, "utf8"));
  const { html, md } = await generate(model);
  const dir = dirname(path);
  const slug = (model.meta && model.meta.slug) || basename(path).replace(/\.(dossier\.)?json$/i, "");
  const htmlPath = join(dir, slug + ".html");
  const mdPath = join(dir, slug + ".md");
  writeFileSync(htmlPath, html);
  writeFileSync(mdPath, md);
  return { htmlPath, mdPath, slug };
}
