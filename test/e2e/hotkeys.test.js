const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, A, B, setStorage, clearStorage, openVideoPage, sleep } = require('./helpers');

let env;

test.before(async () => {
  env = await setup();
});

test.after(async () => {
  await env.teardown();
});

test.beforeEach(async () => {
  await clearStorage(env.sw);
  for (const p of env.context.pages()) await p.close();
});

const time = (page) => page.evaluate(() => (window.__video ? window.__video() : document.querySelector('video')).currentTime);

const near = (actual, expected, tol = 0.6) => assert.ok(Math.abs(actual - expected) <= tol, `expected ~${expected}, got ${actual}`);

test('mode 1: arrows skip 10s on a 10 minute video and site handler does not double it', async () => {
  const page = await openVideoPage(env.context, A('basic.html?sec=600'));
  await page.mouse.click(300, 150);
  await page.evaluate(() => { const v = document.querySelector('video'); v.pause(); v.currentTime = 100; });
  await sleep(200);
  await page.keyboard.press('ArrowRight');
  await sleep(150);
  near(await time(page), 110);
  await page.keyboard.press('ArrowLeft');
  await sleep(150);
  near(await time(page), 100);
  const siteKeys = await page.evaluate(() => window.siteKeys);
  assert.ok(!siteKeys.includes('ArrowRight'));
  assert.ok(!siteKeys.includes('ArrowLeft'));
});

test('holding an arrow keeps skipping on every key repeat', async () => {
  const page = await openVideoPage(env.context, A('basic.html?sec=600'));
  await page.mouse.click(300, 150);
  await page.evaluate(() => { const v = document.querySelector('video'); v.pause(); v.currentTime = 100; });
  await sleep(200);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.down('ArrowRight');
    await sleep(40);
  }
  await page.keyboard.up('ArrowRight');
  await sleep(150);
  near(await time(page), 140);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.down('ArrowLeft');
    await sleep(40);
  }
  await page.keyboard.up('ArrowLeft');
  await sleep(150);
  near(await time(page), 110);
});

test('mode 1: duration table picks 15s and 30s', async () => {
  for (const [sec, step] of [[30 * 60, 15], [2 * 3600, 30]]) {
    const page = await openVideoPage(env.context, A(`basic.html?sec=${sec}`));
    await page.mouse.click(300, 150);
    await page.evaluate(() => { const v = document.querySelector('video'); v.pause(); v.currentTime = 200; });
    await sleep(200);
    await page.keyboard.press('ArrowRight');
    await sleep(150);
    near(await time(page), 200 + step);
    await page.close();
  }
});

test('mode 2 and mode 3 apply immediately from storage', async () => {
  const page = await openVideoPage(env.context, A('basic.html?sec=7200'));
  await page.mouse.click(300, 150);
  await page.evaluate(() => { const v = document.querySelector('video'); v.pause(); v.currentTime = 500; });
  await setStorage(env.sw, { settings: { mode: 2 } });
  await sleep(300);
  await page.keyboard.press('ArrowRight');
  await sleep(150);
  near(await time(page), 515);
  await setStorage(env.sw, { settings: { mode: 3, custom: { fwd: 7, back: 3 } } });
  await sleep(300);
  await page.keyboard.press('ArrowRight');
  await sleep(150);
  near(await time(page), 522);
  await page.keyboard.press('ArrowLeft');
  await sleep(150);
  near(await time(page), 519);
});

test('seek clamps at start', async () => {
  const page = await openVideoPage(env.context, A('basic.html?sec=600'));
  await page.mouse.click(300, 150);
  await page.evaluate(() => { const v = document.querySelector('video'); v.pause(); v.currentTime = 3; });
  await sleep(200);
  await page.keyboard.press('ArrowLeft');
  await sleep(150);
  near(await time(page), 0);
});

test('up/down change volume by 5% and up unmutes', async () => {
  const page = await openVideoPage(env.context, A('basic.html?sec=600'));
  await page.mouse.click(300, 150);
  await page.keyboard.press('ArrowDown');
  await sleep(100);
  assert.equal(await page.evaluate(() => document.querySelector('video').volume), 0.95);
  await page.evaluate(() => { document.querySelector('video').muted = true; });
  await page.keyboard.press('ArrowUp');
  await sleep(100);
  const st = await page.evaluate(() => ({ v: document.querySelector('video').volume, m: document.querySelector('video').muted }));
  assert.equal(st.v, 1);
  assert.equal(st.m, false);
});

test('space toggles play/pause without scrolling, and scrolls when the video is off screen', async () => {
  const page = await openVideoPage(env.context, A('basic.html?sec=600'));
  await page.mouse.click(300, 150);
  await page.evaluate(() => document.querySelector('video').pause());
  await page.keyboard.press('Space');
  await sleep(300);
  assert.equal(await page.evaluate(() => document.querySelector('video').paused), false);
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.keyboard.press('Space');
  await sleep(200);
  assert.equal(await page.evaluate(() => document.querySelector('video').paused), true);
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await sleep(100);
  await page.mouse.click(600, 400);
  await page.keyboard.press('Space');
  await sleep(300);
  assert.ok((await page.evaluate(() => window.scrollY)) > 1500);
  assert.equal(await page.evaluate(() => document.querySelector('video').paused), true);
});

test('typing in an input is not intercepted and other keys reach the site', async () => {
  const page = await openVideoPage(env.context, A('basic.html?sec=600'));
  await page.evaluate(() => { const v = document.querySelector('video'); v.pause(); v.currentTime = 50; });
  await page.click('#text');
  await page.keyboard.type('a b');
  await page.keyboard.press('ArrowLeft');
  await sleep(150);
  assert.equal(await page.inputValue('#text'), 'a b');
  near(await time(page), 50);
  await page.mouse.click(300, 150);
  await page.keyboard.press('m');
  const siteKeys = await page.evaluate(() => window.siteKeys);
  assert.ok(siteKeys.includes('m'));
});

test('works after clicking the video area of a player that only listens on its progress bar', async () => {
  const page = await openVideoPage(env.context, A('focusbar.html'));
  await page.evaluate(() => { const v = document.querySelector('video'); v.pause(); v.currentTime = 30; });
  await page.click('#overlay');
  await page.keyboard.press('ArrowRight');
  await sleep(150);
  near(await time(page), 40);
  await page.click('#bar');
  await page.keyboard.press('ArrowLeft');
  await sleep(150);
  near(await time(page), 30);
});

test('defeats a player that reverts seeking', async () => {
  const page = await openVideoPage(env.context, A('antiskip.html'));
  await page.mouse.click(300, 150);
  await page.keyboard.press('ArrowRight');
  await sleep(1500);
  assert.ok((await page.evaluate(() => window.reverts)) >= 1);
  near(await time(page), 10);
  await page.keyboard.press('ArrowRight');
  await sleep(1200);
  near(await time(page), 20);
});

test('controls a video inside a closed shadow root', async () => {
  const page = await openVideoPage(env.context, A('shadow.html'));
  await page.mouse.click(300, 150);
  await page.keyboard.press('ArrowRight');
  await sleep(150);
  near(await time(page), 10);
});

test('forwards keys from the top page to a cross-origin iframe video', async () => {
  const page = await env.context.newPage();
  await page.goto(A('iframe-parent.html?src=' + encodeURIComponent(B('basic.html?sec=600'))));
  const frame = await (await page.waitForSelector('#f')).contentFrame();
  await frame.waitForFunction(() => { const v = document.querySelector('video'); return v && v.readyState >= 1; });
  await frame.evaluate(() => { const v = document.querySelector('video'); v.currentTime = 100; return v.play(); });
  await sleep(1200);
  await page.click('#outside');
  const before = await frame.evaluate(() => document.querySelector('video').currentTime);
  await page.keyboard.press('ArrowRight');
  await sleep(400);
  const after = await frame.evaluate(() => document.querySelector('video').currentTime);
  assert.ok(after - before >= 9.5 && after - before <= 11.5, `moved ${after - before}`);
});

test('turning hotkeys off for the site passes keys through', async () => {
  await setStorage(env.sw, { 'site:localhost': { hotkeys: false, uiClean: true } });
  const page = await openVideoPage(env.context, A('basic.html?sec=600'));
  await page.mouse.click(300, 150);
  await page.evaluate(() => { const v = document.querySelector('video'); v.pause(); v.currentTime = 100; });
  await sleep(200);
  await page.keyboard.press('ArrowRight');
  await sleep(150);
  assert.notEqual(Math.round(await time(page)), 110);
  assert.ok((await page.evaluate(() => window.siteKeys)).includes('ArrowRight'));
});
