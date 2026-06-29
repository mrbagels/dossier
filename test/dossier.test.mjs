import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { generate, generateFile, parseUnifiedDiff, validateModel } from "../src/index.mjs";
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

test("validation catches unknown presentation skins", () => {
  const r = validateModel({ dossierVersion: "1.0", meta: { title: "Bad skin", skin: "console-sltae" }, blocks: [] });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /meta\.skin: unknown skin/.test(e)));
});

test("validation catches nested packet ids that agents depend on", () => {
  const r = validateModel({
    dossierVersion: "1.0",
    meta: { title: "Bad nested ids" },
    blocks: [
      { type: "prose", id: "UpperCase", markdown: "Bad block id." },
      { type: "process-board", title: "Work", items: [{ title: "No id" }] },
      { type: "finding-list", title: "Findings", findings: [{ id: "UpperCase", title: "Bad nested id" }] },
      { type: "release-checklist", title: "Release", gates: [{ id: "bad id", title: "Bad" }] },
      { type: "patch-set", title: "Patches", patches: [] },
    ],
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /blocks\[0\]\.id/.test(e)), "block id must be lowercase kebab-case");
  assert.ok(r.errors.some((e) => /items\[0\]\.id/.test(e)), "process item id is required");
  assert.ok(r.errors.some((e) => /findings\[0\]\.id/.test(e)), "nested item id must be lowercase kebab-case");
  assert.ok(r.errors.some((e) => /gates\[0\]\.id/.test(e)), "release gate id must be a slug");
  assert.ok(r.errors.some((e) => /missing required "patches"/.test(e)), "empty patch set is rejected");
});

test("generate yields a self-contained, agent-readable artifact", async () => {
  const { html, embedHtml, md, digest } = await generate(structuredClone(sample), { baseDir: examplesDir });
  assert.ok(html.includes('id="dossier-model"'), "has the data island");
  assert.ok(!/<(link|script)[^>]+(src|href)="https?:/.test(html), "no external assets");
  const island = html.match(/id="dossier-model">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<");
  const model = JSON.parse(island);
  assert.equal(model.meta.title, sample.meta.title, "island round-trips");
  assert.ok(!/_hl|_svg/.test(island), "build fields stripped from island");
  assert.ok(md.length > 0 && digest.length > 0, "markdown + digest exported");
  assert.ok(embedHtml.includes('data-dossier-embed="true"'), "has an embed variant");
  assert.ok(embedHtml.includes('id="dossier-model"'), "embed keeps the source model island");
  assert.ok(!embedHtml.includes('<header class="ds-topbar"'), "embed strips topbar chrome");
  assert.ok(!embedHtml.includes('<aside class="ds-toc"'), "embed strips table-of-contents chrome");
  assert.ok(!embedHtml.includes('<footer class="ds-footer"'), "embed strips footer chrome");
});

test("generateFile can write a chrome-stripped embed artifact", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dossier-embed-"));
  const file = join(dir, "embed.dossier.json");
  writeFileSync(file, JSON.stringify({ dossierVersion: "1.0", meta: { title: "Embed", slug: "embed" }, blocks: [{ type: "prose", markdown: "Host me." }] }, null, 2));
  const result = await generateFile(file, { embed: true });
  assert.ok(existsSync(result.htmlPath), "writes full html");
  assert.ok(existsSync(result.mdPath), "writes markdown");
  assert.ok(existsSync(result.embedPath), "writes embed html");
  const embed = readFileSync(result.embedPath, "utf8");
  assert.ok(embed.includes('data-dossier-embed="true"'), "embed file is marked");
  assert.ok(embed.includes("Host me."), "embed file contains content");
  assert.ok(!embed.includes('<header class="ds-topbar"'), "embed file excludes topbar");
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

test("patch-set and diff-view render parsed unified diffs", async () => {
  const diff = "diff --git a/src/file.ts b/src/file.ts\n--- a/src/file.ts\n+++ b/src/file.ts\n@@ -1,2 +1,2 @@\n-const oldValue = true;\n+const newValue = true;";
  const files = parseUnifiedDiff(diff, "preview.diff");
  assert.equal(files.length, 1);
  assert.equal(files[0].additions, 1);
  assert.equal(files[0].deletions, 1);
  assert.equal(files[0].newPath, "src/file.ts");
  const model = {
    dossierVersion: "1.0",
    kind: "implementation",
    meta: { title: "Implementation", slug: "impl" },
    blocks: [
      {
        type: "patch-set",
        title: "Patches",
        patches: [
          {
            id: "patch-one",
            title: "Patch one",
            operation: "modify",
            status: "proposed",
            risk: "low",
            files: ["src/file.ts"],
            workItems: ["work-one"],
            verification: ["npm test"],
            diff,
          },
        ],
      },
      { type: "diff-view", title: "Diff", diff },
    ],
  };
  const result = validateModel(model);
  assert.deepEqual(result.errors, []);
  const { html, md } = await generate(structuredClone(model), {});
  assert.ok(html.includes('data-block="patch-set"'), "renders patch-set");
  assert.ok(html.includes('data-block="diff-view"'), "renders diff-view");
  assert.ok(html.includes('data-patch-verdict="patch-one"'), "renders patch review verdict control");
  assert.ok(html.includes('data-diff-file-verdict="diff-1:src/file.ts"'), "renders file review verdict control");
  assert.ok(html.includes("dossier.patch-review/v1"), "runtime can export patch review packets");
  assert.ok(html.includes("dossier.diff-review/v1"), "runtime can export diff review packets");
  assert.ok(html.includes("ds-diff-line add"), "renders additions");
  assert.ok(html.includes("ds-diff-line del"), "renders deletions");
  assert.ok(md.includes("```diff"), "exports diff markdown");
});

test("packet schemas are published for agent handoff contracts", () => {
  const packetDir = join(root, "schema", "packets");
  const names = ["process", "edits", "verdicts", "release", "patch-review", "diff-review", "trust", "closeout"];
  for (const name of names) {
    const schema = JSON.parse(readFileSync(join(packetDir, `${name}.schema.json`), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema", name);
    assert.ok(schema.title.includes("Dossier"), name);
  }
});

test("code-editor renders editable text hooks and edit packet export", async () => {
  const model = {
    dossierVersion: "1.0",
    kind: "implementation",
    meta: { title: "Editor", slug: "editor" },
    blocks: [
      {
        type: "code-editor",
        title: "Editable config",
        summary: "A bounded edit surface.",
        lang: "json",
        filename: "config.json",
        targetPath: "config/config.json",
        workItems: ["config-update"],
        code: "{\n  \"enabled\": true\n}\n",
      },
    ],
  };
  const result = validateModel(model);
  assert.deepEqual(result.errors, []);
  const { html, md } = await generate(structuredClone(model), {});
  assert.ok(html.includes('data-block="code-editor"'), "renders code-editor");
  assert.ok(html.includes('data-code-editor="editable-config-0"'), "renders editor data hook");
  assert.ok(html.includes("dossier.edits/v1"), "runtime can export edits packet");
  assert.ok(md.includes("```json"), "exports editor content to Markdown");
});

test("process closeout blocks render and export agent-readable packet hooks", async () => {
  const model = {
    dossierVersion: "1.0",
    kind: "release",
    meta: { title: "Closeout", slug: "closeout" },
    blocks: [
      {
        type: "verification-run",
        title: "Verification",
        runs: [
          { id: "test-suite", title: "Test suite", command: "npm test", status: "passed", expected: "green", actual: "green" },
        ],
      },
      {
        type: "evidence-log",
        title: "Evidence",
        items: [
          { id: "log-one", title: "Build log", kind: "command", source: "local", trust: "high", body: "Build completed." },
        ],
      },
      {
        type: "trust-report",
        title: "Trust report",
        summary: "Claims are tied to source and evidence ids.",
        sources: [
          { id: "npm-test", label: "npm test", kind: "command", trust: "high", summary: "Local test command." },
        ],
        claims: [
          { id: "tests-pass", claim: "The test suite passes.", status: "verified", confidence: "high", sources: ["npm-test"], evidence: ["test-suite"] },
        ],
      },
      { type: "verdict-gate", title: "Ship gate", prompt: "Ready to ship?", gateId: "ship", verdict: "approve" },
      {
        type: "process-receipt",
        title: "Receipt",
        outcome: "shipped",
        owner: "agent",
        changedFiles: ["src/index.mjs"],
        commands: ["npm test"],
      },
      {
        type: "finding-list",
        title: "Findings",
        findings: [
          { id: "finding-one", title: "Null handling", severity: "medium", body: "Guard the boundary.", files: ["src/index.mjs"] },
        ],
      },
      {
        type: "comment-thread",
        title: "Threads",
        threads: [
          { id: "thread-one", subject: "Review note", comments: [{ author: "Kyle", body: "Prefer the direct path." }] },
        ],
      },
      {
        type: "cycle-board",
        title: "Cycles",
        cycles: [
          { id: "cycle-one", title: "Consumer dogfood", status: "done", summary: "Consumer passed." },
        ],
      },
      {
        type: "integration-report",
        title: "Integration report",
        producer: "dossier",
        consumer: "lumen",
        status: "accepted",
        items: [{ id: "api", title: "API contract", summary: "No breaking change." }],
      },
      {
        type: "upstream-response",
        title: "Upstream",
        upstream: "library",
        status: "opened",
        request: "Accept patch",
        response: "Pending",
      },
      {
        type: "release-checklist",
        title: "Release gates",
        gates: [{ id: "tests", title: "Tests pass", status: "passed", required: true, evidence: "npm test" }],
      },
      {
        type: "decision-log",
        title: "Decisions",
        decisions: [{ id: "ship", decision: "Ship", owner: "Kyle", rationale: "All gates passed." }],
      },
    ],
  };
  const result = validateModel(model);
  assert.deepEqual(result.errors, []);
  const { html, md } = await generate(structuredClone(model), {});
  assert.ok(html.includes('data-block="verification-run"'), "renders verification-run");
  assert.ok(html.includes('data-block="release-checklist"'), "renders release-checklist");
  assert.ok(html.includes('data-block="trust-report"'), "renders trust-report");
  assert.ok(html.includes('data-trust-claim="tests-pass"'), "renders trust claim hook");
  assert.ok(html.includes('data-verdict-gate="ship"'), "renders verdict gate hook");
  assert.ok(html.includes("dossier.verdicts/v1"), "runtime can export verdict packets");
  assert.ok(html.includes("dossier.release/v1"), "runtime can export release packets");
  assert.ok(html.includes("Integration report"), "new titled blocks are present");
  assert.ok(md.includes("## Verification"), "exports verification markdown");
  assert.ok(md.includes("## Trust report"), "exports trust markdown");
  assert.ok(md.includes("- [x] Tests pass"), "exports release checklist markdown");
});

test("process packet markup preserves current state for export and import", async () => {
  const model = {
    dossierVersion: "1.0",
    kind: "release",
    meta: { title: "Packets", slug: "packets" },
    blocks: [
      { type: "process-board", title: "Work", items: [{ id: "ship-work", title: "Ship work", verdict: "approve" }] },
      { type: "verdict-gate", title: "Ship gate", prompt: "Ship?", gateId: "ship-gate", verdict: "approve" },
      { type: "release-checklist", title: "Release", gates: [{ id: "tests", title: "Tests pass", status: "passed", required: true, evidence: "npm test" }] },
    ],
  };
  const { html } = await generate(structuredClone(model), {});
  assert.ok(html.includes('data-verdict-title="Ship gate"'), "verdict packet carries a title");
  assert.ok(html.includes('data-release-title="Tests pass"'), "release packet carries a gate title");
  assert.ok(html.includes('data-release-required="1"'), "release packet carries required state");
  assert.ok(html.includes("function collectProcess()"), "process export collects current DOM state");
  assert.ok(html.includes("function collectVerdicts()"), "verdict export collects current DOM state");
  assert.ok(html.includes("function collectRelease()"), "release export collects current DOM state");
  assert.ok(html.includes("function byAttr("), "imports avoid fragile selector string interpolation");
});

test("mcp helpers normalize packets and validate writes before touching disk", async () => {
  const { handleTool } = await import("../mcp/server.mjs");
  const rendered = await handleTool("dossier_render", {
    model: { dossierVersion: "1.0", meta: { title: "Rendered" }, blocks: [] },
    theme: "forest",
    skin: "console-slate",
    embed: true,
  });
  assert.ok(rendered.content[1].text.includes('data-skin="console-slate"'), "MCP render applies skin flag");
  assert.ok(rendered.content[1].text.includes("--ds-accent: #2f7d55"), "MCP render applies theme flag");
  assert.ok(rendered.content[2].text.includes('data-dossier-embed="true"'), "MCP render can return embed HTML");

  const release = await handleTool("dossier_read_release", {
    release: {
      schema: "dossier.release/v1",
      release: [{ id: "tests", done: true, notes: "green", title: "Tests pass", required: true }],
    },
  });
  const body = JSON.parse(release.content[0].text);
  assert.equal(body.gates[0].id, "tests");
  assert.equal(body.gates[0].title, "Tests pass");
  assert.equal(body.totals.done, 1);

  const dir = mkdtempSync(join(tmpdir(), "dossier-mcp-"));
  const file = join(dir, "mcp.dossier.json");
  writeFileSync(file, JSON.stringify({ dossierVersion: "1.0", meta: { title: "MCP" }, blocks: [] }, null, 2));
  const writeRender = await handleTool("dossier_render", { outPath: file, model: { dossierVersion: "1.0", meta: { title: "Written", slug: "written" }, blocks: [] }, embed: true });
  const writeBody = JSON.parse(writeRender.content[0].text);
  assert.ok(existsSync(writeBody.embedPath), "MCP render writes embed HTML when requested");
  await handleTool("dossier_record_run", { path: file, run: { command: "npm test", status: "passed" } });
  let model = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(model.blocks[0].type, "verification-run");
  assert.equal(model.blocks[0].runs[0].command, "npm test");
  await assert.rejects(
    () => handleTool("dossier_attach_patchset", { path: file, patchSet: { type: "patch-set", title: "Empty", patches: [] } }),
    /invalid dossier after update/
  );
  model = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(model.blocks.length, 1, "invalid write was not persisted");

  await handleTool("dossier_record_claim", {
    path: file,
    title: "Trust",
    sources: [{ id: "npm-test", label: "npm test", kind: "command", trust: "high" }],
    claim: { id: "tests-pass", claim: "Tests pass.", status: "verified", confidence: "high", sources: ["npm-test"] },
  });
  model = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(model.blocks[1].type, "trust-report");
  const trust = await handleTool("dossier_read_trust", { path: file });
  const trustBody = JSON.parse(trust.content[0].text);
  assert.equal(trustBody.totals.claims, 1);
  assert.equal(trustBody.reports[0].byStatus.verified, 1);
  const trustSchema = await handleTool("dossier_get_packet_schema", { name: "trust" });
  assert.ok(trustSchema.content[0].text.includes("dossier.trust/v1"));
});

test("mcp apply and closeout tools update models with packet state", async () => {
  const { handleTool } = await import("../mcp/server.mjs");
  const dir = mkdtempSync(join(tmpdir(), "dossier-mcp-apply-"));
  const file = join(dir, "apply.dossier.json");
  writeFileSync(
    file,
    JSON.stringify(
      {
        dossierVersion: "1.0",
        meta: { title: "Apply", slug: "apply" },
        blocks: [
          { type: "code-editor", id: "config-editor", title: "Config", targetPath: "config.json", code: "{}\n" },
          { type: "process-board", title: "Work", items: [{ id: "config-work", title: "Config work" }] },
          { type: "patch-set", title: "Patches", patches: [{ id: "config-patch", title: "Config patch" }] },
        ],
      },
      null,
      2
    )
  );
  let res = await handleTool("dossier_apply_edits", {
    path: file,
    edits: { schema: "dossier.edits/v1", edits: { "config-editor": { text: "{\n  \"enabled\": true\n}\n" } } },
  });
  assert.equal(JSON.parse(res.content[0].text).applied, 1);
  res = await handleTool("dossier_apply_process", {
    path: file,
    process: { schema: "dossier.process/v1", process: { "config-work": { verdict: "approve", notes: "Ready." } } },
  });
  assert.equal(JSON.parse(res.content[0].text).applied, 1);
  res = await handleTool("dossier_apply_patch_review", {
    path: file,
    patches: { schema: "dossier.patch-review/v1", patches: { "config-patch": { verdict: "approve", notes: "Apply." } } },
  });
  assert.equal(JSON.parse(res.content[0].text).applied, 1);
  await handleTool("dossier_closeout_model", {
    path: file,
    packets: { edits: { edits: { "config-editor": { targetPath: "config.json", text: "x" } } } },
    summary: "Closed out.",
  });
  const model = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(model.blocks[0].code, "{\n  \"enabled\": true\n}\n");
  assert.equal(model.blocks[1].items[0].notes, "Ready.");
  assert.equal(model.blocks[2].patches[0].status, "accepted");
  assert.equal(model.blocks.at(-1).type, "process-receipt");
});

test("serve exposes validated save-back and patch import endpoints", async () => {
  const { serve } = await import("../src/serve.mjs");
  const dir = mkdtempSync(join(tmpdir(), "dossier-serve-"));
  const file = join(dir, "live.dossier.json");
  writeFileSync(
    file,
    JSON.stringify(
      {
        dossierVersion: "1.0",
        kind: "implementation",
        meta: { title: "Live", slug: "live" },
        blocks: [{ type: "code-editor", title: "Untitled editor", lang: "js", code: "const a = 1;\n" }],
      },
      null,
      2
    )
  );
  const live = await serve(file, { port: 0, quiet: true, theme: "forest", skin: "console-slate" });
  try {
    let res = await fetch(live.url + "/__save-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled editor", text: "const a = 2;\n" }),
    });
    assert.equal(res.ok, true, await res.text());
    let model = JSON.parse(readFileSync(file, "utf8"));
    assert.equal(model.blocks[0].code, "const a = 2;\n");

    res = await fetch(live.url + "/__append-patchset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "patch-set", title: "Empty", patches: [] }),
    });
    assert.equal(res.status, 400);
    model = JSON.parse(readFileSync(file, "utf8"));
    assert.equal(model.blocks.length, 1, "invalid patch import was not persisted");

    res = await fetch(live.url + "/__append-patchset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "patch-set", title: "Imported", patches: [{ id: "patch-one", title: "Patch one" }] }),
    });
    assert.equal(res.ok, true, await res.text());
    model = JSON.parse(readFileSync(file, "utf8"));
    assert.equal(model.blocks[1].type, "patch-set");

    res = await fetch(live.url + "/__save-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: {
          dossierVersion: "1.0",
          kind: "implementation",
          meta: { title: "Live saved", slug: "live" },
          blocks: [{ type: "prose", markdown: "Saved from model editor." }],
        },
      }),
    });
    assert.equal(res.ok, true, await res.text());
    model = JSON.parse(readFileSync(file, "utf8"));
    assert.equal(model.meta.title, "Live saved");

    res = await fetch(live.url);
    const html = await res.text();
    assert.ok(html.includes("DossierEditorEnhancer"), "live runtime includes editor enhancer");
    assert.ok(html.includes("data-live-model-open"), "live runtime includes model editor control");
    assert.ok(html.includes('data-skin="console-slate"'), "serve applies skin flag");
    assert.ok(html.includes("--ds-accent: #2f7d55"), "serve applies theme flag");
  } finally {
    await live.close();
  }
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
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const themeDecl = [...style.matchAll(/:root\{([^}]*)\}/g)].map((m) => m[1]).find((decl) => decl.includes("--ds-accent: red"));
  assert.ok(!/href="javascript:/.test(html), "javascript: href is neutralized");
  assert.ok(html.includes('href="https://example.com"'), "safe href passes through");
  assert.ok(themeDecl, "the sanitized document theme declaration is present");
  assert.ok(!themeDecl.includes("{") && !themeDecl.includes("<"), "theme value cannot break out of its CSS declaration");
  assert.ok(html.includes("<td>fine</td>"), "valid row renders; non-array rows do not crash");
});

test("presentation options layer base CSS, skin CSS, and document theme overrides", async () => {
  const model = {
    dossierVersion: "1.0",
    meta: { title: "Styled", slug: "styled", theme: { accent: "#123456" } },
    blocks: [{ type: "hero", title: "Styled", sideCards: [{ label: "Skin", value: "Console Slate" }] }],
  };
  const { html } = await generate(model, { theme: "amber", skin: "console-slate" });
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.ok(html.includes('data-skin="console-slate"'), "HTML records the active skin");
  assert.ok(style.includes("skin:console-slate"), "skin CSS is present");
  assert.ok(
    style.indexOf("--ds-accent:#c81e4a") < style.indexOf("skin:console-slate") &&
      style.indexOf("skin:console-slate") < style.lastIndexOf("--ds-accent: #123456"),
    "cascade order is base CSS, then skin, then explicit meta.theme"
  );
  assert.ok(style.includes("--ds-accent-2: #a06409"), "theme pack tokens are merged when not overridden");
  const island = JSON.parse(html.match(/id="dossier-model">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"));
  assert.equal(island.meta.skin, "console-slate");
  assert.equal(island.meta.theme.accent, "#123456");
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

test("publish builds a static dossier site with catalog index", async () => {
  const { publishDir } = await import("../src/publish.mjs");
  const d = mkdtempSync(join(tmpdir(), "dossier-publish-"));
  const out = join(d, "public");
  writeFileSync(join(d, "a.dossier.json"), JSON.stringify({ dossierVersion: "1.0", meta: { title: "A", slug: "a" }, blocks: [{ type: "prose", markdown: "see [[b]]" }] }, null, 2));
  writeFileSync(join(d, "b.dossier.json"), JSON.stringify({ dossierVersion: "1.0", meta: { title: "B", slug: "b" }, blocks: [{ type: "callout", body: "B" }] }, null, 2));
  const result = await publishDir(d, { out, title: "Published", theme: "forest", skin: "console-slate", embed: true });
  assert.equal(result.docs.length, 2);
  assert.ok(existsSync(join(out, "a.html")), "published document html");
  assert.ok(existsSync(join(out, "a.embed.html")), "published document embed html");
  assert.ok(existsSync(join(out, "a.md")), "published document markdown");
  assert.ok(existsSync(join(out, "index.html")), "published catalog html");
  assert.ok(existsSync(join(out, "index.embed.html")), "published catalog embed html");
  assert.ok(existsSync(join(out, "index.dossier.json")), "published catalog source");
  const html = readFileSync(join(out, "a.html"), "utf8");
  assert.ok(html.includes('data-skin="console-slate"'), "publish applies skin flag");
  assert.ok(html.includes("--ds-accent: #2f7d55"), "publish applies theme flag");
  const embed = readFileSync(join(out, "a.embed.html"), "utf8");
  assert.ok(embed.includes('data-dossier-embed="true"'), "publish applies embed flag");
  assert.ok(embed.includes('data-skin="console-slate"'), "publish embed keeps skin flag");
});

test("diff detects added and changed blocks", () => {
  const a = { meta: { title: "A" }, blocks: [{ id: "x", type: "callout", body: "1" }] };
  const b = { meta: { title: "A" }, blocks: [{ id: "x", type: "callout", body: "2" }, { id: "y", type: "callout", body: "new" }] };
  const d = diffModels(a, b);
  assert.equal(d.added.length, 1);
  assert.equal(d.changed.length, 1);
  assert.equal(d.removed.length, 0);
});
