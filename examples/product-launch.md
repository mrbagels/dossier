---
title: "Northstar Notes Launch"
slug: "product-launch"
status: "durable"
updated: "2026-06-29"
---
# A calm product page that still carries structured launch state

Use Dossier as a product microsite, feature brief, or launch packet. The page reads like a public launch note, but agents can still inspect the embedded model, claims, and release gates.


### Public-facing

Hero, feature cards, social proof, FAQ, and a restrained visual system.

### Agent-readable

Release gates, source-backed claims, and next steps stay embedded for follow-up work.

### Easy to host

Drop the generated HTML into GitHub Pages, a docs site, or an iframe.


## Launch shape

A product page can mix human copy with operational launch state.

**3** Launch audiences · **6** Beta workflows · **0** Runtime assets · **1** File to publish

### Reader path

1. **Scan**, Understand the product promise from the hero and cards.
2. **Compare**, Use tables and FAQs to answer adoption questions.
3. **Trust**, Review source-backed claims and readiness gates.
4. **Act**, Send the generated page to users, reviewers, or agents.


### Feature snapshot

| Feature | Why it matters | Launch status |
| --- | --- | --- |
| Offline page | Sales, support, and partners can open the artifact anywhere. | Ready |
| Embedded model | Agents can inspect the same source humans approved. | Ready |
| Trust report | Claims stay tied to sources and evidence. | Ready |
| Export menu | Readers can download Markdown, JSON, or a digest. | Ready |

## Launch claims

Claims that appear in the page can be grounded in sources and evidence.

### Sources

- **build:** Local build (high)
  The example was generated with the Dossier CLI.
- **model:** Embedded model (high)
  The source model ships inside the generated HTML.

### Claims

- **The launch page is a self-contained HTML artifact.** (verified), confidence: high
  - Sources: build, model
- **Agents can recover the structured model without DOM scraping.** (verified), confidence: high
  - Sources: model

### Launch FAQ

**Can this replace a marketing site?**

Use it for focused launches, product briefs, internal enablement, or campaign pages. Keep a full CMS for long-lived marketing operations.

**Can the same model drive follow-up work?**

Yes. Agents can read the model, trust report, release gates, and notes through export packets or MCP.

