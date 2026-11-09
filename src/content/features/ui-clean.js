(() => {
  const BRO = (globalThis.BRO ??= {});
  const HOVER_EVENTS = ['mousemove', 'mouseenter', 'mouseover', 'pointermove', 'pointerenter', 'pointerover'];
  const MAX_SCAN = 600;
  const state = { enabled: false, site: {} };
  let styleEl = null;
  let unsubscribe = null;
  const touched = new Map();
  const lastScan = new WeakMap();
  const hoverRoots = new Set();
  const stripped = new Map();
  let found = [];

  const stop = (e) => e.stopImmediatePropagation();

  const presets = () => {
    const list = BRO.players.presets;
    const forced = state.site.presets;
    return Array.isArray(forced) ? list.filter((p) => forced.includes(p.id)) : list;
  };

  const scoped = (roots, sels) => {
    const out = [];
    for (const r of roots) for (const s of sels) out.push(r + ' ' + s);
    return out;
  };

  const buildCss = () => {
    const rules = [...BRO.players.nativeCss];
    const hide = [];
    const noBg = [];
    for (const p of presets()) {
      hide.push(...scoped(p.roots, p.hide));
      noBg.push(...scoped(p.roots, p.noBackground));
    }
    if (Array.isArray(state.site.hide)) hide.push(...state.site.hide);
    if (Array.isArray(state.site.noBackground)) noBg.push(...state.site.noBackground);
    if (hide.length) rules.push(hide.join(',\n') + ' { display: none !important; }');
    if (noBg.length) rules.push(noBg.join(',\n') + ' { background: none !important; background-image: none !important; }');
    return rules.join('\n');
  };

  const injectStyle = () => {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'brocode-ui-clean';
    }
    const css = buildCss();
    if (styleEl.textContent !== css) styleEl.textContent = css;
    const parent = document.head || document.documentElement;
    if (parent && styleEl.parentNode !== parent) parent.appendChild(styleEl);
  };

  const containerOf = (video) => {
    const vr = video.getBoundingClientRect();
    let best = video.parentElement;
    let n = video.parentElement;
    for (let i = 0; n && i < 6; i++, n = n.parentElement) {
      const r = n.getBoundingClientRect();
      if (r.width > vr.width * 1.3 + 4 || r.height > vr.height * 1.3 + 4) break;
      best = n;
    }
    return best;
  };

  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  const stripGradients = (video) => {
    const vr = video.getBoundingClientRect();
    if (vr.width < 160 || vr.height < 90) return;
    const now = performance.now();
    if (lastScan.has(video) && now - lastScan.get(video) < 2000) return;
    lastScan.set(video, now);
    const container = containerOf(video);
    if (!container) return;
    const els = container.querySelectorAll('*');
    const n = Math.min(els.length, MAX_SCAN);
    for (let i = 0; i < n; i++) {
      const el = els[i];
      if (el === video || touched.has(el) || el.tagName === 'BROCODE-OSD') continue;
      const cs = getComputedStyle(el);
      if (cs.position !== 'absolute' && cs.position !== 'fixed') continue;
      if (!cs.backgroundImage.includes('gradient')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < vr.width * 0.5 || !overlaps(r, vr)) continue;
      touched.set(el, [el.style.getPropertyValue('background-image'), el.style.getPropertyPriority('background-image')]);
      el.style.setProperty('background-image', 'none', 'important');
    }
  };

  const restoreGradients = () => {
    for (const [el, [value, priority]] of touched) {
      if (value) el.style.setProperty('background-image', value, priority);
      else el.style.removeProperty('background-image');
    }
    touched.clear();
  };

  const watchControls = (video) => {
    if (stripped.has(video)) return;
    const had = video.hasAttribute('controls');
    video.removeAttribute('controls');
    const obs = new MutationObserver(() => {
      if (video.hasAttribute('controls')) video.removeAttribute('controls');
    });
    obs.observe(video, { attributes: true, attributeFilter: ['controls'] });
    stripped.set(video, { obs, had });
  };

  const restoreControls = () => {
    for (const [video, { obs, had }] of stripped) {
      obs.disconnect();
      if (had) video.setAttribute('controls', '');
    }
    stripped.clear();
  };

  const unbindHover = () => {
    for (const root of hoverRoots) {
      for (const t of HOVER_EVENTS) root.removeEventListener(t, stop, true);
    }
    hoverRoots.clear();
  };

  const scan = () => {
    if (!state.enabled) return;
    injectStyle();
    const ids = [];
    for (const p of presets()) {
      const sel = p.roots.join(',');
      const roots = document.querySelectorAll(sel);
      if (!roots.length) continue;
      ids.push(p.name);
      for (const root of roots) {
        if ((p.blockHover || state.site.blockHover) && !hoverRoots.has(root)) {
          for (const t of HOVER_EVENTS) root.addEventListener(t, stop, true);
          hoverRoots.add(root);
        }
        if (p.stripControls || state.site.stripControls) {
          for (const v of root.querySelectorAll('video')) watchControls(v);
        }
      }
    }
    if (state.site.stripControls) {
      for (const v of BRO.videoFinder.all()) watchControls(v);
    }
    if (state.site.heuristic !== false) {
      for (const v of BRO.videoFinder.all()) stripGradients(v);
    }
    found = ids;
  };

  const enable = () => {
    scan();
    if (!unsubscribe) unsubscribe = BRO.watch.subscribe(scan);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, { once: true });
    window.addEventListener('loadedmetadata', BRO.watch.schedule, true);
  };

  const disable = () => {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    window.removeEventListener('loadedmetadata', BRO.watch.schedule, true);
    if (styleEl) styleEl.remove();
    restoreGradients();
    restoreControls();
    unbindHover();
  };

  const configure = (opts) => {
    const was = state.enabled;
    Object.assign(state, opts);
    if (state.enabled) enable();
    else if (was) disable();
  };

  const detected = () => {
    if (state.enabled) return found;
    const ids = [];
    for (const p of presets()) {
      if (document.querySelector(p.roots.join(','))) ids.push(p.name);
    }
    return ids;
  };

  BRO.uiClean = { configure, detected, scan };
})();
