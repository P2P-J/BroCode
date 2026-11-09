const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const BRO = load('shared/defaults.js', 'shared/settings.js');

test('normalize fills defaults for empty input', () => {
  const st = BRO.settings.normalize(undefined);
  assert.deepEqual(st, { v: 1, mode: 1, custom: { fwd: 10, back: 10 }, volumeStep: 0.05 });
});

test('normalize rejects invalid mode', () => {
  assert.equal(BRO.settings.normalize({ mode: 9 }).mode, 1);
  assert.equal(BRO.settings.normalize({ mode: '2' }).mode, 2);
});

test('normalize clamps custom seconds to 1..600 and rounds', () => {
  const st = BRO.settings.normalize({ custom: { fwd: 0, back: 9999 } });
  assert.equal(st.custom.fwd, 1);
  assert.equal(st.custom.back, 600);
  assert.equal(BRO.settings.normalize({ custom: { fwd: 4.6, back: 'x' } }).custom.fwd, 5);
  assert.equal(BRO.settings.normalize({ custom: { fwd: 4.6, back: 'x' } }).custom.back, 10);
});

test('normalize clamps volume step to 0.01..0.25', () => {
  assert.equal(BRO.settings.normalize({ volumeStep: 0 }).volumeStep, 0.01);
  assert.equal(BRO.settings.normalize({ volumeStep: 1 }).volumeStep, 0.25);
  assert.equal(BRO.settings.normalize({ volumeStep: 0.1 }).volumeStep, 0.1);
});

test('normalizeSite defaults both features on', () => {
  assert.deepEqual(BRO.settings.normalizeSite(undefined), { uiClean: true, hotkeys: true });
  assert.deepEqual(BRO.settings.normalizeSite({ uiClean: false }), { uiClean: false, hotkeys: true });
});

test('siteKey prefixes host', () => {
  assert.equal(BRO.settings.siteKey('youtube.com'), 'site:youtube.com');
});
