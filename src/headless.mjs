// Lazy, optional headless browser (Playwright Chromium), shared by Mermaid diagram
// rendering and PDF export. Returns null when Playwright is unavailable so callers
// fall back gracefully. The browser is launched once and reused, then closed by the
// CLI when the run finishes (see closeBrowser).

let browserPromise = null;

export async function getBrowser() {
  if (browserPromise) return browserPromise;
  browserPromise = (async () => {
    try {
      const { chromium } = await import("playwright");
      return await chromium.launch();
    } catch {
      return null; // playwright not installed, or no browser available
    }
  })();
  return browserPromise;
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const p = browserPromise;
  browserPromise = null;
  try {
    const b = await p;
    if (b) await b.close();
  } catch {
    /* already gone */
  }
}
