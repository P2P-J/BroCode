(() => {
  const BRO = globalThis.BRO;
  const store = chrome.storage.sync;
  const $ = (id) => document.getElementById(id);
  const t = (key, subs) => chrome.i18n.getMessage(key, subs) || '';
  let settings = BRO.settings.normalize(null);
  let site = BRO.settings.normalizeSite(null);
  let host = null;
  let savedTimer = 0;

  const localize = () => {
    document.documentElement.lang = chrome.i18n.getUILanguage();
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    document.title = t('brandName');
  };

  const flashSaved = () => {
    const el = $('saved');
    el.classList.add('show');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => el.classList.remove('show'), 900);
  };

  const render = () => {
    $('hotkeys').checked = site.hotkeys;
    $('uiClean').checked = site.uiClean;
    for (const r of document.querySelectorAll('input[name="mode"]')) r.checked = Number(r.value) === settings.mode;
    $('custom').hidden = settings.mode !== 3;
    $('fwd').value = settings.custom.fwd;
    $('back').value = settings.custom.back;
    $('volumeStep').value = Math.round(settings.volumeStep * 100);
  };

  const saveSettings = async () => {
    settings = BRO.settings.normalize(settings);
    await BRO.settings.saveSettings(store, settings);
    render();
    flashSaved();
  };

  const saveSite = async () => {
    if (!host) return;
    await BRO.settings.saveSite(store, host, site);
    flashSaved();
  };

  const bind = () => {
    $('hotkeys').addEventListener('change', (e) => {
      site.hotkeys = e.target.checked;
      saveSite();
    });
    $('uiClean').addEventListener('change', (e) => {
      site.uiClean = e.target.checked;
      saveSite();
    });
    for (const r of document.querySelectorAll('input[name="mode"]')) {
      r.addEventListener('change', () => {
        settings.mode = Number(r.value);
        saveSettings();
      });
    }
    $('fwd').addEventListener('change', (e) => {
      settings.custom.fwd = e.target.value;
      saveSettings();
    });
    $('back').addEventListener('change', (e) => {
      settings.custom.back = e.target.value;
      saveSettings();
    });
    $('volumeStep').addEventListener('change', (e) => {
      settings.volumeStep = Number(e.target.value) / 100;
      saveSettings();
    });
  };

  const showDetected = async (tabId) => {
    const el = $('detected');
    let info = null;
    try {
      info = await chrome.runtime.sendMessage({ type: 'popup:info', tabId });
    } catch {}
    if (!info || !info.videoCount) {
      el.textContent = t('popupNoVideo');
      return;
    }
    const players = info.presets.length ? info.presets.join(', ') : t('popupGenericPlayer');
    el.textContent = t('popupDetected', [players, String(info.videoCount)]);
  };

  const unsupportedHost = (url) => /^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)/.test(url || '');

  const init = async () => {
    localize();
    let tab = null;
    try {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    } catch {}
    const url = tab && tab.url;
    host = unsupportedHost(url) ? null : BRO.host.fromUrl(url || '');
    const loaded = await BRO.settings.load(store, host);
    settings = loaded.settings;
    site = loaded.site;
    $('host').textContent = host === 'file' ? 'file://' : host || '—';
    $('unsupported').hidden = !!host;
    $('siteControls').hidden = !host;
    render();
    bind();
    if (host && tab) showDetected(tab.id);
  };

  init();
})();
