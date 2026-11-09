(() => {
  const BRO = (globalThis.BRO ??= {});
  const ACTIVE_MS = 10 * 60 * 1000;
  let myFrameId = null;
  let frames = [];
  let interactedAt = 0;
  let lastSent = '';
  let timer = 0;

  const alive = () => {
    try {
      return !!chrome.runtime?.id;
    } catch {
      return false;
    }
  };

  const send = (msg) => {
    if (!alive()) return Promise.resolve(null);
    try {
      return chrome.runtime.sendMessage(msg).catch(() => null);
    } catch {
      return Promise.resolve(null);
    }
  };

  const snapshot = () => {
    const ranked = BRO.activeVideo.rank();
    const best = ranked[0];
    return {
      type: 'frame:state',
      hasVideo: ranked.length > 0,
      videoCount: ranked.length,
      playing: ranked.some((r) => r.playing),
      score: best ? best.score : 0,
      interactedAt,
      presets: BRO.uiClean ? BRO.uiClean.detected() : []
    };
  };

  const report = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const s = snapshot();
      const key = JSON.stringify(s);
      if (key === lastSent) return;
      if (!s.hasVideo && !lastSent && window !== window.top) return;
      lastSent = key;
      const res = await send(s);
      if (res && typeof res.frameId === 'number') myFrameId = res.frameId;
    }, 300);
  };

  const noteInteraction = (e) => {
    const ranked = BRO.activeVideo.rank();
    const hit = ranked.some((r) => {
      const b = r.video.getBoundingClientRect();
      return e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
    });
    if (hit) {
      interactedAt = Date.now();
      report();
    }
  };

  const remoteTarget = () => {
    const now = Date.now();
    return frames.some((f) => f.frameId !== myFrameId && f.hasVideo && (f.playing || now - f.interactedAt < ACTIVE_MS));
  };

  const forward = (cmd) => send({ type: 'key:forward', cmd });

  const init = (onExec) => {
    for (const type of ['play', 'pause', 'loadedmetadata', 'emptied', 'ended']) {
      window.addEventListener(type, report, true);
    }
    window.addEventListener('pagehide', () => {
      lastSent = '';
      send({ type: 'frame:gone' });
    });
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) report();
    });
    BRO.watch.subscribe(report);
    if (!alive()) return;
    chrome.runtime.onMessage.addListener((msg) => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'tab:frames') frames = Array.isArray(msg.frames) ? msg.frames : [];
      if (msg.type === 'key:exec') onExec(msg.cmd);
    });
    report();
  };

  BRO.frames = { init, report, forward, remoteTarget, noteInteraction };
})();
