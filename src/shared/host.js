(() => {
  const BRO = (globalThis.BRO ??= {});

  const fromUrl = (url) => {
    let u;
    try {
      u = new URL(url);
    } catch {
      return null;
    }
    if (u.protocol === 'file:') return 'file';
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.replace(/^www\./, '').toLowerCase();
  };

  const matches = (host, pattern) => host === pattern || host.endsWith('.' + pattern);

  const lookup = (host, table) => {
    let best = null;
    let bestLen = -1;
    for (const pattern of Object.keys(table)) {
      if (matches(host, pattern) && pattern.length > bestLen) {
        best = table[pattern];
        bestLen = pattern.length;
      }
    }
    return best;
  };

  BRO.host = { fromUrl, matches, lookup };
})();
