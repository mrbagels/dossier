#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { generateFile } from "../src/index.mjs";

const [, , cmd, ...args] = process.argv;

const USAGE = [
  "Dossier — self-contained, agent-readable HTML documents from one JSON file.",
  "",
  "Usage:",
  "  dossier init [name]                      scaffold <name>.dossier.json from the starter",
  "  dossier build <file.dossier.json> ...    render to <slug>.html (+ .md)",
].join("\n");

if (cmd === "build" && args.length) {
  for (const f of args) {
    try {
      const r = await generateFile(f);
      console.log("✓ " + r.htmlPath);
    } catch (e) {
      console.error("✗ " + f + ": " + e.message);
      process.exitCode = 1;
    }
  }
} else if (cmd === "init") {
  const name = (args[0] || "dossier").replace(/\.dossier\.json$/i, "").replace(/\.json$/i, "");
  const out = name + ".dossier.json";
  if (existsSync(out)) {
    console.error("✗ " + out + " already exists");
    process.exit(1);
  }
  const starter = new URL("../skill/references/starter.dossier.json", import.meta.url);
  const text = readFileSync(starter, "utf8").replace(/"slug": "replace-with-slug"/, `"slug": "${name}"`);
  writeFileSync(out, text);
  console.log("✓ wrote " + out + "\n  edit it, then: dossier build " + out + "  (writes " + name + ".html)");
} else {
  console.log(USAGE);
  process.exit(cmd ? 0 : 1);
}
