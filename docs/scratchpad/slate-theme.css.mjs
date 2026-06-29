// Console Slate — design-lab override layer.
// Injected AFTER the generated dossier CSS so these rules win the cascade.
// Targets the REAL ds-* classes so it ports back into src/theme/tokens.css.mjs.
// HARD RULE: no left leading-edge accent stroke on any card/cell. Status is carried
// by tints, filled badges, icons, or full borders — never a left bar.

export const SLATE_OVERRIDES = `
/* ============================================================
   CONSOLE SLATE — palette
   ============================================================ */
:root{
  --ds-bg:#fafbfc; --ds-bg-2:#f1f3f7; --ds-bg-3:#e7eaf1;
  --ds-line:#e2e6ee; --ds-line-2:#d3d8e3; --ds-line-strong:#bcc3d2;
  --ds-ink:#16191f; --ds-ink-2:#4d5563; --ds-ink-3:#828b9c;
  --ds-ok:#0f7a52; --ds-warn:#9a5b00; --ds-danger:#c0263b; --ds-info:#2563ac;
  --ds-ok-tint:rgba(15,122,82,.11); --ds-warn-tint:rgba(154,91,0,.13); --ds-danger-tint:rgba(192,38,59,.1); --ds-info-tint:rgba(37,99,172,.1);
  --ds-accent-tint-2:rgba(58,92,204,.16);
  /* accent is set inline on <html> by the runtime, so it must be !important to win in the lab */
  --ds-accent:#3a5ccc!important; --ds-accent-2:#2c49aa!important; --ds-accent-tint:rgba(58,92,204,.09)!important;
}
[data-theme="dark"]{
  --ds-bg:#0c0e13; --ds-bg-2:#14171f; --ds-bg-3:#1c2029;
  --ds-line:#282d38; --ds-line-2:#363c4a; --ds-line-strong:#4a5163;
  --ds-ink:#e7eaf1; --ds-ink-2:#9aa3b4; --ds-ink-3:#6f7889;
  --ds-ok:#34d399; --ds-warn:#fbbf24; --ds-danger:#fb7185; --ds-info:#7da9e8;
  --ds-ok-tint:rgba(52,211,153,.13); --ds-warn-tint:rgba(251,191,36,.13); --ds-danger-tint:rgba(251,113,133,.13); --ds-info-tint:rgba(125,169,232,.13);
  --ds-accent-tint-2:rgba(125,155,255,.2);
  --ds-accent:#7d9bff!important; --ds-accent-2:#97aeff!important; --ds-accent-tint:rgba(125,155,255,.13)!important;
}

/* ============================================================
   Base type — slightly denser, tabular data
   ============================================================ */
body{font-size:15.5px;line-height:1.5}
/* wider canvas (~+19%); data blocks can scroll on overflow. More air between sections. */
:root{--ds-frame:1400px}
.ds-content>.ds-block+.ds-block{margin-top:32px}
.ds-content>.ds-block+.ds-section{margin-top:76px}
table,.ds-stat strong,.ds-meta .ds-val,.ds-date,.ds-detail dd,.ds-diff-summary{font-variant-numeric:tabular-nums}

/* masthead */
.ds-topbar{background:color-mix(in srgb,var(--ds-bg) 86%,transparent);backdrop-filter:saturate(1.4) blur(8px)}
.ds-mark{border-radius:3px;transform:rotate(45deg)}

/* ============================================================
   Section heads — serif title + mono § number (no filled pill)
   ============================================================ */
.ds-content>.ds-section .ds-section-titles h2{font-family:var(--ds-serif);font-weight:480;font-size:24px;letter-spacing:-.014em}
.ds-content>.ds-section .ds-section-titles h2::before{
  background:transparent;color:var(--ds-ink-3);font-family:var(--ds-mono);
  font-size:11px;font-weight:600;letter-spacing:.06em;padding:0;margin-bottom:7px;border-radius:0}
.ds-section-titles .ds-muted{font-size:14px}
/* nested sections: no § number, smaller serif title so hierarchy reads */
.ds-section-body .ds-section .ds-section-titles h2::before{display:none}
.ds-section-body .ds-section .ds-section-titles h2{font-size:18px}

/* TOC — convert left-rail indicator to an active pill (no left stroke) */
.ds-toc-link{border-left:0;padding:5px 10px;border-radius:7px}
.ds-toc-link.lvl-2{padding-left:22px}
.ds-toc-link.active{color:var(--ds-accent);background:var(--ds-accent-tint);border-left:0}

/* ============================================================
   Hero — two-zone grid, sideCards become a right meta panel
   ============================================================ */
[data-block="hero"]{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);column-gap:48px;align-items:start}
[data-block="hero"]>*{grid-column:1;min-width:0}
[data-block="hero"]>.ds-meta{
  grid-column:2;grid-row:1 / span 60;align-self:start;margin:0;padding:0;
  border:1px solid var(--ds-line-2);border-radius:12px;background:var(--ds-bg-2);overflow:hidden;
  display:block}
[data-block="hero"]>.ds-meta .ds-meta-item{
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:12px 16px;border-top:1px solid var(--ds-line);grid-template-columns:none}
[data-block="hero"]>.ds-meta .ds-meta-item:first-child{border-top:0}
[data-block="hero"]>.ds-meta .ds-label{font-family:var(--ds-mono);font-size:10.5px;letter-spacing:.04em}
[data-block="hero"]>.ds-meta .ds-val{font-family:var(--ds-mono);font-size:13px;font-weight:560;text-align:right}
.ds-eyebrow{background:transparent;padding:0;color:var(--ds-accent);font-family:var(--ds-mono);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;display:inline-flex;align-items:center;gap:8px}
.ds-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--ds-accent);box-shadow:0 0 0 3px var(--ds-accent-tint)}
.ds-pill{font-weight:540}
.ds-pillrow{gap:7px}
.ds-pillrow .ds-pill{padding:5px 11px;border:1px solid var(--ds-line-2);background:var(--ds-bg-2);border-radius:7px;color:var(--ds-ink-2)}
.ds-pillrow .ds-pill::before{display:none}
@media (max-width:900px){
  [data-block="hero"]{grid-template-columns:1fr}
  [data-block="hero"]>.ds-meta{grid-column:1;grid-row:auto;margin-top:22px}
}

/* ============================================================
   KPI stats — fused into one bordered strip (no floating cards)
   ============================================================ */
/* gap:1px over a line-colored ground draws hairline dividers in BOTH axes, so the
   strip stays fused and wraps gracefully for any number of stats. No left accent edge. */
.ds-statgrid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--ds-line-2);border:1px solid var(--ds-line-2);border-radius:12px;overflow:hidden}
.ds-stat{border:0;border-radius:0;background:var(--ds-bg);padding:15px 18px}
.ds-stat:hover{transform:none}
.ds-stat strong{font-family:var(--ds-mono);font-size:28px}
.ds-stat span{margin-top:7px;font-size:12.5px}

/* ============================================================
   Summary cards — tonal grounds (no left edge), steady hover
   ============================================================ */
.ds-card{border-radius:11px}
.ds-card:hover{transform:none;border-color:var(--ds-line-strong)}
.ds-card.tone-accent{background:var(--ds-accent-tint);border-color:var(--ds-accent-tint-2)}
.ds-card.tone-highlight{background:var(--ds-info-tint);border-color:color-mix(in srgb,var(--ds-info) 24%,transparent)}
.ds-card.tone-success{background:var(--ds-ok-tint);border-color:color-mix(in srgb,var(--ds-ok) 26%,transparent)}
.ds-card.tone-warning{background:var(--ds-warn-tint);border-color:color-mix(in srgb,var(--ds-warn) 28%,transparent)}
.ds-card.tone-danger{background:var(--ds-danger-tint);border-color:color-mix(in srgb,var(--ds-danger) 26%,transparent)}
.ds-card.tone-accent h3{color:var(--ds-accent)}
.ds-card.tone-highlight h3{color:var(--ds-info)}
.ds-card.tone-success h3{color:var(--ds-ok)}
.ds-card.tone-warning h3{color:var(--ds-warn)}
.ds-card.tone-danger h3{color:var(--ds-danger)}

/* ============================================================
   Callouts — tonal fill + icon chip, NO left rule
   ============================================================ */
.ds-callout{position:relative;border:1px solid var(--ds-line-2);background:var(--ds-bg-2);border-radius:11px;padding:13px 16px 13px 46px;color:var(--ds-ink-2)}
.ds-callout::before{content:"i";position:absolute;left:14px;top:13px;width:22px;height:22px;border-radius:6px;background:var(--ds-ink-3);color:var(--ds-bg);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;font-family:var(--ds-font)}
.ds-callout.tone-tip{background:var(--ds-accent-tint);border-color:var(--ds-accent-tint-2)}
.ds-callout.tone-tip::before{content:"✦";background:var(--ds-accent)}
.ds-callout.tone-ok{background:var(--ds-ok-tint);border-color:color-mix(in srgb,var(--ds-ok) 26%,transparent)}
.ds-callout.tone-ok::before{content:"✓";background:var(--ds-ok)}
.ds-callout.tone-warn{background:var(--ds-warn-tint);border-color:color-mix(in srgb,var(--ds-warn) 28%,transparent)}
.ds-callout.tone-warn::before{content:"!";background:var(--ds-warn)}
.ds-callout.tone-danger{background:var(--ds-danger-tint);border-color:color-mix(in srgb,var(--ds-danger) 26%,transparent)}
.ds-callout.tone-danger::before{content:"!";background:var(--ds-danger)}
.ds-callout.tone-info{background:var(--ds-info-tint);border-color:color-mix(in srgb,var(--ds-info) 26%,transparent)}
.ds-callout.tone-info::before{content:"i";background:var(--ds-info)}
[data-theme="dark"] .ds-callout::before{color:#0c0e13}

/* ============================================================
   Tables — framed, surface header, zebra, symmetric padding
   ============================================================ */
.ds-tablewrap{border:1px solid var(--ds-line-2);border-radius:11px;overflow:auto}
.ds-tablewrap table{font-size:14px}
th{background:var(--ds-bg-3);font-family:var(--ds-mono);font-size:10.5px;font-weight:600;letter-spacing:.05em;padding:9px 14px;border-bottom:1px solid var(--ds-line-2)}
td{padding:9px 14px;border-bottom:1px solid var(--ds-line)}
.ds-tablewrap tbody tr:last-child td{border-bottom:0}
tbody tr:nth-child(even) td{background:color-mix(in srgb,var(--ds-bg-2) 50%,transparent)}
tbody tr:hover td{background:var(--ds-bg-2)}

/* ============================================================
   Decision matrix — recommended row wins via tint + filled badge (no left edge)
   ============================================================ */
tr.ds-rec td{background:var(--ds-accent-tint)}
tr.ds-rec:hover td{background:var(--ds-accent-tint)}
tr.ds-rec td strong{color:var(--ds-ink)}
.ds-rec .ds-pill{background:var(--ds-accent);color:#fff;border:0;font-family:var(--ds-mono);font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 8px;border-radius:5px}
.ds-rec .ds-pill::before{content:"★ "}
[data-theme="dark"] .ds-rec .ds-pill{color:#0c0e13}

/* ============================================================
   Risk register — severity heat pills (no left edge)
   ============================================================ */
.ds-lvl{display:inline-flex;align-items:center;gap:6px;padding:2px 9px;border-radius:6px;font-family:var(--ds-mono);font-size:11px;font-weight:600}
.ds-lvl::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;flex:none}
.ds-lvl.l-high{background:var(--ds-danger-tint);color:var(--ds-danger)}
.ds-lvl.l-medium{background:var(--ds-warn-tint);color:var(--ds-warn)}
.ds-lvl.l-low{background:var(--ds-ok-tint);color:var(--ds-ok)}

/* ============================================================
   Status chips — full semantic map (filled tints)
   ============================================================ */
.ds-status{padding:3px 10px;border-radius:7px;font-family:var(--ds-mono);font-size:10.5px;letter-spacing:.02em}
.s-done,.s-shipped,.s-passed,.s-accepted,.s-verified,.s-applied,.s-resolved{color:var(--ds-ok);background:var(--ds-ok-tint)}
.s-failed,.s-rejected,.s-disputed,.s-blocked{color:var(--ds-danger);background:var(--ds-danger-tint)}
.s-in-progress,.s-doing,.s-proposed,.s-needs-revision,.s-planned,.s-pending,.s-review,.s-partial,.s-unverified,.s-opened{color:var(--ds-warn);background:var(--ds-warn-tint)}

/* generic chips a touch sharper */
.ds-chip{border-radius:6px;font-weight:540}

/* ============================================================
   Review / process rows — keep clean, no left spine
   ============================================================ */
.ds-ritem{border-radius:11px}
.ds-ritem-aside .ds-status{height:auto}
.ds-pitem.verdict-approve,.ds-pitem.verdict-block,.ds-pitem.verdict-revise,.ds-pitem.verdict-retry{border-width:1px}

/* ============================================================
   Trust claim — remove left color bar; carry status via subtle full tint
   ============================================================ */
.ds-trust-claim{border-left:1px solid var(--ds-line-2)}
.ds-trust-claim.status-verified,.ds-trust-claim.status-accepted{border-left-color:var(--ds-line-2);background:var(--ds-ok-tint)}
.ds-trust-claim.status-partial,.ds-trust-claim.status-unverified{border-left-color:var(--ds-line-2);background:var(--ds-warn-tint)}
.ds-trust-claim.status-disputed,.ds-trust-claim.status-rejected{border-left-color:var(--ds-line-2);background:var(--ds-danger-tint)}

/* ============================================================
   Detail / key-value grids — tighter label column, mono labels
   ============================================================ */
.ds-detail{grid-template-columns:minmax(86px,max-content) 1fr;gap:10px 18px;padding:7px 0}
.ds-detail dt{font-family:var(--ds-mono);font-size:10.5px;letter-spacing:.03em}
.ds-receipt .ds-detail{grid-template-columns:minmax(96px,max-content) 1fr}

/* ============================================================
   Release checklist — fix the gate title/chip collision
   ============================================================ */
/* gate: title left, status chips right, notes textarea spanning full width below */
.ds-release-gate{display:grid;grid-template-columns:1fr auto;gap:10px 16px;align-items:center;padding:15px 0}
.ds-release-gate>label{grid-column:1;min-width:0}
.ds-release-gate>.ds-action-meta{grid-column:2;justify-self:end;flex-wrap:wrap}
.ds-release-gate>textarea{grid-column:1 / -1;width:100%;min-height:64px}

/* ============================================================
   Code / lang accents inherit the indigo accent automatically.
   Diagram light backdrop stays white; charts pick up accent (indigo).
   ============================================================ */
.ds-code-bar .ds-lang,.ds-codeedit-bar .ds-lang{color:var(--ds-accent)}

/* ============================================================
   ITERATION 2 — layout & padding fixes
   ============================================================ */
/* two-col columns are bare <div>s with no gap -> blocks touch. Space them. */
.ds-twocol>div{display:grid;gap:18px;align-content:start}
.ds-cardgrid{gap:16px}

/* input panels had 0 padding so fields sat flush to the container edge */
.ds-diff-review{padding:13px 15px;display:grid;gap:11px}
.ds-diff-review label{display:grid;gap:5px;margin:0}
.ds-patch-review{padding:13px 15px;display:grid;gap:11px}
.ds-diff-meta-lines{padding:2px 15px 12px}
.ds-notes{padding-left:0;padding-right:0}

/* copy button: an elevated chip that reads as a control and clears divider lines */
.ds-copy{top:12px;right:12px;background:var(--ds-bg);border-color:var(--ds-line-2);box-shadow:0 2px 8px rgba(20,16,40,.10)}
.ds-section>.ds-copy{display:none}     /* sections are containers; copy their nested blocks instead */

/* no harsh blue selection rectangle on controls; softer text selection */
button,summary,.ds-btn,.ds-copy,.ds-chip,.ds-status,.ds-pill,.ds-lvl,.ds-toggle,.ds-action label,.ds-toc-link{-webkit-user-select:none;user-select:none}
::selection{background:var(--ds-accent-tint-2)}
:focus-visible{outline:2px solid var(--ds-accent);outline-offset:2px}
`;
