#!/usr/bin/env node
import { generateFile } from "../src/index.mjs";

const [, , cmd, ...args] = process.argv;

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
} else {
  console.log("Usage: dossier build <file.dossier.json> [more.json ...]");
  process.exit(cmd ? 0 : 1);
}
