import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { renderDossier } from "./render";

const path = process.argv[2];
if (!path) {
  console.error("Usage: tsx src/cli.tsx <file.dossier.json>");
  process.exit(1);
}

const model = JSON.parse(readFileSync(path, "utf8"));
const { html } = await renderDossier(model);
const dir = dirname(path);
const slug = (model.meta && model.meta.slug) || basename(path).replace(/\.(dossier\.)?json$/i, "");
const out = join(dir, slug + ".react.html");
writeFileSync(out, html);
console.log("✓ " + out);
