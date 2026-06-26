// Dev server: build a dossier, serve it, watch the source, rebuild + live-reload on
// change. The reload script is injected only when serving (never written to the file).
// No dependencies.

import { createServer } from "node:http";
import { watch, readFileSync } from "node:fs";
import { generateFile } from "./index.mjs";

const RELOAD = "<script>try{new EventSource('/__reload').onmessage=function(){location.reload()}}catch(e){}</script>";

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
  const port = Number(opts.port) || 4321;
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
  const server = createServer((req, res) => {
    if (req.url === "/__reload") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      res.write("\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    try {
      const html = readFileSync(htmlPath, "utf8").replace("</body>", RELOAD + "</body>");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch {
      res.writeHead(500);
      res.end("build error");
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`serving ${file} at ${url}\n  watching for changes — edit and save to live-reload`);
    if (opts.open) openUrl(url);
  });

  let t;
  watch(file, () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      if (await rebuild()) {
        console.log("↻ rebuilt " + new Date().toLocaleTimeString());
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
}
