(() => {
  const BRO = (globalThis.BRO ??= {});
  const D = BRO.defaults;

  const seconds = (settings, duration, direction) => {
    if (settings.mode === 2) return D.mode2Step;
    if (settings.mode === 3) return direction > 0 ? settings.custom.fwd : settings.custom.back;
    if (!Number.isFinite(duration) || duration <= 0) return D.liveStep;
    for (const row of D.mode1Table) {
      if (duration < row.below) return row.step;
    }
    return D.liveStep;
  };

  const clampTime = (t, lo, hi) => Math.min(hi, Math.max(lo, t));

  BRO.step = { seconds, clampTime };
})();
