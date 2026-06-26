#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateFile, validateModel, registerBlock, esc, inlineMd, slugify } from "../src/index.mjs";

const argv = process.argv.slice(2);
const cmd = argv[0];
// pull out --flags; rest are positional
const VALUE_FLAGS = new Set(["kind", "out", "plugin"]);
const flags = {};
const args = [];
const rest = argv.slice(1);
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a.startsWith("--")) {
    const eq = a.indexOf("=");
    if (eq >= 0) {
      flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      const name = a.slice(2);
      const next = rest[i + 1];
      if (VALUE_FLAGS.has(name) && next !== undefined && !next.startsWith("--")) {
        flags[name] = next;
        i++;
      } else flags[name] = true;
    }
  } else args.push(a);
}

const STARTERS = ["dossier", "adr", "runbook", "postmortem", "review-board"];

const USAGE = [
  "Dossier — self-contained, agent-readable HTML documents from one JSON file.",
  "",
  "Usage:",
  "  dossier init [name] [--kind <kind>]      scaffold <name>.dossier.json from a starter",
  "  dossier build <file.dossier.json> ...    validate + render to <slug>.html (+ .md)",
  "  dossier validate <file.dossier.json> ... check a model without rendering",
  "",
  "Starters (--kind): " + STARTERS.join(", "),
  "Flags: --no-validate (build without validating)",
].join("\n");

if (cmd === "build" && args.length) {
  if (flags.plugin) {
    for (const p of String(flags.plugin).split(",").map((s) => s.trim()).filter(Boolean)) {
      try {
        const mod = await import(pathToFileURL(resolve(p)).href);
        if (typeof mod.default === "function") mod.default({ registerBlock, esc, inlineMd, slugify });
      } catch (e) {
        console.error("✗ plugin " + p + ": " + e.message);
        process.exitCode = 1;
      }
    }
  }
  for (const f of args) {
    try {
      const r = await generateFile(f, { validate: flags["no-validate"] ? false : true });
      console.log("✓ " + r.htmlPath);
    } catch (e) {
      console.error("✗ " + f + ":\n  " + e.message.replace(/\n/g, "\n  "));
      process.exitCode = 1;
    }
  }
} else if (cmd === "validate" && args.length) {
  for (const f of args) {
    try {
      const model = JSON.parse(readFileSync(f, "utf8"));
      const { ok, errors } = validateModel(model);
      if (ok) console.log("✓ " + f + " is valid");
      else {
        console.error("✗ " + f + ":\n  - " + errors.join("\n  - "));
        process.exitCode = 1;
      }
    } catch (e) {
      console.error("✗ " + f + ": " + e.message);
      process.exitCode = 1;
    }
  }
} else if (cmd === "init") {
  const name = (args[0] || "dossier").replace(/\.dossier\.json$/i, "").replace(/\.json$/i, "");
  const kind = STARTERS.includes(flags.kind) ? flags.kind : "dossier";
  const out = name + ".dossier.json";
  if (existsSync(out)) {
    console.error("✗ " + out + " already exists");
    process.exit(1);
  }
  const starter = new URL(`../src/starters/${kind}.dossier.json`, import.meta.url);
  const text = readFileSync(starter, "utf8").replace(/"slug": "replace-with-slug"/, `"slug": "${name}"`);
  writeFileSync(out, text);
  console.log(`✓ wrote ${out} (kind: ${kind})\n  edit it, then: dossier build ${out}  (writes ${name}.html)`);
} else {
  console.log(USAGE);
  process.exit(cmd ? 0 : 1);
}
