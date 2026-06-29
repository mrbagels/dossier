---
title: "Implementation Packet: Search Filter"
slug: "implementation-packet"
status: "review"
updated: "2026-06-29"
---
# A code editing handoff that agents can actually consume

This example shows the process Dossier shape for coding work: work items, editable snippets, patch proposals, diff review, verification receipts, trust claims, and closeout.

## Work plan

### Persist selected filter (proposed)

Save the active search filter in the URL query so refresh and share links preserve state.

- **Owner:** agent
- **Priority:** P1
- **Files:** src/search/filter-state.ts, src/search/SearchPanel.tsx
- **Verification:** npm test, npx tsc --noEmit

### Improve empty results state (proposed)

Show the active filter and a clear reset action when no results match.

- **Owner:** agent
- **Priority:** P2
- **Files:** src/search/SearchResults.tsx


## Editable helper proposal

`dossier serve` enhances this textarea with CodeMirror 6 while Dossier still exports plain `dossier.edits/v1`.

```ts
export function readFilter(search: string): string {
  const params = new URLSearchParams(search);
  return params.get("filter") || "all";
}

export function writeFilter(search: string, filter: string): string {
  const params = new URLSearchParams(search);
  if (filter === "all") params.delete("filter");
  else params.set("filter", filter);
  return params.toString();
}

```


## Proposed patches

A patch set groups intent, touched files, risk, verification, and optional unified diffs.

### Persist filter in query string

Add a small helper and wire the search panel to update the URL.

- **Operation:** add
- **Status:** proposed
- **Risk:** low
- **Files:** src/search/filter-state.ts, src/search/SearchPanel.tsx
- **Work items:** filter-state
- **Verification:** npm test, npx tsc --noEmit

```diff
diff --git a/src/search/filter-state.ts b/src/search/filter-state.ts
new file mode 100644
--- /dev/null
+++ b/src/search/filter-state.ts
@@ -0,0 +1,4 @@
+export function readFilter(search: string): string {
+  const params = new URLSearchParams(search);
+  return params.get("filter") || "all";
+}
```



## Standalone diff review

Diff review packets can capture file-level and hunk-level comments.

src/search/SearchResults.tsx (+1/-1)

```diff
diff --git a/src/search/SearchResults.tsx b/src/search/SearchResults.tsx
--- a/src/search/SearchResults.tsx
+++ b/src/search/SearchResults.tsx
@@ -8,6 +8,7 @@ export function SearchResults({ results, filter }) {
   if (!results.length) {
+    return <EmptyResults activeFilter={filter} />;
-    return <p>No results</p>;
   }
   return <ResultList results={results} />;
 }
```


## Verification plan

### Unit tests (planned)

```sh
npm test
```

- **Expected:** Filter helper and empty state tests pass.

### Typecheck (planned)

```sh
npx tsc --noEmit
```

- **Expected:** No TypeScript errors.


## Implementation trust

### Sources

- **work-plan:** Work plan (medium)
  Human-reviewed proposed work items.
- **verification:** Verification plan (pending)
  Commands still need to be run in the host repo.

### Claims

- **The packet contains enough information for an agent to start implementation.** (verified), confidence: medium
  - Sources: work-plan
- **The patch is not verified or merged until host commands pass.** (guardrail), confidence: high
  - Sources: verification
