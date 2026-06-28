// Dossier MCP server, lets any MCP-capable agent author, validate, render, and read
// decisions from dossiers. Run via `dossier mcp` (stdio transport).

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
    let packet = args.decisions;
    if (!packet && args.path) packet = JSON.parse(readFileSync(args.path, "utf8"));
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
    let packet = args.process;
    if (!packet && args.path) packet = JSON.parse(readFileSync(args.path, "utf8"));
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
    let packet = args.edits;
    if (!packet && args.path) packet = JSON.parse(readFileSync(args.path, "utf8"));
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
        dirty: !!entry.dirty,
      };
      edits.push(row);
      const key = row.targetPath || row.filename || "(untargeted)";
      byTargetPath[key] = byTargetPath[key] || [];
      byTargetPath[key].push(row);
    }
    return text({ schema: packet.schema || "dossier.edits/v1", slug: packet.slug, edits, byTargetPath, totals: { edits: edits.length, dirty: edits.filter((x) => x.dirty).length } });
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
