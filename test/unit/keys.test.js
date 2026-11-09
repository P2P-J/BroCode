const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const BRO = load('content/core/keys.js');

const ev = (over) => ({ key: '', code: '', ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, isComposing: false, keyCode: 0, ...over });

test('command maps arrows and space', () => {
  assert.equal(BRO.keys.command(ev({ key: 'ArrowRight', code: 'ArrowRight' })), 'seekForward');
  assert.equal(BRO.keys.command(ev({ key: 'ArrowLeft', code: 'ArrowLeft' })), 'seekBack');
  assert.equal(BRO.keys.command(ev({ key: 'ArrowUp', code: 'ArrowUp' })), 'volumeUp');
  assert.equal(BRO.keys.command(ev({ key: 'ArrowDown', code: 'ArrowDown' })), 'volumeDown');
  assert.equal(BRO.keys.command(ev({ key: ' ', code: 'Space' })), 'togglePlay');
});

test('command ignores other keys so site shortcuts keep working', () => {
  assert.equal(BRO.keys.command(ev({ key: 'm', code: 'KeyM' })), null);
  assert.equal(BRO.keys.command(ev({ key: 'c', code: 'KeyC' })), null);
  assert.equal(BRO.keys.command(ev({ key: 'f', code: 'KeyF' })), null);
});

test('command ignores modifier combos and IME composition', () => {
  assert.equal(BRO.keys.command(ev({ key: 'ArrowRight', ctrlKey: true })), null);
  assert.equal(BRO.keys.command(ev({ key: 'ArrowRight', altKey: true })), null);
  assert.equal(BRO.keys.command(ev({ key: 'ArrowRight', metaKey: true })), null);
  assert.equal(BRO.keys.command(ev({ key: 'ArrowRight', isComposing: true })), null);
  assert.equal(BRO.keys.command(ev({ key: 'Process', keyCode: 229 })), null);
});

test('command honours allowed list', () => {
  assert.equal(BRO.keys.command(ev({ key: ' ', code: 'Space' }), ['seekForward']), null);
  assert.equal(BRO.keys.command(ev({ key: 'ArrowRight' }), ['seekForward']), 'seekForward');
});

const el = (tagName, extra = {}) => ({ tagName, type: '', isContentEditable: false, ...extra });

test('isEditable detects text inputs but not range sliders', () => {
  assert.equal(BRO.keys.isEditable(el('INPUT', { type: 'text' })), true);
  assert.equal(BRO.keys.isEditable(el('INPUT', { type: 'search' })), true);
  assert.equal(BRO.keys.isEditable(el('INPUT', { type: 'range' })), false);
  assert.equal(BRO.keys.isEditable(el('INPUT', { type: 'checkbox' })), false);
  assert.equal(BRO.keys.isEditable(el('TEXTAREA')), true);
  assert.equal(BRO.keys.isEditable(el('SELECT')), true);
  assert.equal(BRO.keys.isEditable(el('DIV', { isContentEditable: true })), true);
  assert.equal(BRO.keys.isEditable(el('DIV')), false);
  assert.equal(BRO.keys.isEditable(null), false);
});
