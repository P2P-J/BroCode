(() => {
  const BRO = (globalThis.BRO ??= {});
  const pointer = { x: -1, y: -1, t: 0, down: 0 };
  let lastMove = 0;

  const record = (e, isDown) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.t = Date.now();
    if (isDown) pointer.down = pointer.t;
  };

  window.addEventListener('pointerdown', (e) => {
    record(e, true);
    BRO.frames?.noteInteraction(e);
  }, { capture: true, passive: true });

  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastMove < 200) return;
    lastMove = now;
    record(e, false);
  }, { capture: true, passive: true });

  const viewport = () => ({ w: window.innerWidth || 1, h: window.innerHeight || 1 });

  const visibleRatio = (r) => {
    const { w, h } = viewport();
    const ix = Math.max(0, Math.min(r.right, w) - Math.max(r.left, 0));
    const iy = Math.max(0, Math.min(r.bottom, h) - Math.max(r.top, 0));
    return (ix * iy) / (w * h);
  };

  const inside = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

  const evaluate = (v) => {
    if (!v.isConnected) return null;
    if (v.readyState === 0 && !v.currentSrc && !v.src) return null;
    const r = v.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    const cs = getComputedStyle(v);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const fs = document.fullscreenElement;
    const inFullscreen = !!fs && BRO.videoFinder.composedContains(fs, v);
    const vis = visibleRatio(r);
    const playing = !v.paused && !v.ended;
    let score = vis * 10;
    if (playing) score += 20;
    if (pointer.t && Date.now() - pointer.t < 600000 && inside(r, pointer.x, pointer.y)) score += 30;
    if (inFullscreen) score += 50;
    return { video: v, score, visible: vis > 0 || inFullscreen, playing };
  };

  const rank = () => {
    const out = [];
    for (const v of BRO.videoFinder.all()) {
      const e = evaluate(v);
      if (e) out.push(e);
    }
    out.sort((a, b) => b.score - a.score);
    return out;
  };

  const pick = (opts = {}) => {
    const ranked = rank();
    const best = ranked[0];
    if (!best) return null;
    if (opts.any) return best;
    return best.score > 0 ? best : null;
  };

  BRO.activeVideo = { pick, rank, pointer };
})();
