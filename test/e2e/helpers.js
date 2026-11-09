const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const server = require('./server');

const EXT = path.join(__dirname, '..', '..');
const CHROME = process.env.BROCODE_CHROME || path.join(os.homedir(), '.cache/ms-playwright/chromium-1226/chrome-linux64/chrome');
const PORT_A = 47811;
const PORT_B = 47812;

const setup = async (opts = {}) => {
  const servers = [await server.start(PORT_A), await server.start(PORT_B)];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brocode-e2e-'));
  const context = await chromium.launchPersistentContext(dir, {
    executablePath: CHROME,
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      '--autoplay-policy=no-user-gesture-required',
      ...(opts.lang ? [`--lang=${opts.lang}`] : [])
    ],
    env: { ...process.env, ...(opts.lang ? { LANGUAGE: opts.lang, LANG: opts.lang } : {}) }
  });
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  const extId = new URL(sw.url()).host;
  const teardown = async () => {
    await context.close();
    for (const s of servers) s.close();
    fs.rmSync(dir, { recursive: true, force: true });
  };
  return { context, sw, extId, teardown };
};

const A = (p) => `http://localhost:${PORT_A}/${p}`;
const B = (p) => `http://127.0.0.1:${PORT_B}/${p}`;

const setStorage = (sw, obj) => sw.evaluate((o) => chrome.storage.sync.set(o), obj);
const clearStorage = (sw) => sw.evaluate(() => chrome.storage.sync.clear());
const getStorage = (sw) => sw.evaluate(() => chrome.storage.sync.get(null));

const openVideoPage = async (context, url, selector = 'video') => {
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForFunction((sel) => {
    const v = window.__video ? window.__video() : document.querySelector(sel);
    return v && v.readyState >= 1 && Number.isFinite(v.duration);
  }, selector);
  await page.waitForTimeout(400);
  return page;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { setup, A, B, setStorage, clearStorage, getStorage, openVideoPage, sleep };
