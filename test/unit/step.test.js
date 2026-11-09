const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const BRO = load('shared/defaults.js', 'shared/settings.js', 'shared/step.js');
const s = (over) => BRO.settings.normalize(over);

test('mode 1 uses duration table', () => {
  const st = s({ mode: 1 });
  assert.equal(BRO.step.seconds(st, 60, 1), 10);
  assert.equal(BRO.step.seconds(st, 19 * 60 + 59, 1), 10);
  assert.equal(BRO.step.seconds(st, 20 * 60, 1), 15);
  assert.equal(BRO.step.seconds(st, 59 * 60, -1), 15);
  assert.equal(BRO.step.seconds(st, 60 * 60, 1), 30);
  assert.equal(BRO.step.seconds(st, 3 * 3600, -1), 30);
});

test('mode 1 falls back to live step for unknown duration', () => {
  const st = s({ mode: 1 });
  assert.equal(BRO.step.seconds(st, Infinity, 1), 10);
  assert.equal(BRO.step.seconds(st, NaN, 1), 10);
  assert.equal(BRO.step.seconds(st, 0, 1), 10);
});

test('mode 2 is fixed 15 seconds', () => {
  const st = s({ mode: 2 });
  assert.equal(BRO.step.seconds(st, 60, 1), 15);
  assert.equal(BRO.step.seconds(st, 7200, -1), 15);
});

test('mode 3 uses custom forward and back values', () => {
  const st = s({ mode: 3, custom: { fwd: 7, back: 3 } });
  assert.equal(BRO.step.seconds(st, 7200, 1), 7);
  assert.equal(BRO.step.seconds(st, 7200, -1), 3);
});

test('clampTime keeps target within range', () => {
  assert.equal(BRO.step.clampTime(-5, 0, 100), 0);
  assert.equal(BRO.step.clampTime(105, 0, 100), 100);
  assert.equal(BRO.step.clampTime(50, 0, 100), 50);
});
