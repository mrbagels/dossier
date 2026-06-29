// Dossier MCP server, lets any MCP-capable agent author, validate, render, read,
// and update process packets. Run via `dossier mcp` (stdio transport).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { generate, validateModel } from "../src/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const STARTERS = [
  "dossier",
  "plan",
  "implementation",
  "review",
  "debug",
  "integration-loop",
  "release",
  "incident",
  "adr",
  "runbook",
  "postmortem",
  "review-board",
];

const TOOLS = [
  {
    name: "dossier_render",
    description:
      "Validate and render a Dossier model into a self-contained HTML page (+ Markdown). The page embeds the model as a #dossier-model island so it stays agent-readable. Provide `outPath` to write files, otherwise the HTML is returned inline.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "object", description: "A Dossier document model: { dossierVersion, kind, meta, blocks[] }." },
        outPath: { type: "string", description: "Optional path to write <slug>.html and <slug>.md next to." },
      },
      required: ["model"],
    },
  },
  {
    name: "dossier_validate",
    description: "Validate a Dossier model and return precise, path-pointed errors. Use before rendering to self-correct.",
    inputSchema: { type: "object", properties: { model: { type: "object" } }, required: ["model"] },
  },
  {
    name: "dossier_read_decisions",
    description:
      "Read a decisions packet exported from a review-board ({ slug, decisions: { id: { selected, notes } } }) and return the selected items with notes, the human's choices to implement.",
    inputSchema: {
      type: "object",
      properties: {
        decisions: { type: "object", description: "The exported decisions JSON, or its `decisions` map." },
        path: { type: "string", description: "Alternatively, a path to a .decisions.json file." },
      },
    },
  },
  {
    name: "dossier_read_process",
    description:
      "Read a process packet exported from a process-board ({ schema: 'dossier.process/v1', slug, process: { id: { verdict, notes } } }) and return verdict-grouped work items for an agent to act on.",
    inputSchema: {
      type: "object",
      properties: {
        process: { type: "object", description: "The exported process JSON, or its `process` map." },
        path: { type: "string", description: "Alternatively, a path to a .process.json file." },
      },
    },
  },
  {
    name: "dossier_read_edits",
    description:
      "Read an edits packet exported from code-editor blocks ({ schema: 'dossier.edits/v1', slug, edits: { id: { text, lang, filename, targetPath, dirty } } }) and return edited text grouped by target path.",
    inputSchema: {
      type: "object",
      properties: {
        edits: { type: "object", description: "The exported edits JSON, or its `edits` map." },
        path: { type: "string", description: "Alternatively, a path to a .edits.json file." },
      },
    },
  },
  {
    name: "dossier_read_verdicts",
    description: "Read a verdict packet exported from verdict-gate blocks ({ schema: 'dossier.verdicts/v1', verdicts: { id: { verdict, notes } } }).",
    inputSchema: { type: "object", properties: { verdicts: { type: "object" }, path: { type: "string" } } },
  },
  {
    name: "dossier_read_release",
    description: "Read a release packet exported from release-checklist blocks ({ schema: 'dossier.release/v1', release: { id: { done, notes } } }).",
    inputSchema: { type: "object", properties: { release: { type: "object" }, path: { type: "string" } } },
  },
  {
    name: "dossier_record_run",
    description: "Create or append a verification-run block for command/test evidence. Provide `path` to update a .dossier.json file, otherwise the block is returned.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        model: { type: "object" },
        title: { type: "string" },
        run: { type: "object", description: "{ id, title, command, status, expected, actual, duration, artifacts, notes }" },
      },
      required: ["run"],
    },
  },
  {
    name: "dossier_attach_patchset",
    description: "Create or append a patch-set block. Provide `path` to update a .dossier.json file, otherwise the block is returned.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        model: { type: "object" },
        title: { type: "string" },
        patchSet: { type: "object", description: "A full patch-set block or { patches: [...] }." },
      },
      required: ["patchSet"],
    },
  },
  {
    name: "dossier_closeout_digest",
    description: "Summarize decisions, process verdicts, edits, release gates, runs, and receipts into a closeout digest for handoff.",
    inputSchema: { type: "object", properties: { packets: { type: "object" }, model: { type: "object" }, path: { type: "string" } } },
  },
  {
    name: "dossier_get_schema",
    description: "Return the Dossier JSON Schema so you can author a valid model.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "dossier_get_starter",
    description: "Return a starter Dossier model for a given kind.",
    inputSchema: { type: "object", properties: { kind: { type: "string", enum: STARTERS } } },
  },
];

const text = (obj) => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] });
const fail = (msg) => ({ content: [{ type: "text", text: msg }], isError: true });

function readPacket(args, keys) {
  for (const key of keys) if (args[key]) return args[key];
  if (args.path) return JSON.parse(readFileSync(args.path, "utf8"));
  return null;
}

function loadModel(args) {
  if (args.model) return { model: args.model, path: null };
  if (args.path) return { model: JSON.parse(readFileSync(args.path, "utf8")), path: args.path };
  return { model: null, path: null };
}

function writeModel(path, model) {
  if (path) writeFileSync(path, JSON.stringify(model, null, 2) + "\n");
}

function appendOrCreateBlock(model, type, title, collectionKey, item) {
  model.blocks = Array.isArray(model.blocks) ? model.blocks : [];
  let block = model.blocks.find((b) => b && b.type === type && (!title || b.title === title));
  if (!block) {
    block = { type, title: title || type, [collectionKey]: [] };
    model.blocks.push(block);
  }
  block[collectionKey] = Array.isArray(block[collectionKey]) ? block[collectionKey] : [];
  block[collectionKey].push(item);
  return block;
}

async function handle(name, args) {
  if (name === "dossier_validate") {
    return text(validateModel(args.model || {}));
  }

  if (name === "dossier_render") {
    const model = args.model || {};
    const v = validateModel(model);
    if (!v.ok) return fail("invalid dossier:\n- " + v.errors.join("\n- "));
    const baseDir = args.outPath ? dirname(args.outPath) : undefined;
    const { html, md, digest } = await generate(model, { baseDir });
    if (args.outPath) {
      const slug = (model.meta && model.meta.slug) || basename(args.outPath).replace(/\.(dossier\.)?(json|html)$/i, "");
      const htmlPath = join(dirname(args.outPath), slug + ".html");
      const mdPath = join(dirname(args.outPath), slug + ".md");
      writeFileSync(htmlPath, html);
      writeFileSync(mdPath, md);
      return text({ ok: true, slug, htmlPath, mdPath, bytes: html.length });
    }
    return { content: [{ type: "text", text: `Rendered (${html.length} bytes). Digest:\n\n${digest}` }, { type: "text", text: html }] };
  }

  if (name === "dossier_read_decisions") {
    let packet = readPacket(args, ["decisions"]);
    if (!packet) return fail("provide `decisions` or `path`");
    const map = packet.decisions || packet;
    const selected = [];
    const noted = [];
    for (const [id, d] of Object.entries(map)) {
      if (d && d.selected) selected.push({ id, notes: d.notes || "" });
      else if (d && d.notes) noted.push({ id, notes: d.notes });
    }
    return text({ slug: packet.slug, selected, notedButNotSelected: noted, totals: { selected: selected.length, considered: Object.keys(map).length } });
  }

  if (name === "dossier_read_process") {
    let packet = readPacket(args, ["process"]);
    if (!packet) return fail("provide `process` or `path`");
    const map = packet.process || packet.items || packet;
    const byVerdict = {};
    const noted = [];
    for (const [id, entry] of Object.entries(map)) {
      if (!entry || typeof entry !== "object") continue;
      const verdict = entry.verdict || "undecided";
      const row = { id, verdict, notes: entry.notes || "" };
      if (verdict && verdict !== "undecided") {
        byVerdict[verdict] = byVerdict[verdict] || [];
        byVerdict[verdict].push(row);
      } else if (entry.notes) noted.push(row);
    }
    const totals = Object.fromEntries(Object.entries(byVerdict).map(([k, v]) => [k, v.length]));
    return text({ schema: packet.schema || "dossier.process/v1", slug: packet.slug, byVerdict, notedButUndecided: noted, totals: { ...totals, considered: Object.keys(map).length } });
  }

  if (name === "dossier_read_edits") {
    let packet = readPacket(args, ["edits"]);
    if (!packet) return fail("provide `edits` or `path`");
    const map = packet.edits || packet.items || packet;
    const edits = [];
    const byTargetPath = {};
    for (const [id, entry] of Object.entries(map)) {
      if (!entry || typeof entry !== "object") continue;
      const row = {
        id,
        text: entry.text || "",
        lang: entry.lang || "",
        filename: entry.filename || "",
        targetPath: entry.targetPath || "",
        title: entry.title || "",
        dirty: !!entry.dirty,
      };
      edits.push(row);
      const key = row.targetPath || row.filename || "(untargeted)";
      byTargetPath[key] = byTargetPath[key] || [];
      byTargetPath[key].push(row);
    }
    return text({ schema: packet.schema || "dossier.edits/v1", slug: packet.slug, edits, byTargetPath, totals: { edits: edits.length, dirty: edits.filter((x) => x.dirty).length } });
  }

  if (name === "dossier_read_verdicts") {
    const packet = readPacket(args, ["verdicts"]);
    if (!packet) return fail("provide `verdicts` or `path`");
    const map = packet.verdicts || packet.items || packet;
    const byVerdict = {};
    for (const [id, entry] of Object.entries(map)) {
      if (!entry || typeof entry !== "object") continue;
      const verdict = entry.verdict || "undecided";
      byVerdict[verdict] = byVerdict[verdict] || [];
      byVerdict[verdict].push({ id, verdict, notes: entry.notes || "" });
    }
    return text({ schema: packet.schema || "dossier.verdicts/v1", slug: packet.slug, byVerdict, totals: Object.fromEntries(Object.entries(byVerdict).map(([k, v]) => [k, v.length])) });
  }

  if (name === "dossier_read_release") {
    const packet = readPacket(args, ["release"]);
    if (!packet) return fail("provide `release` or `path`");
    const map = packet.release || packet.gates || packet;
    const gates = Object.entries(map).map(([id, entry]) => ({ id, done: !!(entry && entry.done), notes: (entry && entry.notes) || "" }));
    return text({ schema: packet.schema || "dossier.release/v1", slug: packet.slug, gates, totals: { gates: gates.length, done: gates.filter((g) => g.done).length } });
  }

  if (name === "dossier_record_run") {
    const run = { id: args.run.id || "run-" + Date.now(), title: args.run.title || args.run.command || "Verification run", ...args.run };
    const { model, path } = loadModel(args);
    if (!model) return text({ type: "verification-run", title: args.title || "Verification runs", runs: [run] });
    const block = appendOrCreateBlock(model, "verification-run", args.title || "Verification runs", "runs", run);
    writeModel(path, model);
    return text({ ok: true, path, block });
  }

  if (name === "dossier_attach_patchset") {
    const patchSet = args.patchSet.type === "patch-set" ? args.patchSet : { type: "patch-set", title: args.title || "Patch set", patches: args.patchSet.patches || [] };
    const { model, path } = loadModel(args);
    if (!model) return text(patchSet);
    model.blocks = Array.isArray(model.blocks) ? model.blocks : [];
    model.blocks.push(patchSet);
    writeModel(path, model);
    return text({ ok: true, path, block: patchSet });
  }

  if (name === "dossier_closeout_digest") {
    const model = args.model || (args.path ? JSON.parse(readFileSync(args.path, "utf8")) : null);
    const packets = args.packets || {};
    const digest = {
      title: model && model.meta && model.meta.title,
      slug: (model && model.meta && model.meta.slug) || packets.slug,
      decisions: packets.decisions ? Object.keys(packets.decisions.decisions || packets.decisions).length : 0,
      processItems: packets.process ? Object.keys(packets.process.process || packets.process).length : 0,
      edits: packets.edits ? Object.keys(packets.edits.edits || packets.edits).length : 0,
      verdicts: packets.verdicts ? Object.keys(packets.verdicts.verdicts || packets.verdicts).length : 0,
      releaseGates: packets.release ? Object.keys(packets.release.release || packets.release).length : 0,
      summary: "Closeout packet ready for handoff. Review non-approved verdicts, dirty edits, failed runs, and unresolved release gates before marking durable.",
    };
    return text(digest);
  }

  if (name === "dossier_get_schema") {
    return text(readFileSync(join(root, "schema/dossier.schema.json"), "utf8"));
  }

  if (name === "dossier_get_starter") {
    const kind = STARTERS.includes(args.kind) ? args.kind : "dossier";
    return text(readFileSync(join(root, `src/starters/${kind}.dossier.json`), "utf8"));
  }

  return fail("unknown tool: " + name);
}

export function createServer() {
  const server = new Server({ name: "dossier", version: "0.2.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    try {
      return await handle(req.params.name, req.params.arguments || {});
    } catch (e) {
      return fail(String(e && e.message ? e.message : e));
    }
  });
  return server;
}

export async function main() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  // stderr is safe for logs (stdout is the JSON-RPC channel)
  console.error("dossier mcp server ready (stdio)");
}
