import React from "react";
import { inlineMd, slugify, chartSvg, renderBlock, knownBlockTypes, parseUnifiedDiff } from "../../src/generate.mjs";

// React-side plugin registry, register a component for a custom block type so it renders
// natively in the React port (parity with the Node generator's registerBlock).
const componentRegistry = new Map<string, React.FC<{ b: any }>>();
export function registerComponent(type: string, Component: React.FC<{ b: any }>) {
  componentRegistry.set(type, Component);
}
import type { Block as B, PatchItem as PatchItemModel, ProcessItem as ProcessItemModel, ReviewCandidate } from "./types.js";

// Render context (glossary + baseUrl) for inline-markdown resolution. Set once per render.
let CTX: any = { glossary: new Map<string, string>(), baseUrl: "" };
export function setCtx(ctx: any) {
  CTX = ctx;
}
const md = (t?: string) => ({ __html: inlineMd(t ?? "", CTX) });
const raw = (h?: string) => ({ __html: h ?? "" });
const PROCESS_VERDICTS = ["undecided", "approve", "revise", "skip", "defer", "split", "retry", "block"];

const CopyIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const ChevronIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Wrap: React.FC<{ type: string; id?: string; children: React.ReactNode }> = ({ type, id, children }) => (
  <section className="ds-block" data-block={type} data-id={id}>
    <button className="ds-copy" type="button" data-copy aria-label="Copy block" title="Copy">{CopyIcon}</button>
    {children}
  </section>
);

const Hero: React.FC<{ b: B }> = ({ b }) => (
  <section className="ds-hero ds-block" data-block="hero" data-id={b.id}>
    {b.eyebrow && <p className="ds-eyebrow">{b.eyebrow}</p>}
    <h1 id={b.id} data-edit={`${b.id}:title`}>{b.title}</h1>
    {b.lede && <p className="ds-lede" data-edit={`${b.id}:lede`} dangerouslySetInnerHTML={md(b.lede)} />}
    {b.pills?.length > 0 && (
      <div className="ds-pillrow">
        {b.pills.map((p: string, i: number) => <span className="ds-pill" key={i}>{p}</span>)}
      </div>
    )}
    {b.sideCards?.length > 0 && (
      <div className="ds-meta">
        {b.sideCards.map((c: any, i: number) => (
          <div className="ds-meta-item" key={i}>
            <span className="ds-label">{c.label}</span>
            <span className="ds-val">{c.value}</span>
          </div>
        ))}
      </div>
    )}
  </section>
);

const Section: React.FC<{ b: B }> = ({ b }) => (
  <section className={`${b.framed === false ? "ds-section unframed" : "ds-section"} ds-block`} data-block="section" data-id={b.id} {...(b.collapsed ? { "data-collapsed": "1" } : {})}>
    <div className="ds-section-head">
      <div className="ds-section-titles">
        <h2 id={b.id} data-edit={`${b.id}:title`}>{b.title}</h2>
        {b.subtitle && <p className="ds-muted" data-edit={`${b.id}:subtitle`} dangerouslySetInnerHTML={md(b.subtitle)} />}
      </div>
      <button className="ds-toggle" type="button" data-toggle aria-label="Toggle section">{ChevronIcon}</button>
    </div>
    <div className="ds-section-body">
      {(b.blocks || []).map((c: B, i: number) => <Block b={c} key={c.id || i} />)}
    </div>
  </section>
);

const Heading: React.FC<{ id?: string; text?: string }> = ({ id, text }) => (text ? <h3 id={id}>{text}</h3> : null);

const TwoCol: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="two-col" id={b.id}>
    <div className="ds-twocol">
      <div>{(b.left || []).map((c: B, i: number) => <Block b={c} key={c.id || i} />)}</div>
      <div>{(b.right || []).map((c: B, i: number) => <Block b={c} key={c.id || i} />)}</div>
    </div>
  </Wrap>
);

const SummaryCards: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="summary-cards" id={b.id}>
    <div className="ds-cardgrid">
      {(b.cards || []).map((c: any, i: number) => (
        <article className={`ds-card${c.tone ? " tone-" + c.tone : ""}`} key={i}>
          <h3>{c.title}</h3>
          <p dangerouslySetInnerHTML={md(c.body)} />
        </article>
      ))}
    </div>
  </Wrap>
);

const StatStrip: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="stat-strip" id={b.id}>
    <div className="ds-statgrid">
      {(b.stats || []).map((s: any, i: number) => (
        <div className="ds-stat" key={i}><strong>{s.value}</strong><span>{s.label}</span></div>
      ))}
    </div>
  </Wrap>
);

const Flow: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="flow" id={b.id}>
    <Heading id={b.id} text={b.title} />
    <div className="ds-flow">
      {(b.steps || []).map((s: any, i: number) => (
        <div className="ds-flowstep" key={i}>
          <div className="ds-flowstep-body"><strong>{s.title}</strong><span dangerouslySetInnerHTML={md(s.body)} /></div>
        </div>
      ))}
    </div>
  </Wrap>
);

const Timeline: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="timeline" id={b.id}>
    <Heading id={b.id} text={b.title} />
    <div className="ds-timeline">
      {(b.phases || []).map((p: any, i: number) => (
        <div className="ds-phase" key={i}>
          <div className="ds-phase-id">
            {p.label}
            {p.status && <span className={`ds-status s-${p.status}`}>{p.status}</span>}
            {p.date && <span className="ds-date">{p.date}</span>}
          </div>
          <div dangerouslySetInnerHTML={md(p.body)} />
        </div>
      ))}
    </div>
  </Wrap>
);

const Table: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="table" id={b.id}>
    <Heading id={b.id} text={b.title} />
    <div className="ds-tablewrap">
      <table>
        <thead><tr>{(b.columns || []).map((c: string, i: number) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {(b.rows || []).map((r: string[], i: number) => (
            <tr key={i}>{r.map((c: string, j: number) => <td key={j} dangerouslySetInnerHTML={md(c)} />)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  </Wrap>
);

const Callout: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="callout" id={b.id}>
    <div className={`ds-callout tone-${b.tone || "info"}`}>
      {b.title && <strong data-edit={`${b.id}:title`}>{b.title} </strong>}
      <span data-edit={`${b.id}:body`} dangerouslySetInnerHTML={md(b.body)} />
    </div>
  </Wrap>
);

const Code: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="code" id={b.id}>
    <div className="ds-code">
      <div className="ds-code-bar">
        <span className="ds-lang">{b.filename || b.lang || "code"}</span>
        <button className="ds-code-copy" type="button" data-code-copy>Copy</button>
      </div>
      {b._hl ? <div dangerouslySetInnerHTML={raw(b._hl)} /> : <pre><code>{b.code}</code></pre>}
    </div>
  </Wrap>
);

const diffFileLabel = (file: any) => (file.newPath && file.newPath !== "/dev/null" ? file.newPath : file.oldPath || "diff");

const DiffViewInner: React.FC<{ b: B; nested?: boolean }> = ({ b, nested = false }) => {
  const files = parseUnifiedDiff(b.diff || "", b.filename || b.title || "diff");
  const additions = files.reduce((sum: number, file: any) => sum + file.additions, 0);
  const deletions = files.reduce((sum: number, file: any) => sum + file.deletions, 0);
  return (
    <section className={nested ? "ds-diffview nested" : "ds-block ds-diffview"} data-block="diff-view" data-id={b.id}>
      {!nested && <button className="ds-copy" type="button" data-copy aria-label="Copy block" title="Copy">{CopyIcon}</button>}
      {b.title && (nested ? <h4>{b.title}</h4> : <h3 id={b.id}>{b.title}</h3>)}
      {b.summary && <p className="ds-muted" dangerouslySetInnerHTML={md(b.summary)} />}
      <div className="ds-diff-summary"><span>{files.length} file{files.length === 1 ? "" : "s"}</span><span className="add">+{additions}</span><span className="del">-{deletions}</span></div>
      {files.length > 0 && (
        <nav className="ds-diff-files">
          {files.map((file: any, i: number) => {
            const label = diffFileLabel(file);
            return <a href={`#${b.id}-${slugify(label)}`} className="ds-diff-filelink" key={i}><span>{label}</span><b>+{file.additions} -{file.deletions}</b></a>;
          })}
        </nav>
      )}
      <div className="ds-diff-body">
        {files.length > 0 ? files.map((file: any, i: number) => {
          const label = diffFileLabel(file);
          return (
            <details className="ds-diff-file" id={`${b.id}-${slugify(label)}`} open key={i}>
              <summary><span className="ds-diff-path">{label}</span><span className="ds-diff-stat">+{file.additions} -{file.deletions}</span></summary>
              {file.meta.length > 0 && <div className="ds-diff-meta-lines">{file.meta.map((line: string, j: number) => <code key={j}>{line}</code>)}</div>}
              {file.hunks.map((hk: any, h: number) => (
                <div className="ds-hunk" key={h}>
                  <div className="ds-hunk-head">{hk.header}</div>
                  <pre className="ds-diff-lines"><code>{hk.lines.map((line: any, j: number) => (
                      <span className={`ds-diff-line ${line.type}`} key={j}>
                        <span className="ds-diff-num">{line.oldNumber}</span>
                        <span className="ds-diff-num">{line.newNumber}</span>
                        <span className="ds-diff-mark">{line.mark}</span>
                        <span className="ds-diff-code">{line.text}</span>
                      </span>
                    ))}</code></pre>
                </div>
              ))}
            </details>
          );
        }) : <pre className="ds-diff-empty"><code>{b.diff || ""}</code></pre>}
      </div>
    </section>
  );
};

const PatchSet: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="patch-set" id={b.id}>
    {b.title && <h3 id={b.id}>{b.title}</h3>}
    {b.summary && <p className="ds-muted" dangerouslySetInnerHTML={md(b.summary)} />}
    <div className="ds-patchlist">
      {(b.patches || []).map((p: PatchItemModel, i: number) => {
        const chips: string[] = [];
        if (p.operation) chips.push(p.operation);
        if (p.status) chips.push(p.status);
        if (p.risk) chips.push(`Risk · ${p.risk}`);
        const rows: [string, string][] = [];
        if (p.files?.length) rows.push(["Files", p.files.join(", ")]);
        if (p.workItems?.length) rows.push(["Work items", p.workItems.join(", ")]);
        if (p.verification?.length) rows.push(["Verification", p.verification.join(", ")]);
        Object.entries(p.details || {}).forEach(([k, v]) => rows.push([k, v]));
        return (
          <article className="ds-patch" data-patch={p.id} key={p.id || i}>
            <div className="ds-patch-head">
              <div><h4>{p.title || p.id || "Patch"}</h4>{p.summary && <p className="ds-muted" dangerouslySetInnerHTML={md(p.summary)} />}</div>
              {chips.length > 0 && <div className="ds-chips">{chips.map((x, j) => <span className="ds-chip" key={j}>{x}</span>)}</div>}
            </div>
            {rows.length > 0 && (
              <dl className="ds-detailgrid">
                {rows.map(([k, v], j) => <div className="ds-detail" key={j}><dt>{k}</dt><dd dangerouslySetInnerHTML={md(v)} /></div>)}
              </dl>
            )}
            {p.diff && <DiffViewInner b={{ type: "diff-view", id: `${p.id || slugify(p.title || "patch")}-diff`, title: "Diff", diff: p.diff }} nested />}
          </article>
        );
      })}
    </div>
  </Wrap>
);

const DiffView: React.FC<{ b: B }> = ({ b }) => <DiffViewInner b={b} />;

const Tabs: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="tabs" id={b.id}>
    <div className="ds-tabs">
      <div className="ds-tabbar">
        {(b.tabs || []).map((t: any, i: number) => (
          <button className={`ds-tab${i === 0 ? " active" : ""}`} type="button" data-tab={i} key={i}>{t.label}</button>
        ))}
      </div>
      {(b.tabs || []).map((t: any, i: number) => (
        <div className={`ds-pane${i === 0 ? " active" : ""}`} data-pane={i} key={i}>
          {(t.blocks || []).map((c: B, j: number) => <Block b={c} key={c.id || j} />)}
        </div>
      ))}
    </div>
  </Wrap>
);

const Faq: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="faq" id={b.id}>
    <Heading id={b.id} text={b.title} />
    {(b.items || []).map((it: any, i: number) => (
      <details className="ds-faq" key={i}>
        <summary>{it.q}</summary>
        <p dangerouslySetInnerHTML={md(it.a)} />
      </details>
    ))}
  </Wrap>
);

const References: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="references" id={b.id}>
    <Heading id={b.id} text={b.title} />
    <div className="ds-tablewrap">
      <table>
        <thead><tr><th>Source</th><th>Signal</th><th>Use</th></tr></thead>
        <tbody>
          {(b.items || []).map((r: any, i: number) => (
            <tr key={i}>
              <td>{r.url ? <a href={r.url}>{r.label}</a> : r.label}</td>
              <td dangerouslySetInnerHTML={md(r.signal)} />
              <td dangerouslySetInnerHTML={md(r.use)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Wrap>
);

const DecisionMatrix: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="decision-matrix" id={b.id}>
    <Heading id={b.id} text={b.title} />
    <div className="ds-tablewrap">
      <table>
        <thead><tr><th>Option</th>{(b.criteria || []).map((c: string, i: number) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {(b.options || []).map((o: any, i: number) => (
            <tr className={o.recommended ? "ds-rec" : ""} key={i}>
              <td><strong>{o.name}</strong>{o.recommended && <span className="ds-pill"> recommended</span>}</td>
              {(o.scores || []).map((s: string, j: number) => <td key={j} dangerouslySetInnerHTML={md(s)} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Wrap>
);

const RiskRegister: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="risk-register" id={b.id}>
    <Heading id={b.id} text={b.title} />
    <div className="ds-tablewrap">
      <table>
        <thead><tr><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th></tr></thead>
        <tbody>
          {(b.risks || []).map((r: any, i: number) => (
            <tr key={i}>
              <td dangerouslySetInnerHTML={md(r.risk)} />
              <td><span className={`ds-lvl l-${r.likelihood || ""}`}>{r.likelihood}</span></td>
              <td><span className={`ds-lvl l-${r.impact || ""}`}>{r.impact}</span></td>
              <td dangerouslySetInnerHTML={md(r.mitigation)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Wrap>
);

const ActionItems: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="action-items" id={b.id}>
    <Heading id={b.id} text={b.title} />
    <ul className="ds-actions">
      {(b.items || []).map((it: any, i: number) => (
        <li className="ds-action" data-action={`${b.id}:${i}`} key={i}>
          <label><input type="checkbox" data-action-check defaultChecked={it.status === "done"} /><span className="ds-action-title" dangerouslySetInnerHTML={md(it.title)} /></label>
          <span className="ds-action-meta">
            {it.owner && <span className="ds-owner">{it.owner}</span>}
            <span className={`ds-status s-${it.status || "todo"}`}>{it.status || "todo"}</span>
          </span>
        </li>
      ))}
    </ul>
  </Wrap>
);

const Assumptions: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="assumptions" id={b.id}>
    <h3 id={b.id}>{b.title || "Assumptions & open questions"}</h3>
    <ul className="ds-assumptions">
      {(b.items || []).map((it: any, i: number) => (
        <li className={`ds-assumption a-${it.status || "unverified"}`} key={i}>
          <span className="ds-akind">{it.kind || "assumption"}</span>
          <span dangerouslySetInnerHTML={md(it.statement)} />
          <span className="ds-astatus">{it.status || "unverified"}</span>
        </li>
      ))}
    </ul>
  </Wrap>
);

const Glossary: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="glossary" id={b.id}>
    <h3 id={b.id}>{b.title || "Glossary"}</h3>
    <dl className="ds-glossary">
      {(b.terms || []).map((t: any, i: number) => (
        <div className="ds-gterm" id={`term-${slugify(t.term)}`} key={i}>
          <dt>{t.term}</dt><dd dangerouslySetInnerHTML={md(t.definition)} />
        </div>
      ))}
    </dl>
  </Wrap>
);

const Diagram: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="diagram" id={b.id}>
    <Heading id={b.id} text={b.title} />
    {b._svg ? (
      <div className="ds-diagram ds-diagram-svg" dangerouslySetInnerHTML={raw(b._svg)} />
    ) : (
      <div className="ds-diagram">
        <div className="ds-code-bar"><span>diagram · {b.format || "dot"}</span></div>
        <pre><code>{b.spec}</code></pre>
      </div>
    )}
  </Wrap>
);

const ReviewItem: React.FC<{ c: ReviewCandidate }> = ({ c }) => {
  const chips: string[] = [];
  if (c.category) chips.push(c.category);
  if (c.impact) chips.push(`Impact · ${c.impact}`);
  if (c.effort) chips.push(`Effort · ${c.effort}`);
  (c.badges || []).forEach((x) => chips.push(x));
  const searchText = [c.title, c.summary, c.category, c.body].filter(Boolean).join(" ").toLowerCase();
  const hasRef = !!(c.body || (c.blocks && c.blocks.length) || (c.details && Object.keys(c.details).length));
  return (
    <article className="ds-ritem" data-candidate={c.id} {...(c.scope ? { "data-scope": c.scope } : {})} data-text={searchText}>
      <div className="ds-ritem-head" data-rtoggle>
        <span className="ds-ritem-check" data-stop><input type="checkbox" data-select={c.id} aria-label={`Select ${c.title}`} /></span>
        <div className="ds-ritem-titles">
          <h4>{c.title}</h4>
          <p className="ds-muted" dangerouslySetInnerHTML={md(c.summary)} />
          {chips.length > 0 && <div className="ds-chips">{chips.map((x, i) => <span className="ds-chip" key={i}>{x}</span>)}</div>}
        </div>
        <div className="ds-ritem-aside">
          {c.status && <span className={`ds-status s-${slugify(c.status)}`}>{c.status}</span>}
          <span className="ds-chev" aria-hidden="true">▾</span>
        </div>
      </div>
      <div className="ds-ritem-wrap">
        <div className="ds-ritem-body">
          {hasRef && (
            <div className="ds-ref">
              {c.body && c.body.split(/\n{2,}/).map((p, i) => <p key={i} dangerouslySetInnerHTML={md(p)} />)}
              {(c.blocks || []).map((x, i) => <Block b={x} key={x.id || i} />)}
              {c.details && Object.keys(c.details).length > 0 && (
                <dl className="ds-detailgrid">
                  {Object.entries(c.details).map(([k, v], i) => (
                    <div className="ds-detail" key={i}><dt>{k}</dt><dd dangerouslySetInnerHTML={md(v)} /></div>
                  ))}
                </dl>
              )}
            </div>
          )}
          <label className="ds-notes"><span>Notes</span><textarea data-notes={c.id} placeholder="Decision notes, priority, constraints" /></label>
        </div>
      </div>
    </article>
  );
};

const ReviewBoard: React.FC<{ b: B }> = ({ b }) => (
  <section className="ds-block ds-reviewboard" data-block="review-board" data-id={b.id}>
    {b.title && <h2 id={b.id}>{b.title}</h2>}
    <div className="ds-review-bar">
      <input className="ds-review-search" type="search" placeholder="Filter…" data-review-search aria-label="Filter items" />
      <label className="ds-review-only"><input type="checkbox" data-review-only /> Selected only</label>
      <button className="ds-btn ds-btn-line" type="button" data-review-expand>Expand all</button>
      <span className="ds-review-count" data-review-count>0 selected</span>
      <button className="ds-btn ds-btn-line" type="button" data-export-decisions>Export JSON</button>
      <button className="ds-btn ds-btn-line" type="button" data-import-decisions>Import</button>
    </div>
    <div className="ds-rlist">
      {(b.candidates || []).map((c: ReviewCandidate, i: number) => <ReviewItem c={c} key={c.id || i} />)}
    </div>
  </section>
);

const ProcessItem: React.FC<{ item: ProcessItemModel }> = ({ item }) => {
  const chips: string[] = [];
  if (item.category) chips.push(item.category);
  if (item.priority) chips.push(`Priority · ${item.priority}`);
  if (item.owner) chips.push(`Owner · ${item.owner}`);
  if (item.impact) chips.push(`Impact · ${item.impact}`);
  if (item.effort) chips.push(`Effort · ${item.effort}`);
  (item.badges || []).forEach((x) => chips.push(x));
  const rows: [string, string][] = [];
  if (item.files?.length) rows.push(["Files", item.files.join(", ")]);
  if (item.dependencies?.length) rows.push(["Depends on", item.dependencies.join(", ")]);
  if (item.verification?.length) rows.push(["Verification", item.verification.join(", ")]);
  if (item.risks?.length) rows.push(["Risks", item.risks.join(", ")]);
  if (item.evidence?.length) rows.push(["Evidence", item.evidence.join(", ")]);
  Object.entries(item.details || {}).forEach(([k, v]) => rows.push([k, v]));
  const verdict = PROCESS_VERDICTS.includes(item.verdict || "") ? item.verdict || "undecided" : "undecided";
  const searchText = [item.title, item.summary, item.category, item.owner, item.body, ...(item.files || []), ...(item.verification || [])].filter(Boolean).join(" ").toLowerCase();
  const hasRef = !!(item.body || (item.blocks && item.blocks.length) || rows.length);
  return (
    <article className={`ds-ritem ds-pitem verdict-${verdict}`} data-process-item={item.id} data-text={searchText}>
      <div className="ds-ritem-head" data-ptoggle>
        <div className="ds-ritem-titles">
          <h4>{item.title}</h4>
          {item.summary && <p className="ds-muted" dangerouslySetInnerHTML={md(item.summary)} />}
          {chips.length > 0 && <div className="ds-chips">{chips.map((x, i) => <span className="ds-chip" key={i}>{x}</span>)}</div>}
        </div>
        <div className="ds-ritem-aside">
          {item.status && <span className={`ds-status s-${slugify(item.status)}`}>{item.status}</span>}
          <label className="ds-process-verdict-wrap" data-stop>
            <span>Verdict</span>
            <select className="ds-process-verdict" data-process-verdict={item.id} defaultValue={verdict}>
              {PROCESS_VERDICTS.map((v) => <option value={v} key={v}>{v}</option>)}
            </select>
          </label>
          <span className="ds-chev" aria-hidden="true">▾</span>
        </div>
      </div>
      <div className="ds-ritem-wrap">
        <div className="ds-ritem-body">
          {hasRef && (
            <div className="ds-ref">
              {item.body && item.body.split(/\n{2,}/).map((p, i) => <p key={i} dangerouslySetInnerHTML={md(p)} />)}
              {(item.blocks || []).map((x, i) => <Block b={x} key={x.id || i} />)}
              {rows.length > 0 && (
                <dl className="ds-detailgrid">
                  {rows.map(([k, v], i) => (
                    <div className="ds-detail" key={i}><dt>{k}</dt><dd dangerouslySetInnerHTML={md(v)} /></div>
                  ))}
                </dl>
              )}
            </div>
          )}
          <label className="ds-notes"><span>Notes</span><textarea data-process-notes={item.id} placeholder="Verdict notes, constraints, follow-up instructions" /></label>
        </div>
      </div>
    </article>
  );
};

const ProcessBoard: React.FC<{ b: B }> = ({ b }) => (
  <section className="ds-block ds-reviewboard ds-processboard" data-block="process-board" data-id={b.id}>
    {b.title && <h2 id={b.id}>{b.title}</h2>}
    <div className="ds-review-bar">
      <input className="ds-review-search" type="search" placeholder="Filter…" data-process-search aria-label="Filter process items" />
      <label className="ds-review-only"><input type="checkbox" data-process-only /> With verdict only</label>
      <button className="ds-btn ds-btn-line" type="button" data-process-expand>Expand all</button>
      <span className="ds-review-count" data-process-count>0 verdicts</span>
      <button className="ds-btn ds-btn-line" type="button" data-export-process>Export process JSON</button>
      <button className="ds-btn ds-btn-line" type="button" data-import-process>Import</button>
    </div>
    <div className="ds-rlist">
      {(b.items || []).map((item: ProcessItemModel, i: number) => <ProcessItem item={item} key={item.id || i} />)}
    </div>
  </section>
);

const Prose: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="prose" id={b.id}>
    {b.heading && <h2 id={b.id} data-edit={`${b.id}:heading`}>{b.heading}</h2>}
    <div data-edit={`${b.id}:markdown`}>
      {String(b.markdown || "").split(/\n{2,}/).map((p, i) => <p key={i} dangerouslySetInnerHTML={md(p)} />)}
    </div>
  </Wrap>
);

const Figure: React.FC<{ b: B }> = ({ b }) => {
  const src = b._src || b.src || "";
  return (
    <Wrap type="figure" id={b.id}>
      <figure className="ds-figure">
        {src && <img src={src} alt={b.alt || b.caption || ""} loading="lazy" />}
        {b.caption && <figcaption dangerouslySetInnerHTML={md(b.caption)} />}
      </figure>
    </Wrap>
  );
};

const Math: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="math" id={b.id}>
    {b._math ? (
      <div className={"ds-math" + (b.display === false ? " inline" : "")} dangerouslySetInnerHTML={raw(b._math)} />
    ) : (
      <div className={"ds-math" + (b.display === false ? " inline" : "")}><code>{b.tex || ""}</code></div>
    )}
  </Wrap>
);

const Footnotes: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="footnotes" id={b.id}>
    <h3 id={b.id}>{b.title || "Notes"}</h3>
    <ol className="ds-footnotes">
      {(b.items || []).map((it: any, i: number) => (
        <li id={`fn-${it.id}`} key={i}>
          <span dangerouslySetInnerHTML={md(it.text)} /> <a className="ds-fnback" href={`#fnref-${it.id}`} aria-label="Back to reference">↩</a>
        </li>
      ))}
    </ol>
  </Wrap>
);

const Chart: React.FC<{ b: B }> = ({ b }) => (
  <Wrap type="chart" id={b.id}>
    {b.title && <h3 id={b.id}>{b.title}</h3>}
    <div className="ds-chart" dangerouslySetInnerHTML={raw(chartSvg(b))} />
  </Wrap>
);

const Receipt: React.FC<{ b: B }> = ({ b }) => {
  const rows: [string, string][] = [];
  if (b.generatedBy) rows.push(["Generated by", b.generatedBy]);
  if (b.model) rows.push(["Model", b.model]);
  if (b.date) rows.push(["Date", b.date]);
  if (b.confidence) rows.push(["Confidence", b.confidence]);
  if (b.tools?.length) rows.push(["Tools", b.tools.join(", ")]);
  return (
    <Wrap type="receipt" id={b.id}>
      <aside className="ds-receipt">
        <div className="ds-receipt-head">{b.title || "Generation receipt"}</div>
        {rows.length > 0 && (
          <dl className="ds-detailgrid">
            {rows.map(([k, v], i) => (
              <div className="ds-detail" key={i}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        )}
        {b.sources?.length > 0 && (
          <div className="ds-receipt-sources">
            <span className="ds-label">Sources</span>
            <ul>{b.sources.map((s: any, i: number) => <li key={i}>{s.url ? <a href={s.url}>{s.label || s.url}</a> : s.label}</li>)}</ul>
          </div>
        )}
        {b.notes && <p className="ds-muted" dangerouslySetInnerHTML={md(b.notes)} />}
      </aside>
    </Wrap>
  );
};

export const Block: React.FC<{ b: B }> = ({ b }) => {
  switch (b.type) {
    case "hero": return <Hero b={b} />;
    case "prose": return <Prose b={b} />;
    case "section": return <Section b={b} />;
    case "two-col": return <TwoCol b={b} />;
    case "summary-cards": return <SummaryCards b={b} />;
    case "stat-strip": return <StatStrip b={b} />;
    case "flow": return <Flow b={b} />;
    case "timeline": return <Timeline b={b} />;
    case "table": return <Table b={b} />;
    case "callout": return <Callout b={b} />;
    case "code": return <Code b={b} />;
    case "patch-set": return <PatchSet b={b} />;
    case "diff-view": return <DiffView b={b} />;
    case "tabs": return <Tabs b={b} />;
    case "faq": return <Faq b={b} />;
    case "references": return <References b={b} />;
    case "decision-matrix": return <DecisionMatrix b={b} />;
    case "risk-register": return <RiskRegister b={b} />;
    case "action-items": return <ActionItems b={b} />;
    case "assumptions": return <Assumptions b={b} />;
    case "glossary": return <Glossary b={b} />;
    case "diagram": return <Diagram b={b} />;
    case "review-board": return <ReviewBoard b={b} />;
    case "process-board": return <ProcessBoard b={b} />;
    case "figure": return <Figure b={b} />;
    case "math": return <Math b={b} />;
    case "footnotes": return <Footnotes b={b} />;
    case "chart": return <Chart b={b} />;
    case "receipt": return <Receipt b={b} />;
    default: {
      // Plugin parity: a registered React component renders natively; otherwise, if the
      // Node generator knows the type (a string-renderer plugin), inject its HTML.
      const Custom = componentRegistry.get(b.type);
      if (Custom) return <Custom b={b} />;
      if (knownBlockTypes().includes(b.type)) return <div className="ds-pluginblock" dangerouslySetInnerHTML={raw(renderBlock(b, CTX))} />;
      return (
        <Wrap type={b.type} id={b.id}>
          <div className="ds-callout tone-warn">Unsupported block type: <code>{b.type}</code></div>
        </Wrap>
      );
    }
  }
};
