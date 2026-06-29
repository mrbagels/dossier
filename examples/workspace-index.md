---
title: "Dossier Examples Workspace"
slug: "workspace-index"
status: "generated"
updated: "2026-06-29T00:00:00.000Z"
---
# Dossier Examples Workspace

Gallery workspace for the built-in examples, process packets, release evidence, and agent-readable handoff surfaces.

**7** Dossiers · **5** Open process · **1** Release gaps · **4** Trust gaps · **2** Missing links

## Workspace readiness

- [x] All workspace dossiers validate (required), 0 invalid dossier(s)
- [ ] No open process items (required), 5 open item(s)
- [ ] Required release gates passed (required), 1 open gate(s)
- [ ] Trust claims verified (required), 4 trust gap(s)
- [ ] Cross-document links resolve, 2 missing link(s)

## Agent work queue

### Dossier, capabilities showcase: Extract a work item (proposed)

Use verdicts and notes to steer actual implementation work.

- **Owner:** agent
- **Priority:** P1
- **Verdict:** undecided
- **Files:** showcase.dossier.json

### Implementation Packet: Search Filter: Persist selected filter (proposed)

Save the active search filter in the URL query so refresh and share links preserve state.

- **Owner:** agent
- **Priority:** P1
- **Verdict:** undecided
- **Files:** implementation-packet.dossier.json

### Implementation Packet: Search Filter: Improve empty results state (proposed)

Show the active filter and a clear reset action when no results match.

- **Owner:** agent
- **Priority:** P2
- **Verdict:** undecided
- **Files:** implementation-packet.dossier.json

### Incident Response: API Latency: Add upstream backpressure (proposed)

Limit retry bursts when the search provider slows down.

- **Owner:** API team
- **Priority:** P1
- **Verdict:** undecided
- **Files:** incident-response.dossier.json

### Incident Response: API Latency: Annotate incident dashboard (proposed)

Mark the mitigation window so later analysis is clear.

- **Owner:** SRE
- **Priority:** P2
- **Verdict:** undecided
- **Files:** incident-response.dossier.json

### Release Readiness: 0.5.5: Manual browser pass complete (todo)

Run docs/product/public-manual-qa.md

- **Owner:** Release captain
- **Priority:** P1
- **Verdict:** block
- **Files:** engineering-release.dossier.json

### Dossier, capabilities showcase: The feature set is ready for public manual QA. (partial)

Trust report

- **Owner:** Kyle
- **Priority:** P2
- **Verdict:** revise
- **Files:** showcase.dossier.json

### Implementation Packet: Search Filter: The patch is not verified or merged until host commands pass. (guardrail)

Implementation trust

- **Owner:** Engineering
- **Priority:** P2
- **Verdict:** revise
- **Files:** implementation-packet.dossier.json

### Market Scan: AI Documentation Tools: Public market or pricing statements should be rechecked before publication. (policy)

Claim ledger

- **Owner:** Research team
- **Priority:** P2
- **Verdict:** revise
- **Files:** research-brief.dossier.json

### Release Readiness: 0.5.5: Registry publishing requires npm credentials. (external)

Release confidence

- **Owner:** Release captain
- **Priority:** P2
- **Verdict:** revise
- **Files:** engineering-release.dossier.json

### Dossier, System Overview: missing [[dossier-model]] (open)

Cross-document link does not resolve in this workspace.

- **Owner:** Kyle
- **Priority:** P2
- **Verdict:** revise
- **Files:** sample.dossier.json

### Dossier, System Overview: missing [[slug]] (open)

Cross-document link does not resolve in this workspace.

- **Owner:** Kyle
- **Priority:** P2
- **Verdict:** revise
- **Files:** sample.dossier.json


### Workspace dossiers

| Title | Kind | Status | Tags | Updated | Open process | Release gaps | Trust gaps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [[showcase]] | dossier | durable | demo, blocks | 2026-06-29 | 1 | 0 | 1 |
| [[dossier-overview]] | dossier | ready | docs, tooling, design-system | 2026-06-29 | 0 | 0 | 0 |
| [[implementation-packet]] | implementation | review | example, implementation, agent | 2026-06-29 | 2 | 0 | 1 |
| [[incident-response]] | incident | review | example, incident, operations | 2026-06-29 | 2 | 0 | 0 |
| [[research-brief]] | research | review | example, research, trust | 2026-06-29 | 0 | 0 | 1 |
| [[product-launch]] | reader | durable | example, product, marketing | 2026-06-29 | 0 | 0 | 0 |
| [[engineering-release]] | release | review | example, release, qa | 2026-06-29 | 0 | 1 | 1 |

## Required release gaps

- [ ] Release Readiness: 0.5.5: Manual browser pass complete (required), Run docs/product/public-manual-qa.md

## Trust gaps

Claims that still need verification before downstream agents should rely on them.

### Sources

- **doc-showcase:** Dossier, capabilities showcase (medium)
  showcase.dossier.json
- **doc-dossier-overview:** Dossier, System Overview (medium)
  sample.dossier.json
- **doc-implementation-packet:** Implementation Packet: Search Filter (medium)
  implementation-packet.dossier.json
- **doc-incident-response:** Incident Response: API Latency (medium)
  incident-response.dossier.json
- **doc-research-brief:** Market Scan: AI Documentation Tools (medium)
  research-brief.dossier.json
- **doc-product-launch:** Northstar Notes Launch (medium)
  product-launch.dossier.json
- **doc-engineering-release:** Release Readiness: 0.5.5 (medium)
  engineering-release.dossier.json

### Claims

- **Dossier, capabilities showcase: The feature set is ready for public manual QA.** (partial), confidence: medium
  - Sources: doc-showcase
- **Implementation Packet: Search Filter: The patch is not verified or merged until host commands pass.** (guardrail), confidence: high
  - Sources: doc-implementation-packet
- **Market Scan: AI Documentation Tools: Public market or pricing statements should be rechecked before publication.** (policy), confidence: high
  - Sources: doc-research-brief
- **Release Readiness: 0.5.5: Registry publishing requires npm credentials.** (external), confidence: high
  - Sources: doc-engineering-release

### Missing cross-links

| Document | Missing slug |
| --- | --- |
| [[dossier-overview]] | dossier-model |
| [[dossier-overview]] | slug |

## Workspace scan receipt

- **outcome:** needs-attention
- **owner:** dossier workspace
- **Changed files:** showcase.dossier.json, sample.dossier.json, implementation-packet.dossier.json, incident-response.dossier.json, research-brief.dossier.json, product-launch.dossier.json, engineering-release.dossier.json
- **Commands:** dossier workspace index
