const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, clearStorage, getStorage, sleep } = require('./helpers');

test('popup renders in English and saves the mode', async () => {
  const env = await setup();
  try {
    await clearStorage(env.sw);
    const page = await env.context.newPage();
    await page.goto(`chrome-extension://${env.extId}/popup/popup.html`);
    await page.waitForSelector('[data-i18n="popupStep"]');
    assert.equal(await page.textContent('[data-i18n="popupStep"]'), 'Skip interval');
    assert.equal(await page.isVisible('#unsupported'), true);
    await page.click('input[name="mode"][value="3"]');
    await sleep(200);
    assert.equal(await page.isVisible('#custom'), true);
    await page.fill('#fwd', '25');
    await page.dispatchEvent('#fwd', 'change');
    await sleep(200);
    const data = await getStorage(env.sw);
    assert.equal(data.settings.mode, 3);
    assert.equal(data.settings.custom.fwd, 25);
  } finally {
    await env.teardown();
  }
});

test('popup renders in Korean when the browser language is Korean', async () => {
  const env = await setup({ lang: 'ko' });
  try {
    const page = await env.context.newPage();
    await page.goto(`chrome-extension://${env.extId}/popup/popup.html`);
    await page.waitForSelector('[data-i18n="popupStep"]');
    assert.equal(await page.textContent('[data-i18n="popupStep"]'), '건너뛰기 간격');
    assert.equal(await page.textContent('h1'), '강호의도리');
  } finally {
    await env.teardown();
  }
});
