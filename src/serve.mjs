// Dev server: build a dossier, serve it, watch the source, rebuild + live-reload on
// change. The reload script is injected only when serving (never written to the file).
// No dependencies.

import { createServer } from "node:http";
import { watch, readFileSync, writeFileSync } from "node:fs";
import { generateFile, validateModel } from "./index.mjs";

const LIVE = `<script>
try{new EventSource('/__reload').onmessage=function(){location.reload()}}catch(e){}
(function(){
  function post(url,payload){return fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(function(r){if(!r.ok)throw new Error("request failed");return r.json();});}
  function toast(msg){var t=document.querySelector("[data-toast]");if(!t)return; t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show")},1800);}
  document.querySelectorAll("[data-code-editor]").forEach(function(ta){
    var actions=ta.closest("[data-editor-shell]")&&ta.closest("[data-editor-shell]").querySelector(".ds-codeedit-actions");
    if(!actions||actions.querySelector("[data-live-save]"))return;
    var b=document.createElement("button");b.className="ds-btn ds-btn-line";b.type="button";b.textContent="Save to dossier";b.setAttribute("data-live-save","");
    b.addEventListener("click",function(){post("/__save-editor",{id:ta.getAttribute("data-code-editor"),text:ta.value,targetPath:ta.getAttribute("data-editor-target"),filename:ta.getAttribute("data-editor-filename"),title:ta.getAttribute("data-editor-title")}).then(function(){toast("Saved to dossier JSON")}).catch(function(){toast("Save failed")});});
    actions.appendChild(b);
  });
  var tools=document.querySelector(".ds-tools");
  if(tools&&!tools.querySelector("[data-live-patch-import]")){
    var p=document.createElement("button");p.className="ds-btn";p.type="button";p.textContent="Import patch";p.setAttribute("data-live-patch-import","");
    p.addEventListener("click",function(){var input=document.createElement("input");input.type="file";input.accept=".json,.diff,.patch,text/plain,application/json";input.onchange=function(){var f=input.files[0];if(!f)return;var r=new FileReader();r.onload=function(){var text=String(r.result||""),payload;try{payload=JSON.parse(text)}catch(e){payload={type:"patch-set",title:"Imported patch",patches:[{id:"imported-patch",title:f.name||"Imported patch",operation:"mixed",status:"proposed",risk:"medium",diff:text}]}}post("/__append-patchset",payload).then(function(){toast("Patch set imported")}).catch(function(){toast("Patch import failed")});};r.readAsText(f);};input.click();});
    tools.appendChild(p);
  }
})();
</script>`;

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
