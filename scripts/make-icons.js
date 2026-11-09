const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const png = (size, rgba) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
};

const hex = (h, a = 1) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];

const segDist = (x, y, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
};

const bezierPoints = (p0, p1, p2, n = 24) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
  }
  return pts;
};

const polyDist = (x, y, pts) => {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(x, y, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]));
  return d;
};

const inEllipse = (x, y, cx, cy, rx, ry, rot = 0) => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const dx = x - cx;
  const dy = y - cy;
  const u = (dx * c + dy * s) / rx;
  const v = (-dx * s + dy * c) / ry;
  return u * u + v * v <= 1;
};

const FACE = { cx: 0.5, cy: 0.49, r: 0.45 };
const OUTLINE = hex('#8a5200');
const INK = hex('#3b2414');
const MOUTH = bezierPoints([0.5, 0.735], [0.62, 0.745], [0.73, 0.655]);
const MOUTH_TAIL = bezierPoints([0.70, 0.64], [0.735, 0.655], [0.745, 0.69], 8);
const BROW_L = bezierPoints([0.22, 0.31], [0.31, 0.295], [0.40, 0.325], 12);
const BROW_R = bezierPoints([0.58, 0.27], [0.68, 0.20], [0.79, 0.255], 12);
const LID_L = [[0.235, 0.425], [0.415, 0.425]];
const LID_R = [[0.585, 0.415], [0.765, 0.415]];
const FINGER = [0.43, 0.60, 0.43, 0.86];
const FIST = { cx: 0.395, cy: 0.93, rx: 0.17, ry: 0.11 };

let W = 1;
let DETAIL = true;

const halfEye = (x, y, cx, cy, r) => y >= cy && Math.hypot(x - cx, y - cy) <= r;

const layers = (x, y) => {
  const out = [];
  const fd = Math.hypot(x - FACE.cx, y - FACE.cy);
  if (fd <= FACE.r) {
    if (fd > FACE.r - 0.028 * Math.min(W, 1.4)) out.push(OUTLINE);
    else {
      const t = Math.min(1, Math.hypot(x - 0.42, y - 0.36) / 0.6);
      out.push([255, Math.round(222 - 52 * t), Math.round(92 - 72 * t), 1]);
    }
  }
  if (inEllipse(x, y, 0.255, 0.58, 0.085, 0.05)) out.push(hex('#ff6f7d', 0.45));
  if (inEllipse(x, y, 0.765, 0.565, 0.085, 0.05)) out.push(hex('#ff6f7d', 0.45));
  if (halfEye(x, y, 0.325, 0.425, 0.075)) out.push(INK);
  if (halfEye(x, y, 0.675, 0.415, 0.075)) out.push(INK);
  if (DETAIL && (halfEye(x, y, 0.345, 0.44, 0.022) || halfEye(x, y, 0.695, 0.43, 0.022))) out.push(hex('#ffffff', 0.9));
  if (segDist(x, y, ...LID_L[0], ...LID_L[1]) <= 0.024 * W) out.push(INK);
  if (segDist(x, y, ...LID_R[0], ...LID_R[1]) <= 0.024 * W) out.push(INK);
  if (polyDist(x, y, BROW_L) <= 0.02 * W) out.push(INK);
  if (polyDist(x, y, BROW_R) <= 0.02 * W) out.push(INK);
  if (polyDist(x, y, MOUTH) <= 0.026 * W || polyDist(x, y, MOUTH_TAIL) <= 0.022 * W) out.push(INK);
  const fistOuter = inEllipse(x, y, FIST.cx, FIST.cy, FIST.rx + 0.022, FIST.ry + 0.022);
  const fingerD = segDist(x, y, ...FINGER);
  if (fistOuter || fingerD <= 0.082) out.push(OUTLINE);
  const fistIn = inEllipse(x, y, FIST.cx, FIST.cy, FIST.rx, FIST.ry);
  if (fistIn || fingerD <= 0.06) {
    const shade = Math.max(0, Math.min(1, (x - 0.33) / 0.25));
    out.push([255, Math.round(205 - 30 * shade), Math.round(105 - 45 * shade), 1]);
  }
  if (DETAIL && fistIn && segDist(x, y, 0.27, 0.925, 0.36, 0.925) <= 0.012) out.push(hex('#b86a10', 0.7));
  if (inEllipse(x, y, 0.43, 0.615, 0.033, 0.026)) out.push(hex('#fff1d6', 0.95));
  return out;
};

const sample = (x, y) => {
  let r = 0, g = 0, b = 0, a = 0;
  for (const [cr, cg, cb, ca] of layers(x, y)) {
    r = cr * ca + r * (1 - ca);
    g = cg * ca + g * (1 - ca);
    b = cb * ca + b * (1 - ca);
    a = ca + a * (1 - ca);
  }
  return a ? [r / a, g / a, b / a, a] : null;
};

const render = (size) => {
  W = size <= 16 ? 1.9 : size <= 32 ? 1.3 : 1;
  DETAIL = size > 16;
  const ss = 4;
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const c = sample((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size);
          if (c) {
            r += c[0] * c[3];
            g += c[1] * c[3];
            b += c[2] * c[3];
            a += c[3];
          }
        }
      }
      const i = (py * size + px) * 4;
      if (a) {
        buf[i] = Math.round(r / a);
        buf[i + 1] = Math.round(g / a);
        buf[i + 2] = Math.round(b / a);
      }
      buf[i + 3] = Math.round((a / (ss * ss)) * 255);
    }
  }
  return png(size, buf);
};

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(out, `icon${size}.png`), render(size));
}
