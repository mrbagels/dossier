import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generate, validateModel } from "../src/index.mjs";
import { diffModels } from "../src/diff.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const examplesDir = join(root, "examples");
const sample = JSON.parse(readFileSync(join(examplesDir, "sample.dossier.json"), "utf8"));

test("the sample validates", () => {
  assert.equal(validateModel(sample).ok, true);
});

test("validation catches unknown types and missing fields", () => {
  const r = validateModel({ dossierVersion: "1.0", meta: {}, blocks: [{ type: "nope" }, { type: "code" }] });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /unknown block type/.test(e)));
  assert.ok(r.errors.some((e) => /meta.title/.test(e)));
  assert.ok(r.errors.some((e) => /missing required "code"/.test(e)));
});

test("generate yields a self-contained, agent-readable artifact", async () => {
  const { html, md, digest } = await generate(structuredClone(sample), { baseDir: examplesDir });
  assert.ok(html.includes('id="dossier-model"'), "has the data island");
  assert.ok(!/<(link|script)[^>]+(src|href)="https?:/.test(html), "no external assets");
  const island = html.match(/id="dossier-model">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<");
  const model = JSON.parse(island);
  assert.equal(model.meta.title, sample.meta.title, "island round-trips");
  assert.ok(!/_hl|_svg/.test(island), "build fields stripped from island");
  assert.ok(md.length > 0 && digest.length > 0, "markdown + digest exported");
});

test("every block in the sample renders (no 'unsupported')", async () => {
  const { html } = await generate(structuredClone(sample), { baseDir: examplesDir });
  assert.ok(!/Unsupported block type/.test(html));
});

test("diff detects added and changed blocks", () => {
  const a = { meta: { title: "A" }, blocks: [{ id: "x", type: "callout", body: "1" }] };
  const b = { meta: { title: "A" }, blocks: [{ id: "x", type: "callout", body: "2" }, { id: "y", type: "callout", body: "new" }] };
  const d = diffModels(a, b);
  assert.equal(d.added.length, 1);
  assert.equal(d.changed.length, 1);
  assert.equal(d.removed.length, 0);
});
