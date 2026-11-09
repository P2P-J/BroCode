(() => {
  const BRO = (globalThis.BRO ??= {});
  BRO.defaults = Object.freeze({
    SETTINGS_KEY: 'settings',
    SITE_PREFIX: 'site:',
    VERSION: 1,
    settings: Object.freeze({ mode: 1, custom: Object.freeze({ fwd: 10, back: 10 }), volumeStep: 0.05 }),
    site: Object.freeze({ uiClean: true, hotkeys: true }),
    modes: Object.freeze([1, 2, 3]),
    mode1Table: Object.freeze([
      Object.freeze({ below: 20 * 60, step: 10 }),
      Object.freeze({ below: 60 * 60, step: 15 }),
      Object.freeze({ below: Infinity, step: 30 })
    ]),
    mode2Step: 15,
    liveStep: 10,
    customMin: 1,
    customMax: 600,
    volumeStepMin: 0.01,
    volumeStepMax: 0.25
  });
})();
