const path = require('path');
const os = require('os');
const { chromium } = require('playwright-core');

const exe = process.env.BROCODE_CHROME || path.join(os.homedir(), '.cache/ms-playwright/chromium-1226/chrome-linux64/chrome');
const page = 'file://' + path.join(__dirname, 'promo.html');
const out = path.join(__dirname, '..');

const jobs = [
  ['hero', 1280, 800, 'screenshot-1'],
  ['anywhere', 1280, 800, 'screenshot-2'],
  ['clean', 1280, 800, 'screenshot-3'],
  ['interval', 1280, 800, 'screenshot-4'],
  ['keys', 1280, 800, 'screenshot-5'],
  ['tile', 440, 280, 'promo-small-440x280'],
  ['marquee', 1400, 560, 'promo-marquee-1400x560'],
];

(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
  for (const lang of ['ko', 'en']) {
    for (const [s, w, h, name] of jobs) {
      if (only && only !== s) continue;
      const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await p.goto(`${page}?s=${s}&lang=${lang}`);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(150);
      await p.screenshot({ path: path.join(out, lang, `${name}.png`), clip: { x: 0, y: 0, width: w, height: h } });
      await p.close();
    }
  }
  await browser.close();
})();
