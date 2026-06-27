// Export a Dossier model to other formats. Currently DOCX (Word), mapping the common
// block types. Inline markdown is flattened to plain text.

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";

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

function block(b, out) {
  switch (b.type) {
    case "hero":
      out.push(H(b.title, HeadingLevel.TITLE));
      if (b.lede) out.push(P(b.lede));
      break;
    case "section":
      out.push(H(b.title, HeadingLevel.HEADING_1));
      if (b.subtitle) out.push(P(b.subtitle, { run: { italics: true, color: "666666" } }));
      (b.blocks || []).forEach((c) => block(c, out));
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
      [...(b.left || []), ...(b.right || [])].forEach((c) => block(c, out));
      break;
    case "tabs":
      (b.tabs || []).forEach((t) => { out.push(H(t.label, HeadingLevel.HEADING_3)); (t.blocks || []).forEach((c) => block(c, out)); });
      break;
    case "review-board":
      if (b.title) out.push(H(b.title, HeadingLevel.HEADING_2));
      (b.candidates || []).forEach((c) => {
        out.push(H(plain(c.title) + (c.status ? " (" + c.status + ")" : ""), HeadingLevel.HEADING_3));
        if (c.summary) out.push(P(c.summary));
        if (c.body) String(c.body).split(/\n{2,}/).forEach((p) => out.push(P(p)));
        (c.blocks || []).forEach((x) => block(x, out));
        Object.entries(c.details || {}).forEach(([k, v]) => out.push(P(k + ": " + plain(v))));
      });
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
    default:
      break; // figure / math / chart / diagram: visual blocks skipped in DOCX
  }
}

export async function exportDocx(model) {
  const out = [];
  (model.blocks || []).forEach((b) => block(b, out));
  if (!out.length) out.push(new Paragraph({ text: (model.meta && model.meta.title) || "" }));
  const doc = new Document({ sections: [{ children: out }] });
  return Packer.toBuffer(doc);
}
