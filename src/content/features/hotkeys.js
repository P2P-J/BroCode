(() => {
  const BRO = (globalThis.BRO ??= {});
  const state = { enabled: false, settings: null, keys: BRO.keys.ALL, adapter: null };
  const swallowed = new Set();

  const msg = (key, subs) => {
    try {
      return chrome.i18n.getMessage(key, subs) || key;
    } catch {
      return key;
    }
  };

  const deepActive = () => {
    let a = document.activeElement;
    for (let i = 0; a && i < 10; i++) {
      const sr = BRO.videoFinder.shadowOf(a);
      if (!sr || !sr.activeElement) break;
      a = sr.activeElement;
    }
    return a;
  };

  const editableTarget = (e) => {
    const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
    const t = path[0] || e.target;
    return BRO.keys.isEditable(t) || BRO.keys.isEditable(deepActive());
  };

  const seek = (video, dir) => {
    const sec = BRO.step.seconds(state.settings, video.duration, dir);
    const ctl = BRO.controller.forVideo(video, state.adapter);
    BRO.seekGuard.arm(video);
    const result = ctl.seekBy(dir * sec);
    BRO.osd.show(video, (dir > 0 ? '+' : '−') + sec + 's');
    BRO.seekGuard.verify(video, result).then((res) => {
      if (res !== 'retry') return res;
      BRO.seekGuard.arm(video);
      video.currentTime = result.to;
      return BRO.seekGuard.verify(video, result);
    }).then((res) => {
      if (res === 'blocked') BRO.osd.show(video, msg('osdBlocked'), { warn: true });
    });
  };

  const volume = async (video, dir) => {
    const ctl = BRO.controller.forVideo(video, state.adapter);
    const r = await ctl.volumeBy(dir * state.settings.volumeStep);
    BRO.osd.show(video, r.muted ? msg('osdMuted') : msg('osdVolume', [String(Math.round(r.volume * 100))]));
  };

  const toggle = async (video) => {
    const ctl = BRO.controller.forVideo(video, state.adapter);
    const r = await ctl.togglePlay();
    if (r.error) BRO.osd.show(video, msg('osdPlayBlocked'), { warn: true });
    else BRO.osd.show(video, r.paused ? '❚❚' : '▶');
  };

  const run = (cmd, video) => {
    if (cmd === 'seekForward') return seek(video, 1);
    if (cmd === 'seekBack') return seek(video, -1);
    if (cmd === 'volumeUp') return volume(video, 1);
    if (cmd === 'volumeDown') return volume(video, -1);
    if (cmd === 'togglePlay') return toggle(video);
  };

  const exec = (cmd) => {
    if (!state.enabled || !BRO.keys.ALL.includes(cmd)) return;
    const pick = BRO.activeVideo.pick({ any: true });
    if (pick) run(cmd, pick.video);
  };

  const onKeyDown = (e) => {
    if (!state.enabled || !e.isTrusted) return;
    const cmd = BRO.keys.command(e, state.keys);
    if (!cmd || editableTarget(e)) return;
    const pick = BRO.activeVideo.pick();
    const local = pick && (cmd !== 'togglePlay' || pick.visible) ? pick.video : null;
    if (!local && !BRO.frames.remoteTarget()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    swallowed.add(e.code || e.key);
    if (e.repeat && cmd === 'togglePlay') return;
    if (local) run(cmd, local);
    else BRO.frames.forward(cmd);
  };

  const onKeyUp = (e) => {
    const k = e.code || e.key;
    if (!swallowed.has(k)) return;
    if (e.type === 'keyup') swallowed.delete(k);
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  const init = () => {
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keypress', onKeyUp, true);
    window.addEventListener('keyup', onKeyUp, true);
  };

  const configure = (opts) => {
    Object.assign(state, opts);
    if (!state.enabled) swallowed.clear();
  };

  BRO.hotkeys = { init, configure, exec };
})();
