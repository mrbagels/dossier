// Export a Dossier to other formats: DOCX (Word, mapping the common block types,
// inline markdown flattened to plain text) and PDF (the self-contained HTML printed
// through a headless browser).

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun } from "docx";
import { chartSvg, enrich } from "./generate.mjs";

// Print the already-rendered, self-contained HTML to a PDF buffer via Playwright.
export async function exportPdf(html, opts = {}) {
  const { withBrowser } = await import("./headless.mjs");
  return withBrowser(async (browser) => {
    if (!browser) throw new Error("PDF export needs Playwright. Install it: npm i playwright && npx playwright install chromium");
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "load" });
      await page.emulateMedia({ media: "print" });
      return await page.pdf({
        format: opts.size || "A4",
        printBackground: true,
        margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
      });
    } finally {
      await page.close();
    }
  });
}

const plain = (s) =>
  String(s == null ? "" : s)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[\^[a-z0-9-]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1");

const P = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text: plain(text), ...(opts.run || {}) })], ...(opts.para || {}) });
const H = (text, heading) => new Paragraph({ text: plain(text), heading });

function addTable(out, columns, rows) {
  if (!columns || !columns.length) return;
  const header = new TableRow({ children: columns.map((c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: plain(c), bold: true })] })] })) });
  const body = (rows || []).map((r) => new TableRow({ children: r.map((c) => new TableCell({ children: [P(c)] })) }));
  out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...body] }));
  out.push(new Paragraph({ text: "" }));
}

// ---- images ----------------------------------------------------------------

const MIME_TYPE = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/gif": "gif", "image/bmp": "bmp" };
const EXT_TYPE = { ".png": "png", ".jpg": "jpg", ".jpeg": "jpg", ".gif": "gif", ".bmp": "bmp" };

// Rasterize an SVG string to a PNG buffer via resvg (no browser needed).
async function svgToPng(svg) {
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    const img = new Resvg(String(svg), { fitTo: { mode: "width", value: 900 } }).render();
    return { data: img.asPng(), width: img.width, height: img.height };
  } catch {
    return null;
  }
}

// A paragraph holding one image, scaled to fit the page width (96dpi pixels).
function imageRun(data, type, w, h) {
  const maxW = 540;
  let width = w || maxW;
  let height = h || Math.round(width * 0.6);
  if (width > maxW) {
    height = Math.round(height * (maxW / width));
    width = maxW;
  }
  return new Paragraph({ children: [new ImageRun({ data, type, transformation: { width, height } })] });
}

// Resolve a figure to an image paragraph: data-URI, local file, raster or SVG.
async function figureImage(b, baseDir) {
  let buf = null, type = null, svg = null;
  const src = b._src || b.src || "";
  const m = /^data:(image\/[a-z.+-]+)(;base64)?,(.*)$/i.exec(src);
  if (m) {
    const mime = m[1].toLowerCase(), isB64 = !!m[2], raw = m[3];
    if (/svg/i.test(mime)) {
      try { svg = isB64 ? Buffer.from(raw, "base64").toString("utf8") : decodeURIComponent(raw); } catch { svg = raw; }
    } else if (MIME_TYPE[mime] && isB64) { buf = Buffer.from(raw, "base64"); type = MIME_TYPE[mime]; }
  } else if (src && !/^https?:/i.test(src) && baseDir) {
    try {
      const { readFileSync } = await import("node:fs");
      const { resolve, extname } = await import("node:path");
      const file = resolve(baseDir, src);
      if (/\.svg$/i.test(file)) svg = readFileSync(file, "utf8");
      else if (EXT_TYPE[extname(file).toLowerCase()]) { buf = readFileSync(file); type = EXT_TYPE[extname(file).toLowerCase()]; }
    } catch {
      /* unreadable, no image */
    }
  }
  if (svg) {
    const png = await svgToPng(svg);
    return png ? imageRun(png.data, "png", png.width, png.height) : null;
  }
  if (buf && type) {
    let dim = null;
    try { const { imageSize } = await import("image-size"); dim = imageSize(buf); } catch { /* dims unknown */ }
    return imageRun(buf, type, dim && dim.width, dim && dim.height);
  }
  return null; // unsupported (e.g. webp/avif) or remote URL
}

// Chart SVG uses CSS variables for color; bind them to concrete values for raster.
function chartPngSvg(b, accent) {
  return chartSvg(b).replace(/var\(--ds-accent\)/g, accent).replace(/var\(--ds-line-2\)/g, "#dcd9e4");
}

async function block(b, out, ctx) {
  switch (b.type) {
    case "hero":
      out.push(H(b.title, HeadingLevel.TITLE));
      if (b.lede) out.push(P(b.lede));
      break;
    case "section":
      out.push(H(b.title, HeadingLevel.HEADING_1));
      if (b.subtitle) out.push(P(b.subtitle, { run: { italics: true, color: "666666" } }));
      for (const c of b.blocks || []) await block(c, out, ctx);
      break;
    case "prose":
      if (b.heading) out.push(H(b.heading, HeadingLevel.HEADING_2));
      String(b.markdown || "").split(/\n{2,}/).forEach((p) => out.push(P(p)));
      break;
    case "callout":
      out.push(new Paragraph({ children: [...(b.title ? [new TextRun({ text: plain(b.title) + " ", bold: true })] : []), new TextRun({ text: plain(b.body) })], indent: { left: 360 } }));
      break;
    case "code":
      String(b.code || "").split("\n").forEach((line) => out.push(new Paragraph({ children: [new TextRun({ text: line || " ", font: "Consolas", size: 18 })] })));
      out.push(new Paragraph({ text: "" }));
      break;
    case "table":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      addTable(out, b.columns, b.rows);
      break;
    case "references":
      addTable(out, ["Source", "Signal", "Use"], (b.items || []).map((r) => [r.label, r.signal || "", r.use || ""]));
      break;
    case "decision-matrix":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      addTable(out, ["Option", ...(b.criteria || [])], (b.options || []).map((o) => [o.name, ...(b.criteria || []).map((_, i) => (o.scores || [])[i] || "")]));
      break;
    case "risk-register":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      addTable(out, ["Risk", "Likelihood", "Impact", "Mitigation"], (b.risks || []).map((r) => [r.risk, r.likelihood || "", r.impact || "", r.mitigation || ""]));
      break;
    case "summary-cards":
      (b.cards || []).forEach((c) => { out.push(H(c.title, HeadingLevel.HEADING_3)); out.push(P(c.body)); });
      break;
    case "stat-strip":
      out.push(P((b.stats || []).map((s) => plain(s.value) + " " + plain(s.label)).join("   ")));
      break;
    case "flow":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      (b.steps || []).forEach((s, i) => out.push(P((i + 1) + ". " + plain(s.title) + ": " + plain(s.body))));
      break;
    case "timeline":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      (b.phases || []).forEach((p) => out.push(new Paragraph({ text: plain(p.label) + (p.status ? " (" + p.status + ")" : "") + ": " + plain(p.body), bullet: { level: 0 } })));
      break;
    case "action-items":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      (b.items || []).forEach((it) => out.push(new Paragraph({ text: (it.status === "done" ? "[x] " : "[ ] ") + plain(it.title) + (it.owner ? " (@" + it.owner + ")" : ""), bullet: { level: 0 } })));
      break;
    case "assumptions":
      out.push(H(b.title || "Assumptions and open questions", HeadingLevel.HEADING_3));
      (b.items || []).forEach((it) => out.push(new Paragraph({ text: plain(it.statement) + " (" + (it.kind || "assumption") + "/" + (it.status || "unverified") + ")", bullet: { level: 0 } })));
      break;
    case "glossary":
      out.push(H(b.title || "Glossary", HeadingLevel.HEADING_3));
      (b.terms || []).forEach((t) => out.push(new Paragraph({ children: [new TextRun({ text: plain(t.term) + ": ", bold: true }), new TextRun({ text: plain(t.definition) })] })));
      break;
    case "faq":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      (b.items || []).forEach((it) => { out.push(new Paragraph({ children: [new TextRun({ text: plain(it.q), bold: true })] })); out.push(P(it.a)); });
      break;
    case "two-col":
      for (const c of [...(b.left || []), ...(b.right || [])]) await block(c, out, ctx);
      break;
    case "tabs":
      for (const t of b.tabs || []) {
        out.push(H(t.label, HeadingLevel.HEADING_3));
        for (const c of t.blocks || []) await block(c, out, ctx);
      }
      break;
    case "review-board":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_2));
      for (const c of b.candidates || []) {
        out.push(H(plain(c.title) + (c.status ? " (" + c.status + ")" : ""), HeadingLevel.HEADING_3));
        if (c.summary) out.push(P(c.summary));
        if (c.body) String(c.body).split(/\n{2,}/).forEach((p) => out.push(P(p)));
        for (const x of c.blocks || []) await block(x, out, ctx);
        Object.entries(c.details || {}).forEach(([k, v]) => out.push(P(k + ": " + plain(v))));
      }
      break;
    case "process-board":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_2));
      for (const it of b.items || []) {
        out.push(H(plain(it.title) + (it.status ? " (" + it.status + ")" : ""), HeadingLevel.HEADING_3));
        if (it.summary) out.push(P(it.summary));
        if (it.owner) out.push(P("Owner: " + plain(it.owner)));
        if (it.priority) out.push(P("Priority: " + plain(it.priority)));
        if (it.verdict) out.push(P("Verdict: " + plain(it.verdict)));
        if (it.files && it.files.length) out.push(P("Files: " + it.files.map(plain).join(", ")));
        if (it.dependencies && it.dependencies.length) out.push(P("Depends on: " + it.dependencies.map(plain).join(", ")));
        if (it.verification && it.verification.length) out.push(P("Verification: " + it.verification.map(plain).join(", ")));
        if (it.body) String(it.body).split(/\n{2,}/).forEach((p) => out.push(P(p)));
        for (const x of it.blocks || []) await block(x, out, ctx);
        Object.entries(it.details || {}).forEach(([k, v]) => out.push(P(k + ": " + plain(v))));
      }
      break;
    case "footnotes":
      out.push(H(b.title || "Notes", HeadingLevel.HEADING_3));
      (b.items || []).forEach((it, i) => out.push(P((i + 1) + ". " + plain(it.text))));
      break;
    case "receipt":
      out.push(H(b.title || "Generation receipt", HeadingLevel.HEADING_3));
      ["generatedBy", "model", "date", "confidence"].forEach((k) => { if (b[k]) out.push(P(k + ": " + b[k])); });
      if (b.tools && b.tools.length) out.push(P("tools: " + b.tools.join(", ")));
      if (b.notes) out.push(P(b.notes));
      break;
    case "figure": {
      const im = await figureImage(b, ctx.baseDir);
      if (im) out.push(im);
      if (b.caption) out.push(P(b.caption, { run: { italics: true, color: "666666" } }));
      break;
    }
    case "chart": {
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      const png = await svgToPng(chartPngSvg(b, ctx.accent));
      if (png) out.push(imageRun(png.data, "png", png.width, png.height));
      break;
    }
    case "diagram": {
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_3));
      const png = b._svg ? await svgToPng(b._svg) : null;
      if (png) out.push(imageRun(png.data, "png", png.width, png.height));
      else out.push(P("[" + (b.format || "dot") + " diagram]"));
      break;
    }
    case "math":
      if (b.tex) out.push(new Paragraph({ children: [new TextRun({ text: String(b.tex), font: "Consolas", italics: true })] }));
      break;
    default:
      break; // unknown / plugin blocks: nothing to emit
  }
}

export async function exportDocx(model, opts = {}) {
  await enrich(model, opts.baseDir); // populates figure _src and diagram _svg
  const ctx = { baseDir: opts.baseDir, accent: (model.meta && model.meta.theme && model.meta.theme.accent) || "#c81e4a" };
  const out = [];
  for (const b of model.blocks || []) await block(b, out, ctx);
  if (!out.length) out.push(new Paragraph({ text: (model.meta && model.meta.title) || "" }));
  const doc = new Document({ sections: [{ children: out }] });
  return Packer.toBuffer(doc);
}
