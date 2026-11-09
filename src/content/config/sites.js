(() => {
  const BRO = (globalThis.BRO ??= {});

  BRO.sites = {
    'youtube.com': { adapter: 'youtube' },
    'youtube-nocookie.com': { adapter: 'youtube' }
  };
})();
