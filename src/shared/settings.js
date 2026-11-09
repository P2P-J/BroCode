(() => {
  const BRO = (globalThis.BRO ??= {});
  const D = BRO.defaults;

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  const seconds = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return clamp(Math.round(n), D.customMin, D.customMax);
  };

  const normalize = (raw) => {
    const r = raw && typeof raw === 'object' ? raw : {};
    const mode = Number(r.mode);
    const custom = r.custom && typeof r.custom === 'object' ? r.custom : {};
    const vol = Number(r.volumeStep);
    return {
      v: D.VERSION,
      mode: D.modes.includes(mode) ? mode : D.settings.mode,
      custom: {
        fwd: seconds(custom.fwd, D.settings.custom.fwd),
        back: seconds(custom.back, D.settings.custom.back)
      },
      volumeStep: Number.isFinite(vol)
        ? Math.round(clamp(vol, D.volumeStepMin, D.volumeStepMax) * 100) / 100
        : D.settings.volumeStep
    };
  };

  const normalizeSite = (raw) => {
    const r = raw && typeof raw === 'object' ? raw : {};
    return {
      uiClean: typeof r.uiClean === 'boolean' ? r.uiClean : D.site.uiClean,
      hotkeys: typeof r.hotkeys === 'boolean' ? r.hotkeys : D.site.hotkeys
    };
  };

  const siteKey = (host) => D.SITE_PREFIX + host;

  const load = async (storage, host) => {
    const keys = [D.SETTINGS_KEY];
    if (host) keys.push(siteKey(host));
    const data = await storage.get(keys);
    return {
      settings: normalize(data[D.SETTINGS_KEY]),
      site: normalizeSite(host ? data[siteKey(host)] : undefined)
    };
  };

  const saveSettings = (storage, value) => storage.set({ [D.SETTINGS_KEY]: normalize(value) });

  const saveSite = (storage, host, value) => storage.set({ [siteKey(host)]: normalizeSite(value) });

  BRO.settings = { normalize, normalizeSite, siteKey, load, saveSettings, saveSite };
})();
