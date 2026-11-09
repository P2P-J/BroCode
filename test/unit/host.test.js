const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const BRO = load('shared/host.js');

test('fromUrl extracts host and strips www', () => {
  assert.equal(BRO.host.fromUrl('https://www.youtube.com/watch?v=1'), 'youtube.com');
  assert.equal(BRO.host.fromUrl('https://m.youtube.com/'), 'm.youtube.com');
  assert.equal(BRO.host.fromUrl('http://localhost:8080/a'), 'localhost');
});

test('fromUrl returns null for unsupported schemes', () => {
  assert.equal(BRO.host.fromUrl('chrome://extensions'), null);
  assert.equal(BRO.host.fromUrl('not a url'), null);
  assert.equal(BRO.host.fromUrl(''), null);
});

test('fromUrl maps file urls to "file"', () => {
  assert.equal(BRO.host.fromUrl('file:///home/a/v.mp4'), 'file');
});

test('matches exact host and subdomains only', () => {
  assert.equal(BRO.host.matches('youtube.com', 'youtube.com'), true);
  assert.equal(BRO.host.matches('m.youtube.com', 'youtube.com'), true);
  assert.equal(BRO.host.matches('notyoutube.com', 'youtube.com'), false);
  assert.equal(BRO.host.matches('youtube.com.evil.io', 'youtube.com'), false);
});

test('lookup returns most specific matching entry', () => {
  const table = { 'youtube.com': { a: 1 }, 'music.youtube.com': { a: 2 } };
  assert.deepEqual(BRO.host.lookup('music.youtube.com', table), { a: 2 });
  assert.deepEqual(BRO.host.lookup('www.youtube.com', table), { a: 1 });
  assert.equal(BRO.host.lookup('vimeo.com', table), null);
});
