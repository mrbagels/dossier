---
title: "Market Scan: AI Documentation Tools"
slug: "research-brief"
status: "review"
updated: "2026-06-29"
---
# A source-backed brief an agent can update safely

Use Dossier for research synthesis, competitive scans, vendor comparisons, or decision support. The important part is not just prose, it is claims tied to sources, assumptions, and next verification steps.

### What changed

Teams want docs that double as stateful workflows for agents.

### What to verify

Pricing, licensing, and current hosted editor integrations should be checked against official sources.

### What to decide

Pick whether this artifact is a handoff, a decision record, or a living operating surface.


### Format comparison

| Option | Readable | Agent state | Offline | Reviewable |
| --- | --- | --- | --- | --- |
| Dossier | High | High | High | High |
| Markdown file | High | Low | High | Medium |
| Chat transcript | Medium | Low | Low | Low |
| Docs CMS page | High | Medium | Medium | Medium |

### Assumptions & open questions

- (assumption/verified) Research briefs are more reusable when claims are structured separately from prose.
- (risk/open) Pricing and vendor claims require a fresh source check before publication.

## Claim ledger

### Sources

- **repo:** Dossier repository (high)
  Source, examples, schemas, and package metadata.
- **examples:** Example gallery (medium)
  Local examples demonstrate multiple use cases.

### Claims

- **A dossier can package prose, tables, charts, claims, and packet state in one file.** (verified), confidence: high
  - Sources: repo, examples
- **Public market or pricing statements should be rechecked before publication.** (policy), confidence: high
  - Sources: repo

## Research workflow

1. **Gather**, Collect official docs, changelogs, repos, and source URLs.
2. **Separate**, Keep observations, assumptions, and claims in different blocks.
3. **Decide**, Use the matrix and risk register to make tradeoffs explicit.
4. **Refresh**, Agents update only stale claims and preserve prior evidence.

### Research risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Stale vendor information | medium | high | Use official sources and record retrieval dates. |
| Unclear confidence | medium | medium | Use trust-report status and confidence per claim. |


### Source queue

| Source | Signal | Use |
| --- | --- | --- |
| Repository | Primary source | Confirm schema, examples, and release notes. |
| Manual QA guide | Release confidence | Check public-readiness gates. |
