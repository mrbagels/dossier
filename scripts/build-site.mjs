// Build the demo site (deployed to GitHub Pages by .github/workflows/pages.yml).
// The showcase is the landing page, so it always reflects the current capabilities -
// add new block types to examples/showcase.dossier.json and the live demo updates.

import { generateFile } from "../src/index.mjs";
import { mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const site = join(root, "site");
mkdirSync(site, { recursive: true });

const pages = [
  ["examples/showcase.dossier.json", "index.html"],
  ["examples/sample.dossier.json", "overview.html"],
];

for (const [src, out] of pages) {
  const { htmlPath } = await generateFile(join(root, src));
  copyFileSync(htmlPath, join(site, out));
  console.log("site/" + out);
}
