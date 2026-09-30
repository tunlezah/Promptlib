// Minimal PNG encoder (RGBA, no dependencies) used to generate app icons at build time.
import zlib from 'node:zlib';

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

function hex(c) { const s = c.replace('#', ''); const n = parseInt(s.length === 3 ? s.split('').map((x) => x + x).join('') : s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

// A rounded square in the accent colour with a white "›_" prompt mark. `pad` leaves a safe zone for maskable icons.
export function drawIcon(size, { bg = '#2f6fed', fg = '#ffffff', pad = 0, transparent = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const [br, bgc, bb] = hex(bg); const [fr, fg2, fb] = hex(fg);
  const inner = size - pad * 2, r = inner * 0.22, cx = size / 2, cy = size / 2;
  const inRounded = (x, y) => {
    const dx = Math.max(Math.abs(x - cx) - (inner / 2 - r), 0), dy = Math.max(Math.abs(y - cy) - (inner / 2 - r), 0);
    return dx * dx + dy * dy <= r * r;
  };
  const t = inner * 0.09; // stroke
  // chevron: two segments from (0.30,0.34)->(0.50,0.50)->(0.30,0.66)  in inner coords
  const seg = (x, y, ax, ay, bx, by) => {
    const vx = bx - ax, vy = by - ay, wx = x - ax, wy = y - ay;
    const tt = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
    const dx = x - (ax + tt * vx), dy = y - (ay + tt * vy);
    return Math.sqrt(dx * dx + dy * dy) <= t / 2;
  };
  const P = (fx, fy) => [pad + fx * inner, pad + fy * inner];
  const [a1x, a1y] = P(0.28, 0.32), [a2x, a2y] = P(0.48, 0.5), [a3x, a3y] = P(0.28, 0.68);
  const [u1x, u1y] = P(0.55, 0.68), [u2x, u2y] = P(0.74, 0.68);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const X = x + 0.5, Y = y + 0.5;
    if (!(transparent || pad) || inRounded(X, Y)) {
      if (!pad && !transparent) { px[i] = br; px[i + 1] = bgc; px[i + 2] = bb; px[i + 3] = 255; }
      else if (inRounded(X, Y)) { px[i] = br; px[i + 1] = bgc; px[i + 2] = bb; px[i + 3] = 255; }
    }
    if (pad && !inRounded(X, Y)) { px[i] = br; px[i + 1] = bgc; px[i + 2] = bb; px[i + 3] = 255; } // maskable: full bleed
    if (seg(X, Y, a1x, a1y, a2x, a2y) || seg(X, Y, a2x, a2y, a3x, a3y) || seg(X, Y, u1x, u1y, u2x, u2y)) {
      px[i] = fr; px[i + 1] = fg2; px[i + 2] = fb; px[i + 3] = 255;
    }
  }
  return encodePng(size, size, px);
}
