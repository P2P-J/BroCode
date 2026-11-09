const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const FIXTURES = path.join(__dirname, '..', 'fixtures');
const RATE = 8000;

const wavHeader = (dataLen) => {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + dataLen, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE, 28);
  h.writeUInt16LE(1, 32);
  h.writeUInt16LE(8, 34);
  h.write('data', 36);
  h.writeUInt32LE(dataLen, 40);
  return h;
};

const serveWav = (req, res, sec) => {
  const dataLen = Math.max(1, Math.round(sec * RATE));
  const total = 44 + dataLen;
  let start = 0;
  let end = total - 1;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m) {
    if (m[1]) start = Number(m[1]);
    if (m[2]) end = Math.min(Number(m[2]), total - 1);
  }
  end = Math.min(end, start + 1024 * 1024 - 1);
  const len = end - start + 1;
  const body = Buffer.alloc(len, 0x80);
  if (start < 44) wavHeader(dataLen).copy(body, 0, start, Math.min(44, end + 1));
  res.writeHead(m ? 206 : 200, {
    'Content-Type': 'audio/wav',
    'Accept-Ranges': 'bytes',
    'Content-Length': len,
    ...(m ? { 'Content-Range': `bytes ${start}-${end}/${total}` } : {})
  });
  res.end(body);
};

const start = (port) => new Promise((resolve) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/media/silence.wav') return serveWav(req, res, Number(url.searchParams.get('sec')) || 600);
    const file = path.join(FIXTURES, path.normalize(url.pathname).replace(/^[/\\]+/, ''));
    if (!file.startsWith(FIXTURES) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end('not found');
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(port, '127.0.0.1', () => resolve(server));
});

module.exports = { start };
