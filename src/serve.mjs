// Dev server: build a dossier, serve it, watch the source, rebuild + live-reload on
// change. The reload script is injected only when serving (never written to the file).
// No dependencies.

import { createServer } from "node:http";
import { watch, readFileSync, writeFileSync } from "node:fs";
import { generateFile, validateModel } from "./index.mjs";
import { LIVE } from "./live-runtime.mjs";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8_000_000) reject(new Error("request body too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function walkBlocks(blocks, fn) {
  (blocks || []).forEach((b) => {
    fn(b);
    if (b.blocks) walkBlocks(b.blocks, fn);
    if (b.left) walkBlocks(b.left, fn);
    if (b.right) walkBlocks(b.right, fn);
    if (b.tabs) b.tabs.forEach((t) => walkBlocks(t.blocks, fn));
    if (b.candidates) b.candidates.forEach((c) => walkBlocks(c.blocks, fn));
    if (b.items) b.items.forEach((it) => walkBlocks(it.blocks, fn));
  });
}

function readSourceModel(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeSourceModel(file, model) {
  writeFileSync(file, JSON.stringify(model, null, 2) + "\n");
}

function assertValidModel(model) {
  const v = validateModel(model);
  if (!v.ok) throw new Error("invalid dossier after update:\n- " + v.errors.join("\n- "));
}

function saveEditorToModel(file, payload) {
  const model = readSourceModel(file);
  let found = false;
  walkBlocks(model.blocks, (b) => {
    if (found || !b || b.type !== "code-editor") return;
    if ((payload.id && b.id === payload.id) || (payload.targetPath && b.targetPath === payload.targetPath) || (payload.filename && b.filename === payload.filename) || (payload.title && b.title === payload.title)) {
      b.code = String(payload.text || "");
      found = true;
    }
  });
  if (!found) throw new Error("matching code-editor block not found");
  assertValidModel(model);
  writeSourceModel(file, model);
}

function appendPatchSet(file, payload) {
  const model = readSourceModel(file);
  model.blocks = Array.isArray(model.blocks) ? model.blocks : [];
  const block = payload.type === "patch-set" ? payload : { type: "patch-set", title: payload.title || "Imported patch set", patches: payload.patches || [] };
  model.blocks.push(block);
  assertValidModel(model);
  writeSourceModel(file, model);
}

function saveModel(file, payload) {
  const model = payload && payload.model;
  if (!model || typeof model !== "object" || Array.isArray(model)) throw new Error("payload.model must be a dossier model object");
  assertValidModel(model);
  writeSourceModel(file, model);
}

function openUrl(url) {
  import("node:child_process").then(({ spawn }) => {
    const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    try {
      spawn(cmd, [url], { stdio: "ignore", detached: true, shell: process.platform === "win32" }).unref();
    } catch {
      /* ignore */
    }
  });
}

export async function serve(file, opts = {}) {
  const port = opts.port === undefined || opts.port === null ? 4321 : Number(opts.port);
  let htmlPath = null;

  async function rebuild() {
    try {
      const r = await generateFile(file);
      htmlPath = r.htmlPath;
      return true;
    } catch (e) {
      console.error("✗ " + String(e.message).replace(/\n/g, "\n  "));
      return false;
    }
  }

  if (!(await rebuild())) {
    process.exitCode = 1;
    return;
  }

  const clients = new Set();
  const server = createServer(async (req, res) => {
    if (req.url === "/__reload") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      res.write("\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    if (req.method === "POST" && req.url === "/__save-editor") {
      try {
        saveEditorToModel(file, await readBody(req));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
      return;
    }
    if (req.method === "POST" && req.url === "/__append-patchset") {
      try {
        appendPatchSet(file, await readBody(req));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
      return;
    }
    if (req.method === "POST" && req.url === "/__save-model") {
      try {
        saveModel(file, await readBody(req));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
      return;
    }
    try {
      const html = readFileSync(htmlPath, "utf8").replace("</body>", LIVE + "</body>");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch {
      res.writeHead(500);
      res.end("build error");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const url = `http://localhost:${actualPort}`;
  if (!opts.quiet) console.log(`serving ${file} at ${url}\n  watching for changes, edit and save to live-reload`);
  if (opts.open) openUrl(url);

  let t;
  const watcher = watch(file, () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      if (await rebuild()) {
        if (!opts.quiet) console.log("↻ rebuilt " + new Date().toLocaleTimeString());
        clients.forEach((c) => {
          try {
            c.write("data: reload\n\n");
          } catch {
            /* ignore */
          }
        });
      }
    }, 80);
  });
  return {
    url,
    server,
    watcher,
    close() {
      clearTimeout(t);
      watcher.close();
      clients.forEach((c) => {
        try {
          c.end();
        } catch {
          /* ignore */
        }
      });
      return new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    },
  };
}
