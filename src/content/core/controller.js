(() => {
  const BRO = (globalThis.BRO ??= {});
  const ADAPTER_TIMEOUT = 200;

  const range = (v) => {
    const s = v.seekable;
    if (s && s.length) return [s.start(0), s.end(s.length - 1)];
    if (Number.isFinite(v.duration)) return [0, v.duration];
    return [v.currentTime, v.currentTime];
  };

  const round2 = (n) => Math.round(n * 100) / 100;

  const nativeSeekBy = (v, sec) => {
    const from = v.currentTime;
    const [lo, hi] = range(v);
    const to = BRO.step.clampTime(from + sec, lo, hi);
    if (to !== from) v.currentTime = to;
    return { from, to };
  };

  const nativeVolumeBy = (v, delta) => {
    const volume = round2(Math.min(1, Math.max(0, v.volume + delta)));
    v.volume = volume;
    if (v.muted && delta > 0) v.muted = false;
    return { volume, muted: v.muted };
  };

  const nativeTogglePlay = async (v) => {
    if (v.paused || v.ended) {
      try {
        await v.play();
        return { paused: false };
      } catch (err) {
        return { paused: true, error: err && err.name };
      }
    }
    v.pause();
    return { paused: true };
  };

  const callAdapter = (v, adapter, op, arg) =>
    new Promise((resolve) => {
      const id = "b" + Math.random().toString(36).slice(2);
      let timer = 0;
      const done = (res) => {
        window.removeEventListener("brocode:res", onRes);
        clearTimeout(timer);
        if (v.getAttribute("data-brocode-target") === id)
          v.removeAttribute("data-brocode-target");
        resolve(res);
      };
      const onRes = (e) => {
        let d;
        try {
          d = JSON.parse(e.detail);
        } catch {
          return;
        }
        if (d && d.id === id) done(d);
      };
      v.setAttribute("data-brocode-target", id);
      window.addEventListener("brocode:res", onRes);
      timer = setTimeout(() => done(null), ADAPTER_TIMEOUT);
      window.dispatchEvent(
        new CustomEvent("brocode:cmd", {
          detail: JSON.stringify({ id, adapter, op, arg }),
        }),
      );
    });

  const forVideo = (v, adapter) => ({
    seekBy: (sec) => nativeSeekBy(v, sec),
    volumeBy: async (delta) => {
      if (adapter) {
        const res = await callAdapter(v, adapter, "volumeBy", delta);
        if (res && res.ok) return { volume: res.volume, muted: res.muted };
      }
      return nativeVolumeBy(v, delta);
    },
    togglePlay: () => nativeTogglePlay(v),
  });

  BRO.controller = { forVideo, range };
})();
