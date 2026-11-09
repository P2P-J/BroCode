const path = require('node:path');

function load(...files) {
  for (const f of files) {
    require(path.join(__dirname, '..', '..', 'src', f));
  }
  return globalThis.BRO;
}

module.exports = { load };
