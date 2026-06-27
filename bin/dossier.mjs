#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, basename, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { generateFile, validateModel, registerBlock, esc, inlineMd, slugify } from "../src/index.mjs";

const argv = process.argv.slice(2);
const cmd = argv[0];
// pull out --flags; rest are positional
const VALUE_FLAGS = new Set(["kind", "out", "plugin", "port", "title", "base-url", "format", "theme"]);
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
  "Dossier, self-contained, agent-readable HTML documents from one JSON file.",
  "",
  "Usage:",
  "  dossier init [name] [--kind <kind>]      scaffold <name>.dossier.json from a starter",
  "  dossier build <file.dossier.json> ...    validate + render to <slug>.html (+ .md)",
  "  dossier serve <file.dossier.json>        build + live-reload dev server (--open, --port)",
  "  dossier validate <file.dossier.json> ... check a model without rendering",
  "  dossier diff <old.json> <new.json>      structural diff between two versions",
  "  dossier catalog <dir>                    index a folder of dossiers (+ link graph)",
  "  dossier export <file> --format docx|md|pdf  export to Word, Markdown, or PDF",
  "  dossier mcp                              run the MCP server (stdio) for agents",
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
      const r = await generateFile(f, { validate: flags["no-validate"] ? false : true, theme: flags.theme });
      console.log("✓ " + r.htmlPath);
    } catch (e) {
      console.error("✗ " + f + ":\n  " + e.message.replace(/\n/g, "\n  "));
      process.exitCode = 1;
    }
  }
  if (flags.watch) {
    const { watch } = await import("node:fs");
    console.log("watching " + args.join(", ") + ", Ctrl-C to stop");
    for (const f of args) {
      let t;
      watch(f, () => {
        clearTimeout(t);
        t = setTimeout(async () => {
          try {
            const r = await generateFile(f, { validate: flags["no-validate"] ? false : true, theme: flags.theme });
            console.log("↻ " + r.htmlPath);
          } catch (e) {
            console.error("✗ " + e.message.replace(/\n/g, "\n  "));
          }
        }, 80);
      });
    }
  }
} else if (cmd === "serve" && args.length) {
  const { serve } = await import("../src/serve.mjs");
  await serve(args[0], { port: flags.port, open: !!flags.open });
} else if (cmd === "mcp") {
  const { main } = await import("../mcp/server.mjs");
  await main();
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
} else if (cmd === "diff" && args.length >= 2) {
  const { diffModels, formatDiff } = await import("../src/diff.mjs");
  try {
    const oldM = JSON.parse(readFileSync(args[0], "utf8"));
    const newM = JSON.parse(readFileSync(args[1], "utf8"));
    console.log(`diff ${args[0]} → ${args[1]}`);
    console.log(formatDiff(diffModels(oldM, newM)));
  } catch (e) {
    console.error("✗ " + e.message);
    process.exitCode = 1;
  }
} else if (cmd === "catalog" && args.length) {
  const { buildCatalogModel } = await import("../src/catalog.mjs");
  try {
    const dir = args[0];
    const { model, docs } = buildCatalogModel(dir, { title: flags.title, baseUrl: flags["base-url"] });
    const outPath = flags.out || join(dir, "index.dossier.json");
    writeFileSync(outPath, JSON.stringify(model, null, 2) + "\n");
    const r = await generateFile(outPath, { theme: flags.theme });
    console.log(`✓ ${r.htmlPath}  (${docs.length} documents)`);
  } catch (e) {
    console.error("✗ " + e.message);
    process.exitCode = 1;
  }
} else if (cmd === "export" && args.length) {
  const f = args[0];
  const fmt = String(flags.format || "docx").toLowerCase();
  try {
    const model = JSON.parse(readFileSync(f, "utf8"));
    const slug = (model.meta && model.meta.slug) || basename(f).replace(/\.(dossier\.)?json$/i, "");
    if (fmt === "docx") {
      const { exportDocx } = await import("../src/export.mjs");
      const out = flags.out || slug + ".docx";
      writeFileSync(out, await exportDocx(model));
      console.log("✓ " + out);
    } else if (fmt === "md") {
      const { generate } = await import("../src/index.mjs");
      const { md } = await generate(model, { baseDir: dirname(f) });
      const out = flags.out || slug + ".md";
      writeFileSync(out, md);
      console.log("✓ " + out);
    } else if (fmt === "pdf") {
      const { generate } = await import("../src/index.mjs");
      const { exportPdf } = await import("../src/export.mjs");
      const { html } = await generate(model, { baseDir: dirname(f) });
      const out = flags.out || slug + ".pdf";
      writeFileSync(out, await exportPdf(html));
      console.log("✓ " + out);
    } else {
      console.error("✗ unknown format: " + fmt + " (supported: docx, md, pdf)");
      process.exitCode = 1;
    }
  } catch (e) {
    console.error("✗ " + e.message);
    process.exitCode = 1;
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

// Release the optional headless browser (if Mermaid/PDF launched one) so the
// process can exit. A no-op when nothing launched it. Skip long-lived commands.
if (cmd !== "serve" && cmd !== "mcp" && !flags.watch) {
  const { closeBrowser } = await import("../src/headless.mjs");
  await closeBrowser();
}
