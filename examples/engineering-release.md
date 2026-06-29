---
title: "Release Readiness: 0.5.4"
slug: "engineering-release"
status: "review"
updated: "2026-06-29"
---
# A release page that keeps gates, evidence, and claims together

Use this shape when a team needs public QA readiness, release notes, command receipts, and a durable closeout packet for agents.

## Release gates

- [x] Automated tests pass (required), npm test
- [x] React renderer typecheck passes (required), cd react && npx tsc --noEmit
- [x] README and examples regenerated (required), node bin/dossier.mjs build examples/*.dossier.json
- [ ] Manual browser pass complete (required), Run docs/product/public-manual-qa.md
- [ ] npm publish credential available, npm whoami if publishing to registry

## Command receipts

### Unit tests (passed)

```sh
npm test
```

- **Expected:** All node tests pass.
- **Actual:** Process, trust, export, and render tests passed.

### Example build (passed)

```sh
node bin/dossier.mjs build examples/*.dossier.json
```

- **Expected:** Every example emits HTML and Markdown.
- **Actual:** Generated showcase, overview, and focused example pages.


### Release assets

| Asset | Audience | Use |
| --- | --- | --- |
| README.md | New users | Install, choose examples, learn block and packet model. |
| examples/showcase.html | Evaluators | Inspect the full block catalog. |
| docs/product/public-manual-qa.md | Release reviewer | Run browser, live serve, MCP, and export checks. |
| schema/packets/trust.schema.json | Agents | Validate trust packets and recorded claims. |

## Release confidence

### Sources

- **tests:** Automated tests (high)
  Narrow verification for render, schema, MCP, and packets.
- **manual:** Manual QA guide (medium)
  Human browser pass still required before broad announcement.

### Claims

- **Release is ready for public manual QA.** (verified), confidence: high
  - Sources: tests, manual
  - Evidence: unit-tests, example-build
- **Registry publishing requires npm credentials.** (external), confidence: high
  - Sources: manual

## Release receipt

- **outcome:** Ready for public manual QA
- **owner:** Release captain
- **date:** 2026-06-29
- **Commands:** npm test, node bin/dossier.mjs build examples/*.dossier.json
- **Follow-ups:** Run public manual QA guide., Confirm Pages deployment after push.
