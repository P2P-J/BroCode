const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, A, setStorage, clearStorage, openVideoPage, sleep } = require('./helpers');

let env;

test.before(async () => {
  env = await setup();
});

test.after(async () => {
  await env.teardown();
});

const styles = (page) => page.evaluate(() => ({
  ctrls: getComputedStyle(document.getElementById('ctrls')).display,
  caps: getComputedStyle(document.getElementById('caps')).display,
  grad: getComputedStyle(document.getElementById('grad')).backgroundImage,
  badge: getComputedStyle(document.getElementById('badge')).backgroundImage
}));

test('hides preset controls, keeps captions, strips overlay gradients, and restores when turned off', async () => {
  await clearStorage(env.sw);
  const page = await openVideoPage(env.context, A('presets.html'));
  await sleep(800);
  let s = await styles(page);
  assert.equal(s.ctrls, 'none');
  assert.notEqual(s.caps, 'none');
  assert.equal(s.grad, 'none');
  assert.ok(s.badge.includes('gradient'));
  await setStorage(env.sw, { 'site:localhost': { uiClean: false, hotkeys: true } });
  await sleep(400);
  s = await styles(page);
  assert.notEqual(s.ctrls, 'none');
  assert.ok(s.grad.includes('gradient'));
});
