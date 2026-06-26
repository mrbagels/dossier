// Dossier generator: JSON document model -> self-contained HTML (+ Markdown).
// Zero dependencies. The visible HTML is a projection of the embedded #dossier-model island.

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "section";

// Minimal inline Markdown: **bold**, `code`, [text](url), [[slug]] cross-links,
// and [[Term]] glossary tooltips (resolved against the collected glossary map).
function inlineMd(s, ctx) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
    const key = ref.trim().toLowerCase();
    if (ctx.glossary && ctx.glossary.has(key)) {
      return `<span class="ds-term" tabindex="0" title="${esc(ctx.glossary.get(key))}">${esc(ref)}</span>`;
    }
    const slug = slugify(ref);
    const href = ctx.baseUrl ? ctx.baseUrl.replace(/\/$/, "") + "/" + slug + ".html" : slug + ".html";
    return `<a class="ds-xlink" data-slug="${esc(slug)}" href="${esc(href)}">${esc(ref)}</a>`;
  });
  return t;
}

const wrap = (type, id, inner, extra = "") =>
  `<section class="ds-block" data-block="${esc(type)}" data-id="${esc(id)}"${extra}>` +
  `<button class="ds-copy" type="button" data-copy aria-label="Copy block">Copy</button>${inner}</section>`;

// ---- block renderers -------------------------------------------------------

const renderers = {
  hero(b, ctx) {
    const pills = (b.pills || []).map((p) => `<span class="ds-pill">${esc(p)}</span>`).join("");
    const meta = (b.sideCards || [])
      .map((c) => `<div class="ds-meta-item"><span class="ds-label">${esc(c.label)}</span><span class="ds-val">${esc(c.value)}</span></div>`)
      .join("");
    return (
      `<section class="ds-hero ds-block" data-block="hero" data-id="${esc(b.id)}">` +
      (b.eyebrow ? `<p class="ds-eyebrow">${esc(b.eyebrow)}</p>` : "") +
      `<h1 id="${esc(b.id)}">${esc(b.title)}</h1>` +
      (b.lede ? `<p class="ds-lede">${inlineMd(b.lede, ctx)}</p>` : "") +
      (pills ? `<div class="ds-pillrow">${pills}</div>` : "") +
      (meta ? `<div class="ds-meta">${meta}</div>` : "") +
      `</section>`
    );
  },
  prose(b, ctx) {
    const h = b.heading ? `<h2 id="${esc(b.id)}">${esc(b.heading)}</h2>` : "";
    const paras = String(b.markdown).split(/\n{2,}/).map((p) => `<p>${inlineMd(p, ctx)}</p>`).join("");
    return wrap("prose", b.id, h + paras);
  },
  section(b, ctx) {
    const titles =
      `<div class="ds-section-titles"><h2 id="${esc(b.id)}">${esc(b.title)}</h2>` +
      (b.subtitle ? `<p class="ds-muted">${inlineMd(b.subtitle, ctx)}</p>` : "") +
      `</div>`;
    const inner =
      `<div class="ds-section-head">${titles}` +
      `<button class="ds-toggle" type="button" data-toggle aria-label="Collapse section">–</button></div>` +
      `<div class="ds-section-body">${(b.blocks || []).map((c) => renderBlock(c, ctx)).join("")}</div>`;
    const cls = b.framed === false ? "ds-section unframed" : "ds-section";
    return `<section class="${cls} ds-block" data-block="section" data-id="${esc(b.id)}"${b.collapsed ? ' data-collapsed="1"' : ""}>${inner}</section>`;
  },
  "two-col"(b, ctx) {
    const col = (arr) => (arr || []).map((c) => renderBlock(c, ctx)).join("");
    return wrap("two-col", b.id, `<div class="ds-twocol"><div>${col(b.left)}</div><div>${col(b.right)}</div></div>`);
  },
  "summary-cards"(b, ctx) {
    const cards = (b.cards || [])
      .map(
        (c) =>
          `<article class="ds-card ${c.tone ? "tone-" + esc(c.tone) : ""}"><h3>${esc(c.title)}</h3>` +
          `<p>${inlineMd(c.body, ctx)}</p></article>`
      )
      .join("");
    return wrap("summary-cards", b.id, `<div class="ds-cardgrid">${cards}</div>`);
  },
  "stat-strip"(b) {
    const stats = (b.stats || [])
      .map((s) => `<div class="ds-stat"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`)
      .join("");
    return wrap("stat-strip", b.id, `<div class="ds-statgrid">${stats}</div>`);
  },
  flow(b, ctx) {
    const steps = (b.steps || [])
      .map((s) => `<div class="ds-flowstep"><div class="ds-flowstep-body"><strong>${esc(s.title)}</strong><span>${inlineMd(s.body, ctx)}</span></div></div>`)
      .join("");
    return wrap("flow", b.id, (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "") + `<div class="ds-flow">${steps}</div>`);
  },
  timeline(b, ctx) {
    const ph = (b.phases || [])
      .map(
        (p) =>
          `<div class="ds-phase"><div class="ds-phase-id">${esc(p.label)}${p.status ? `<span class="ds-status s-${esc(p.status)}">${esc(p.status)}</span>` : ""}${p.date ? `<span class="ds-date">${esc(p.date)}</span>` : ""}</div>` +
          `<div>${inlineMd(p.body, ctx)}</div></div>`
      )
      .join("");
    return wrap("timeline", b.id, (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "") + `<div class="ds-timeline">${ph}</div>`);
  },
  table(b, ctx) {
    const head = `<tr>${(b.columns || []).map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
    const body = (b.rows || []).map((r) => `<tr>${r.map((c) => `<td>${inlineMd(c, ctx)}</td>`).join("")}</tr>`).join("");
    return wrap("table", b.id, (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "") + `<div class="ds-tablewrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`);
  },
  callout(b, ctx) {
    return wrap(
      "callout",
      b.id,
      `<div class="ds-callout tone-${esc(b.tone || "info")}">${b.title ? `<strong>${esc(b.title)}</strong> ` : ""}${inlineMd(b.body, ctx)}</div>`
    );
  },
  code(b) {
    const label = b.filename || b.lang || "code";
    const body = b._hl || `<pre><code>${esc(b.code)}</code></pre>`;
    return wrap(
      "code",
      b.id,
      `<div class="ds-code"><div class="ds-code-bar"><span class="ds-lang">${esc(label)}</span>` +
        `<button class="ds-code-copy" type="button" data-code-copy>Copy</button></div>${body}</div>`
    );
  },
  tabs(b, ctx) {
    const tabs = b.tabs || [];
    const heads = tabs
      .map((t, i) => `<button class="ds-tab${i === 0 ? " active" : ""}" type="button" data-tab="${i}">${esc(t.label)}</button>`)
      .join("");
    const panes = tabs
      .map((t, i) => `<div class="ds-pane${i === 0 ? " active" : ""}" data-pane="${i}">${(t.blocks || []).map((c) => renderBlock(c, ctx)).join("")}</div>`)
      .join("");
    return wrap("tabs", b.id, `<div class="ds-tabs"><div class="ds-tabbar">${heads}</div>${panes}</div>`);
  },
  faq(b, ctx) {
    const items = (b.items || [])
      .map((it) => `<details class="ds-faq"><summary>${esc(it.q)}</summary><p>${inlineMd(it.a, ctx)}</p></details>`)
      .join("");
    return wrap("faq", b.id, (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "") + items);
  },
  references(b, ctx) {
    const rows = (b.items || [])
      .map(
        (r) =>
          `<tr><td>${r.url ? `<a href="${esc(r.url)}">${esc(r.label)}</a>` : esc(r.label)}</td>` +
          `<td>${r.signal ? inlineMd(r.signal, ctx) : ""}</td><td>${r.use ? inlineMd(r.use, ctx) : ""}</td></tr>`
      )
      .join("");
    return wrap(
      "references",
      b.id,
      (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "") +
        `<div class="ds-tablewrap"><table><thead><tr><th>Source</th><th>Signal</th><th>Use</th></tr></thead><tbody>${rows}</tbody></table></div>`
    );
  },
  "decision-matrix"(b, ctx) {
    const head = `<tr><th>Option</th>${(b.criteria || []).map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
    const body = (b.options || [])
      .map(
        (o) =>
          `<tr class="${o.recommended ? "ds-rec" : ""}"><td><strong>${esc(o.name)}</strong>${o.recommended ? ' <span class="ds-pill">recommended</span>' : ""}</td>` +
          (o.scores || []).map((s) => `<td>${inlineMd(s, ctx)}</td>`).join("") +
          `</tr>`
      )
      .join("");
    return wrap("decision-matrix", b.id, (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "") + `<div class="ds-tablewrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`);
  },
  "risk-register"(b, ctx) {
    const rows = (b.risks || [])
      .map(
        (r) =>
          `<tr><td>${inlineMd(r.risk, ctx)}</td><td><span class="ds-lvl l-${esc(r.likelihood || "")}">${esc(r.likelihood || "")}</span></td>` +
          `<td><span class="ds-lvl l-${esc(r.impact || "")}">${esc(r.impact || "")}</span></td><td>${r.mitigation ? inlineMd(r.mitigation, ctx) : ""}</td></tr>`
      )
      .join("");
    return wrap(
      "risk-register",
      b.id,
      (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "") +
        `<div class="ds-tablewrap"><table><thead><tr><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th></tr></thead><tbody>${rows}</tbody></table></div>`
    );
  },
  "action-items"(b, ctx) {
    const items = (b.items || [])
      .map(
        (it, i) =>
          `<li class="ds-action" data-action="${esc(b.id)}:${i}"><label><input type="checkbox" data-action-check ${it.status === "done" ? "checked" : ""}>` +
          `<span class="ds-action-title">${inlineMd(it.title, ctx)}</span></label>` +
          `<span class="ds-action-meta">${it.owner ? `<span class="ds-owner">${esc(it.owner)}</span>` : ""}<span class="ds-status s-${esc(it.status || "todo")}">${esc(it.status || "todo")}</span></span></li>`
      )
      .join("");
    return wrap("action-items", b.id, (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "") + `<ul class="ds-actions">${items}</ul>`);
  },
  assumptions(b, ctx) {
    const items = (b.items || [])
      .map(
        (it) =>
          `<li class="ds-assumption a-${esc(it.status || "unverified")}"><span class="ds-akind">${esc(it.kind || "assumption")}</span>` +
          `<span>${inlineMd(it.statement, ctx)}</span><span class="ds-astatus">${esc(it.status || "unverified")}</span></li>`
      )
      .join("");
    return wrap("assumptions", b.id, (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : `<h3 id="${esc(b.id)}">Assumptions &amp; open questions</h3>`) + `<ul class="ds-assumptions">${items}</ul>`);
  },
  glossary(b, ctx) {
    const items = (b.terms || [])
      .map((t) => `<div class="ds-gterm" id="term-${slugify(t.term)}"><dt>${esc(t.term)}</dt><dd>${inlineMd(t.definition, ctx)}</dd></div>`)
      .join("");
    return wrap("glossary", b.id, (b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : `<h3 id="${esc(b.id)}">Glossary</h3>`) + `<dl class="ds-glossary">${items}</dl>`);
  },
  diagram(b) {
    const head = b.title ? `<h3 id="${esc(b.id)}">${esc(b.title)}</h3>` : "";
    if (b._svg) {
      return wrap("diagram", b.id, head + `<div class="ds-diagram ds-diagram-svg">${b._svg}</div>`);
    }
    // Fallback: render the source (e.g. mermaid, which needs a headless browser to rasterize).
    return wrap(
      "diagram",
      b.id,
      head +
        `<div class="ds-diagram"><div class="ds-code-bar"><span>diagram · ${esc(b.format || "dot")}</span></div><pre><code>${esc(b.spec)}</code></pre></div>`
    );
  },
  "review-board"(b, ctx) {
    const items = (b.candidates || [])
      .map((c) => {
        const chips = [];
        if (c.category) chips.push(`<span class="ds-chip">${esc(c.category)}</span>`);
        if (c.impact) chips.push(`<span class="ds-chip">Impact · ${esc(c.impact)}</span>`);
        if (c.effort) chips.push(`<span class="ds-chip">Effort · ${esc(c.effort)}</span>`);
        (c.badges || []).forEach((x) => chips.push(`<span class="ds-chip">${esc(x)}</span>`));
        const chipsHtml = chips.length ? `<div class="ds-chips">${chips.join("")}</div>` : "";
        const details = Object.entries(c.details || {})
          .map(([k, v]) => `<div class="ds-detail"><dt>${esc(k)}</dt><dd>${inlineMd(v, ctx)}</dd></div>`)
          .join("");
        const bodyMd = c.body
          ? String(c.body).split(/\n{2,}/).map((p) => `<p>${inlineMd(p, ctx)}</p>`).join("")
          : "";
        const bodyBlocks = (c.blocks || []).map((x) => renderBlock(x, ctx)).join("");
        const refInner = bodyMd + bodyBlocks + (details ? `<dl class="ds-detailgrid">${details}</dl>` : "");
        const ref = refInner ? `<div class="ds-ref">${refInner}</div>` : "";
        const statusChip = c.status ? `<span class="ds-status s-${esc(slugify(c.status))}">${esc(c.status)}</span>` : "";
        const searchText = esc([c.title, c.summary, c.category, c.body].filter(Boolean).join(" ").toLowerCase());
        return (
          `<article class="ds-ritem" data-candidate="${esc(c.id)}"${c.scope ? ` data-scope="${esc(c.scope)}"` : ""} data-text="${searchText}">` +
          `<div class="ds-ritem-head" data-rtoggle>` +
          `<span class="ds-ritem-check" data-stop><input type="checkbox" data-select="${esc(c.id)}" aria-label="Select ${esc(c.title)}"></span>` +
          `<div class="ds-ritem-titles"><h4>${esc(c.title)}</h4><p class="ds-muted">${inlineMd(c.summary, ctx)}</p>${chipsHtml}</div>` +
          `<div class="ds-ritem-aside">${statusChip}<span class="ds-chev" aria-hidden="true">▾</span></div>` +
          `</div>` +
          `<div class="ds-ritem-wrap"><div class="ds-ritem-body">${ref}` +
          `<label class="ds-notes"><span>Notes</span><textarea data-notes="${esc(c.id)}" placeholder="Decision notes, priority, constraints"></textarea></label>` +
          `</div></div></article>`
        );
      })
      .join("");
    return (
      `<section class="ds-block ds-reviewboard" data-block="review-board" data-id="${esc(b.id)}">` +
      (b.title ? `<h2 id="${esc(b.id)}">${esc(b.title)}</h2>` : "") +
      `<div class="ds-review-bar">` +
      `<input class="ds-review-search" type="search" placeholder="Filter…" data-review-search aria-label="Filter items">` +
      `<label class="ds-review-only"><input type="checkbox" data-review-only> Selected only</label>` +
      `<button class="ds-btn ds-btn-line" type="button" data-review-expand>Expand all</button>` +
      `<span class="ds-review-count" data-review-count>0 selected</span>` +
      `<button class="ds-btn ds-btn-line" type="button" data-export-decisions>Export JSON</button>` +
      `<button class="ds-btn ds-btn-line" type="button" data-import-decisions>Import</button>` +
      `</div>` +
      `<div class="ds-rlist">${items}</div></section>`
    );
  },
};

function renderBlock(b, ctx) {
  if (!b || !b.type) return "";
  if (!b.id) b.id = slugify(b.title || b.heading || b.type) + "-" + (ctx.seq++).toString(36);
  const fn = renderers[b.type];
  if (fn) return fn(b, ctx);
  return wrap(b.type, b.id, `<div class="ds-callout tone-warn">Unsupported block type: <code>${esc(b.type)}</code></div>`);
}

// ---- Markdown export -------------------------------------------------------

function blockMd(b) {
  const lines = [];
  const t = b.type;
  if (t === "hero") {
    lines.push(`# ${b.title}`, "", b.lede || "");
  } else if (t === "section") {
    lines.push(`## ${b.title}`, "");
    if (b.subtitle) lines.push(b.subtitle, "");
    (b.blocks || []).forEach((c) => lines.push(blockMd(c)));
  } else if (t === "prose") {
    if (b.heading) lines.push(`## ${b.heading}`, "");
    lines.push(b.markdown);
  } else if (t === "two-col") {
    [...(b.left || []), ...(b.right || [])].forEach((c) => lines.push(blockMd(c)));
  } else if (t === "summary-cards") {
    (b.cards || []).forEach((c) => lines.push(`### ${c.title}`, "", c.body, ""));
  } else if (t === "stat-strip") {
    lines.push((b.stats || []).map((s) => `**${s.value}** ${s.label}`).join(" · "));
  } else if (t === "flow") {
    if (b.title) lines.push(`### ${b.title}`, "");
    (b.steps || []).forEach((s, i) => lines.push(`${i + 1}. **${s.title}** — ${s.body}`));
  } else if (t === "timeline") {
    if (b.title) lines.push(`### ${b.title}`, "");
    (b.phases || []).forEach((p) => lines.push(`- **${p.label}** ${p.status ? `(${p.status})` : ""} — ${p.body}`));
  } else if (t === "table" || t === "references" || t === "decision-matrix" || t === "risk-register") {
    let cols, rows;
    if (t === "table") { cols = b.columns; rows = b.rows; }
    else if (t === "references") { cols = ["Source", "Signal", "Use"]; rows = (b.items || []).map((r) => [r.label, r.signal || "", r.use || ""]); }
    else if (t === "decision-matrix") { cols = ["Option", ...(b.criteria || [])]; rows = (b.options || []).map((o) => [o.name, ...(o.scores || [])]); }
    else { cols = ["Risk", "Likelihood", "Impact", "Mitigation"]; rows = (b.risks || []).map((r) => [r.risk, r.likelihood || "", r.impact || "", r.mitigation || ""]); }
    if (b.title) lines.push(`### ${b.title}`, "");
    lines.push(`| ${cols.join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`);
    rows.forEach((r) => lines.push(`| ${r.join(" | ")} |`));
  } else if (t === "callout") {
    lines.push(`> ${b.title ? "**" + b.title + "** " : ""}${b.body}`);
  } else if (t === "code") {
    lines.push("```" + (b.lang || ""), b.code, "```");
  } else if (t === "tabs") {
    (b.tabs || []).forEach((tab) => { lines.push(`### ${tab.label}`, ""); (tab.blocks || []).forEach((c) => lines.push(blockMd(c))); });
  } else if (t === "faq") {
    if (b.title) lines.push(`### ${b.title}`, "");
    (b.items || []).forEach((it) => lines.push(`**${it.q}**`, "", it.a, ""));
  } else if (t === "action-items") {
    if (b.title) lines.push(`### ${b.title}`, "");
    (b.items || []).forEach((it) => lines.push(`- [${it.status === "done" ? "x" : " "}] ${it.title}${it.owner ? ` (@${it.owner})` : ""}`));
  } else if (t === "assumptions") {
    lines.push(`### ${b.title || "Assumptions & open questions"}`, "");
    (b.items || []).forEach((it) => lines.push(`- (${it.kind || "assumption"}/${it.status || "unverified"}) ${it.statement}`));
  } else if (t === "glossary") {
    lines.push(`### ${b.title || "Glossary"}`, "");
    (b.terms || []).forEach((tt) => lines.push(`- **${tt.term}**: ${tt.definition}`));
  } else if (t === "diagram") {
    if (b.title) lines.push(`### ${b.title}`, "");
    lines.push("```" + (b.format || "mermaid"), b.spec, "```");
  } else if (t === "review-board") {
    if (b.title) lines.push(`## ${b.title}`, "");
    (b.candidates || []).forEach((c) => {
      lines.push(`### ${c.title}${c.status ? ` (${c.status})` : ""}`, "");
      if (c.summary) lines.push(c.summary, "");
      if (c.body) lines.push(c.body, "");
      (c.blocks || []).forEach((x) => lines.push(blockMd(x)));
      Object.entries(c.details || {}).forEach(([k, v]) => lines.push(`- **${k}:** ${v}`));
      lines.push("");
    });
  }
  lines.push("");
  return lines.join("\n");
}

function toMarkdown(model) {
  const m = model.meta || {};
  const fm = ["---", `title: ${m.title || ""}`, m.slug ? `slug: ${m.slug}` : "", m.status ? `status: ${m.status}` : "", m.updated ? `updated: ${m.updated}` : "", "---", ""].filter(Boolean);
  return fm.join("\n") + "\n" + (model.blocks || []).map(blockMd).join("\n");
}

function agentDigest(model) {
  const m = model.meta || {};
  const out = [`# ${m.title || "Brief"} [${m.status || "draft"}]`];
  const walk = (blocks) =>
    (blocks || []).forEach((b) => {
      if (b.type === "hero" && b.lede) out.push(`SUMMARY: ${b.lede}`);
      else if (b.type === "section") { out.push(`## ${b.title}`); walk(b.blocks); }
      else if (b.title || b.heading) out.push(`- ${b.type}: ${b.title || b.heading}`);
      else out.push(`- ${b.type}`);
    });
  walk(model.blocks);
  return out.join("\n");
}

// ---- glossary collection ---------------------------------------------------

function collectGlossary(blocks, map) {
  (blocks || []).forEach((b) => {
    if (b.type === "glossary") (b.terms || []).forEach((t) => map.set(t.term.toLowerCase(), t.definition));
    if (b.blocks) collectGlossary(b.blocks, map);
    if (b.left) collectGlossary(b.left, map);
    if (b.right) collectGlossary(b.right, map);
    if (b.tabs) b.tabs.forEach((t) => collectGlossary(t.blocks, map));
  });
}

function buildToc(blocks) {
  const toc = [];
  (blocks || []).forEach((b) => {
    if (b.type === "hero") toc.push({ id: b.id, label: b.title, level: 1 });
    else if (b.type === "section") toc.push({ id: b.id, label: b.title, level: 2 });
    else if (b.type === "review-board" && b.title) toc.push({ id: b.id, label: b.title, level: 2 });
  });
  return toc;
}

import { CSS } from "./theme/tokens.css.mjs";
import { RUNTIME } from "./runtime/runtime.mjs";

// Visit every block in the tree, including nested ones.
function eachBlock(blocks, fn) {
  (blocks || []).forEach((b) => {
    fn(b);
    if (b.blocks) eachBlock(b.blocks, fn);
    if (b.left) eachBlock(b.left, fn);
    if (b.right) eachBlock(b.right, fn);
    if (b.tabs) b.tabs.forEach((t) => eachBlock(t.blocks, fn));
    if (b.candidates) b.candidates.forEach((c) => c.blocks && eachBlock(c.blocks, fn));
  });
}

// Assign stable ids to every block (so a React render and the JS render agree).
function assignIds(blocks) {
  let s = 0;
  const go = (arr) =>
    (arr || []).forEach((b) => {
      if (!b.id) b.id = slugify(b.title || b.heading || b.type) + "-" + (s++).toString(36);
      if (b.blocks) go(b.blocks);
      if (b.left) go(b.left);
      if (b.right) go(b.right);
      if (b.tabs) b.tabs.forEach((t) => go(t.blocks));
      if (b.candidates) b.candidates.forEach((c) => c.blocks && go(c.blocks));
    });
  go(blocks);
}

const LANG_ALIAS = { js: "javascript", ts: "typescript", sh: "bash", shell: "bash", zsh: "bash", yml: "yaml", md: "markdown", py: "python" };
const normLang = (l) => (l ? (LANG_ALIAS[String(l).toLowerCase()] || String(l).toLowerCase()) : "");

// Build-time enrichment: Shiki syntax highlighting + Graphviz DOT -> inline SVG.
// Results are stashed on `_hl` / `_svg` (stripped from the embedded JSON island).
async function enrich(model) {
  const codeBlocks = [];
  const dotBlocks = [];
  eachBlock(model.blocks || [], (b) => {
    if (b.type === "code") codeBlocks.push(b);
    else if (b.type === "diagram" && String(b.format || "").toLowerCase() === "dot") dotBlocks.push(b);
  });

  if (codeBlocks.length) {
    try {
      const shiki = await import("shiki");
      const wanted = [...new Set(codeBlocks.map((b) => normLang(b.lang)).filter(Boolean))].filter((l) => l in shiki.bundledLanguages);
      const hl = await shiki.createHighlighter({ themes: ["github-light", "github-dark"], langs: wanted });
      const loaded = new Set(hl.getLoadedLanguages());
      for (const b of codeBlocks) {
        const want = normLang(b.lang);
        const lang = want && loaded.has(want) ? want : "text";
        try {
          b._hl = hl.codeToHtml(String(b.code || ""), { lang, themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
        } catch {
          b._hl = null;
        }
      }
    } catch {
      /* highlighting unavailable — fall back to plain code */
    }
  }

  if (dotBlocks.length) {
    try {
      const { Graphviz } = await import("@hpcc-js/wasm-graphviz");
      const graphviz = await Graphviz.load();
      for (const b of dotBlocks) {
        try {
          b._svg = graphviz.dot(String(b.spec || ""));
        } catch {
          b._svg = null;
        }
      }
    } catch {
      /* graphviz unavailable — fall back to source */
    }
  }
}

export async function generate(model) {
  await enrich(model);
  const meta = model.meta || {};
  const ctx = { seq: 0, glossary: new Map(), baseUrl: meta.baseUrl || "" };
  collectGlossary(model.blocks, ctx.glossary);
  // assign ids up front so TOC + render agree
  assignIds(model.blocks);

  const toc = buildToc(model.blocks);
  const body = (model.blocks || []).map((b) => renderBlock(b, ctx)).join("\n");
  const md = toMarkdown(model);
  const digest = agentDigest(model);
  return { html: renderShell(model, { body, toc, md, digest }), md, digest };
}

// Shared HTML shell — used by the JS generator and the React SSR port so both
// produce byte-identical scaffolding (single source of truth).
export function renderShell(model, { body, toc, md, digest, generator = "dossier", footer = "Generated with Dossier" }) {
  const meta = model.meta || {};
  const wordCount = (md.match(/\S+/g) || []).length;
  const readMin = Math.max(1, Math.round(wordCount / 220));

  const themeVars = Object.entries(meta.theme || {})
    .map(([k, v]) => `--ds-${k}: ${v};`)
    .join("");

  const tocHtml = toc
    .map((t) => `<a class="ds-toc-link lvl-${t.level}" href="#${esc(t.id)}" data-toc="${esc(t.id)}">${esc(t.label)}</a>`)
    .join("");

  const lifecycle =
    meta.lifecycle && meta.features?.lifecycleBanner !== false
      ? `<div class="ds-lifecycle stage-${esc(meta.lifecycle.stage || "")}"><b>${esc(meta.lifecycle.stage || "")}</b> ${esc(meta.lifecycle.note || "")}${meta.lifecycle.promoteTo ? ` → ${esc(meta.lifecycle.promoteTo)}` : ""}</div>`
      : "";

  const crumbs = (meta.crumbs || []).join(" / ");
  const modelJson = JSON.stringify(model, (k, v) => (k.charAt(0) === "_" ? undefined : v)).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="${esc(generator)}/${esc(model.dossierVersion || "1.0")}">
<title>${esc(meta.title || "Dossier")}</title>
<style>:root{${themeVars}}${CSS}</style>
</head>
<body>
<div class="ds-progress"><div class="ds-progress-bar"></div></div>
<div class="ds-shell">
<header class="ds-topbar">
<div class="ds-brand"><span class="ds-mark"></span><span class="ds-crumbs">${esc(crumbs || meta.title || "")}</span></div>
<div class="ds-tools">
<button class="ds-btn ds-search-btn" type="button" data-palette-open><span class="ds-i"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.4-3.4"></path></svg></span><span class="ds-search-label">Search</span><kbd>⌘K</kbd></button>
<button class="ds-btn" type="button" data-theme-toggle aria-label="Toggle theme">◐</button>
<details class="ds-menu"><summary>Export</summary><div class="ds-menu-list">
<button class="ds-btn" type="button" data-action="copy-md">Copy Markdown</button>
<button class="ds-btn" type="button" data-action="download-md">Download Markdown</button>
<button class="ds-btn" type="button" data-action="download-json">Download JSON</button>
<button class="ds-btn" type="button" data-action="view-source">View source</button>
</div></details>
</div>
</header>
${lifecycle}
<div class="ds-layout${toc.length ? "" : " no-toc"}">
<main class="ds-content">
${body}
</main>
${toc.length ? `<aside class="ds-toc"><div class="ds-search"><input type="search" placeholder="Search…" data-search></div><div class="ds-toc-head">On this page</div>${tocHtml}</aside>` : ""}
</div>
<footer class="ds-footer">${readMin} min read · ${wordCount.toLocaleString("en-US")} words · ${esc(footer)}${meta.updated ? " · " + esc(meta.updated) : ""}</footer>
</div>
<button class="ds-totop" type="button" data-totop aria-label="Back to top">↑</button>

<div class="ds-palette" data-palette hidden><div class="ds-palette-box"><input type="text" placeholder="Jump to or run an action…" data-palette-input><div class="ds-palette-list" data-palette-list></div></div></div>
<div class="ds-modal" data-source-modal hidden><div class="ds-modal-box"><div class="ds-modal-head"><strong>Markdown source</strong><button class="ds-btn" type="button" data-source-close>Close</button></div><textarea readonly data-source-text></textarea></div></div>
<div class="ds-toast" data-toast></div>

<script type="application/json" id="dossier-model">${modelJson}</script>
<script type="text/markdown" id="dossier-markdown">${esc(md)}</script>
<script type="text/plain" id="dossier-digest">${esc(digest)}</script>
<script>${RUNTIME}</script>
</body>
</html>`;
}

// Helpers reused by the React port (single source of truth).
export { slugify, inlineMd, toMarkdown, agentDigest, collectGlossary, buildToc, assignIds, enrich, renderBlock };
// renderShell is exported at its definition (above).
