(() => {
  const BRO = (globalThis.BRO ??= {});
  const WINDOW_MS = 700;
  const guarded = new WeakSet();
  const seq = new WeakMap();
  let active = null;

  const block = (e) => {
    if (active && e.target === active.video && performance.now() < active.until) {
      e.stopImmediatePropagation();
    }
  };

  window.addEventListener('seeking', block, true);
  window.addEventListener('seeked', block, true);

  const arm = (video) => {
    if (guarded.has(video)) active = { video, until: performance.now() + WINDOW_MS };
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const verify = async (video, result) => {
    if (!result || result.to === result.from) return 'ok';
    const token = (seq.get(video) || 0) + 1;
    seq.set(video, token);
    const startedAt = performance.now();
    await sleep(350);
    for (let i = 0; i < 6 && video.seeking; i++) await sleep(250);
    if (seq.get(video) !== token) return 'stale';
    const elapsed = (performance.now() - startedAt) / 1000;
    const drift = video.paused ? 0 : elapsed * (video.playbackRate || 1);
    const ok = Math.abs(video.currentTime - result.to) <= 1.5 + drift;
    if (ok) return 'ok';
    if (!guarded.has(video)) {
      guarded.add(video);
      return 'retry';
    }
    return 'blocked';
  };

  BRO.seekGuard = { arm, verify, isGuarded: (v) => guarded.has(v) };
})();
