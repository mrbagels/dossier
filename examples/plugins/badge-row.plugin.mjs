// Example Dossier plugin. Registers a custom `badge-row` block.
// Use it:  dossier build my.dossier.json --plugin examples/plugins/badge-row.plugin.mjs
// Then in your model:  { "type": "badge-row", "badges": ["alpha", "v2", "internal"] }
//
// A plugin default-exports a function that receives the authoring API and registers
// one or more block renderers. A renderer returns an HTML string (use the provided
// `esc` for untrusted text and `inlineMd` for markdown).

export default function ({ registerBlock, esc, inlineMd }) {
  registerBlock("badge-row", (b) => {
    const badges = (b.badges || []).map((x) => `<span class="ds-chip">${esc(x)}</span>`).join("");
    const note = b.note ? `<p class="ds-muted">${inlineMd(b.note, { glossary: new Map(), footnotes: new Map(), baseUrl: "" })}</p>` : "";
    return (
      `<section class="ds-block" data-block="badge-row" data-id="${esc(b.id || "")}">` +
      `<div class="ds-chips">${badges}</div>${note}</section>`
    );
  });
}
