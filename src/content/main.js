(() => {
  const BRO = globalThis.BRO;
  if (!BRO || BRO.started) return;
  BRO.started = true;

  const topHost = () => {
    if (window === window.top) return BRO.host.fromUrl(location.href);
    const ao = location.ancestorOrigins;
    if (ao && ao.length) return BRO.host.fromUrl(ao[ao.length - 1]);
    return null;
  };

  const ownHost = BRO.host.fromUrl(location.href) || '';
  const siteCfg = BRO.host.lookup(ownHost, BRO.sites) || {};
  const host = topHost();
  const siteKey = host ? BRO.settings.siteKey(host) : null;

  const apply = ({ settings, site }) => {
    BRO.hotkeys.configure({
      enabled: site.hotkeys,
      settings,
      keys: Array.isArray(siteCfg.keys) ? siteCfg.keys : BRO.keys.ALL,
      adapter: siteCfg.adapter || null
    });
    BRO.uiClean.configure({ enabled: site.uiClean, site: siteCfg });
    BRO.frames.report();
  };

  const reload = async () => {
    try {
      apply(await BRO.settings.load(chrome.storage.sync, host));
    } catch {}
  };

  BRO.hotkeys.init();
  BRO.frames.init(BRO.hotkeys.exec);
  reload();

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (changes[BRO.defaults.SETTINGS_KEY] || (siteKey && changes[siteKey])) reload();
    });
  } catch {}
})();
