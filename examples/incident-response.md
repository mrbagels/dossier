---
title: "Incident Response: API Latency"
slug: "incident-response"
status: "review"
updated: "2026-06-29"
---
# A calm incident page for humans and agents

Use this shape during an incident or post-incident review. It keeps the timeline, evidence, decisions, mitigations, and follow-up work in one structured artifact.

### Incident timeline

- **09:12** (done), Latency alert fired for `/api/search` p95 above threshold.
- **09:18** (done), Traffic shifted away from the overloaded worker pool.
- **09:31** (done), Queue depth returned to normal range.
- **10:20** (planned), Follow-up patch queued for backpressure and dashboard annotation.

## Evidence

### Latency alert

- **kind:** monitor
- **source:** observability
- **trust:** high

p95 latency rose above the paging threshold for 7 minutes.

### Worker logs

- **kind:** log
- **source:** api workers
- **trust:** medium

Retries increased after the upstream search provider slowed down.

### Support sample

- **kind:** ticket
- **source:** support
- **trust:** medium

Three customers reported slow searches during the window.


## Decisions

- **Shift traffic to warm pool** (On-call): Mitigates customer impact without changing application code during the incident.
- **Defer index tuning** (Incident lead): The tuning path needs replay testing and is safer as a follow-up.

## Remediation work

### Add upstream backpressure (proposed)

Limit retry bursts when the search provider slows down.

- **Owner:** API team
- **Priority:** P1
- **Verification:** load test, synthetic monitor

### Annotate incident dashboard (proposed)

Mark the mitigation window so later analysis is clear.

- **Owner:** SRE
- **Priority:** P2


### Remaining risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Retry storm returns | medium | high | Ship backpressure and add a queue-depth alert. |
| Support misses affected customers | low | medium | Export affected-account list for support follow-up. |

## Closeout receipt

- **outcome:** Customer impact mitigated, follow-up work queued
- **owner:** Incident lead
- **date:** 2026-06-29
- **Follow-ups:** Approve remediation board., Attach load-test evidence after patch.
