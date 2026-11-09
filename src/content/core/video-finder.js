(() => {
  const BRO = (globalThis.BRO ??= {});
  const TTL = 1500;
  const EMPTY_TTL = 300;
  const MAX_DEPTH = 8;
  let cache = null;
  let cacheAt = 0;

  const shadowOf = (el) => {
    try {
      if (globalThis.chrome?.dom?.openOrClosedShadowRoot) return chrome.dom.openOrClosedShadowRoot(el);
    } catch {}
    return el.shadowRoot || null;
  };

  const collect = (root, out, depth) => {
    for (const v of root.querySelectorAll('video')) out.push(v);
    if (depth >= MAX_DEPTH) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.tagName.includes('-') || n.shadowRoot) {
        const sr = shadowOf(n);
        if (sr) collect(sr, out, depth + 1);
      }
    }
  };

  const all = () => {
    const now = performance.now();
    if (cache && now - cacheAt < (cache.length ? TTL : EMPTY_TTL) && cache.every((v) => v.isConnected)) return cache;
    const out = [];
    if (document.documentElement) collect(document, out, 0);
    cache = out;
    cacheAt = now;
    return out;
  };

  const invalidate = () => {
    cache = null;
  };

  for (const type of ['loadedmetadata', 'play', 'emptied']) {
    window.addEventListener(type, invalidate, true);
  }
  document.addEventListener('DOMContentLoaded', invalidate, true);

  const composedContains = (ancestor, node) => {
    for (let n = node; n; n = n.parentNode || n.host) {
      if (n === ancestor) return true;
    }
    return false;
  };

  BRO.videoFinder = { all, invalidate, composedContains, shadowOf };
})();
