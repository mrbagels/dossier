import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generate, validateModel } from "../src/index.mjs";
import { diffModels } from "../src/diff.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const examplesDir = join(root, "examples");
const startersDir = join(root, "src", "starters");
const sample = JSON.parse(readFileSync(join(examplesDir, "sample.dossier.json"), "utf8"));

test("the sample validates", () => {
  assert.equal(validateModel(sample).ok, true);
});

test("all starters validate", () => {
  const files = readdirSync(startersDir).filter((file) => file.endsWith(".dossier.json"));
  assert.ok(files.length >= 1, "starters exist");
  for (const file of files) {
    const model = JSON.parse(readFileSync(join(startersDir, file), "utf8"));
    const result = validateModel(model);
    assert.deepEqual(result.errors, [], file);
  }
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

test("process-board renders controls and nested reference blocks", async () => {
  const model = {
    dossierVersion: "1.0",
    kind: "implementation",
    meta: { title: "Implementation", slug: "impl" },
    blocks: [
      {
        type: "process-board",
        title: "Work",
        items: [
          {
            id: "work-one",
            title: "Work one",
            summary: "Do the thing.",
            status: "proposed",
            owner: "agent",
            priority: "P1",
            verdict: "approve",
            files: ["src/file.ts"],
            verification: ["npm test"],
            blocks: [{ type: "code", lang: "ts", code: "const ok = true" }],
          },
        ],
      },
    ],
  };
  const result = validateModel(model);
  assert.deepEqual(result.errors, []);
  const { html, md } = await generate(structuredClone(model), {});
  assert.ok(html.includes('data-block="process-board"'), "renders the block");
  assert.ok(html.includes('data-process-verdict="work-one"'), "renders verdict control");
  assert.ok(html.includes("dossier.process/v1"), "runtime can export a process packet");
  assert.ok(html.includes("const ok"), "renders nested reference blocks");
  assert.ok(md.includes("### Work one ("), "exports process items to Markdown");
});

test("plugins: a registered block validates and renders", async () => {
  const { registerBlock } = await import("../src/index.mjs");
  registerBlock("badge-test", (b) => `<section class="ds-block" data-block="badge-test">${b.label || ""}</section>`);
  const model = { dossierVersion: "1.0", meta: { title: "x" }, blocks: [{ type: "badge-test", label: "hi" }] };
  assert.equal(validateModel(model).ok, true, "registered type passes validation");
  const { html } = await generate(structuredClone(model), {});
  assert.ok(/data-block="badge-test"/.test(html), "registered block renders");
});

test("renderer sanitizes hostile input (href schemes, theme vars, ragged rows)", async () => {
  const { html } = await generate({
    dossierVersion: "1.0",
    meta: { title: "X", theme: { accent: "red;} body{display:none}", "ev<il": "x" } },
    blocks: [
      { type: "references", items: [{ label: "bad", url: "javascript:alert(1)" }, { label: "ok", url: "https://example.com" }] },
      { type: "table", columns: ["A"], rows: [["fine"], "notarow", null] },
    ],
  });
  const themeDecl = html.match(/<style>:root\{([^}]*)\}/)[1]; // the injected theme vars only
  assert.ok(!/href="javascript:/.test(html), "javascript: href is neutralized");
  assert.ok(html.includes('href="https://example.com"'), "safe href passes through");
  assert.ok(!themeDecl.includes("{") && !themeDecl.includes("<"), "theme value cannot break out of its CSS declaration");
  assert.ok(html.includes("<td>fine</td>"), "valid row renders; non-array rows do not crash");
});

test("author-supplied _svg/_math fields are dropped (no raw HTML injection)", async () => {
  const { html } = await generate({
    dossierVersion: "1.0",
    meta: { title: "X" },
    blocks: [{ type: "diagram", format: "dot", spec: "not valid dot", _svg: "<script>alert(1)</script>" }, { type: "math", tex: "x", _math: "<img src=x onerror=alert(1)>" }],
  });
  assert.ok(!/<script>alert\(1\)<\/script>/.test(html), "smuggled _svg is not injected");
  assert.ok(!/onerror=alert/.test(html), "smuggled _math is not injected");
});

test("markdown frontmatter survives titles with colons and newlines", async () => {
  const { md } = await generate({ dossierVersion: "1.0", meta: { title: "a: b\n---\nx: y" }, blocks: [] });
  assert.ok(md.includes('title: "a: b\\n---\\nx: y"'), "title is a single quoted YAML scalar (newlines/colons escaped)");
  assert.ok(md.startsWith("---\ntitle:"), "frontmatter opens cleanly");
});

test("export to docx produces a valid Word document", async () => {
  const { exportDocx } = await import("../src/export.mjs");
  const buf = await exportDocx({ meta: { title: "X" }, blocks: [{ type: "hero", title: "H" }, { type: "prose", markdown: "hi" }, { type: "table", columns: ["A"], rows: [["1"]] }] });
  assert.ok(Buffer.isBuffer(buf) && buf.length > 0, "returns a buffer");
  assert.equal(buf.slice(0, 2).toString(), "PK", "is a zip (docx) file");
});

test("docx export embeds chart and figure as images", async () => {
  const { exportDocx } = await import("../src/export.mjs");
  const buf = await exportDocx({
    meta: { title: "X" },
    blocks: [
      { type: "chart", chartType: "bar", data: [{ label: "a", value: 3 }, { label: "b", value: 5 }] },
      { type: "figure", src: "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='10'%20height='10'%3E%3Crect%20width='10'%20height='10'/%3E%3C/svg%3E" },
    ],
  });
  const s = buf.toString("latin1");
  assert.ok((s.match(/word\/media\/[0-9a-f]+\.png/g) || []).length >= 2, "chart + figure both embed as PNG");
});

test("catalog indexes a folder and finds cross-links", async () => {
  const { buildCatalogModel } = await import("../src/catalog.mjs");
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const d = mkdtempSync(join(tmpdir(), "dossier-cat-"));
  writeFileSync(join(d, "a.dossier.json"), JSON.stringify({ meta: { title: "A", slug: "a" }, blocks: [{ type: "prose", markdown: "see [[b]]" }] }));
  writeFileSync(join(d, "b.dossier.json"), JSON.stringify({ meta: { title: "B", slug: "b" }, blocks: [] }));
  const { docs, model } = buildCatalogModel(d, {});
  assert.equal(docs.length, 2);
  assert.ok(docs.find((x) => x.slug === "a").links.includes("b"), "cross-link found");
  assert.ok(model.blocks.some((b) => b.type === "table"), "catalog has a document table");
});

test("diff detects added and changed blocks", () => {
  const a = { meta: { title: "A" }, blocks: [{ id: "x", type: "callout", body: "1" }] };
  const b = { meta: { title: "A" }, blocks: [{ id: "x", type: "callout", body: "2" }, { id: "y", type: "callout", body: "new" }] };
  const d = diffModels(a, b);
  assert.equal(d.added.length, 1);
  assert.equal(d.changed.length, 1);
  assert.equal(d.removed.length, 0);
});
