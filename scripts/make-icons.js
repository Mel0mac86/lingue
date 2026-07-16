#!/usr/bin/env node
/**
 * Generates the Lingue PWA icons (blue→teal gradient + white speech bubble)
 * without any image dependency: writes PNGs from raw pixels.
 *
 *   node scripts/make-icons.js
 * → public/icons/icon-512.png, icon-192.png, apple-touch-icon.png (180px)
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── Minimal PNG encoder ──────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Icon drawing ─────────────────────────────────────────────────────────────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const TOP = hex('#2563EB');
const BOTTOM = hex('#0FA3A3');
const DOT = hex('#0FA3A3');

function drawIcon(S) {
  const px = Buffer.alloc(S * S * 4);
  const cx = S / 2;
  const bubbleCy = S * 0.46;
  const rx = S * 0.34;
  const ry = S * 0.26;
  const dotR = S * 0.045;
  const dotY = bubbleCy;
  const dots = [cx - S * 0.14, cx, cx + S * 0.14];

  const inBubble = (x, y) => {
    const dx = (x - cx) / rx;
    const dy = (y - bubbleCy) / ry;
    if (dx * dx + dy * dy <= 1) return true;
    // Tail: triangle pointing down-left, attached under the bubble.
    const tipX = cx - S * 0.2;
    const tipY = bubbleCy + ry + S * 0.1;
    const baseX1 = cx - S * 0.14;
    const baseX2 = cx + S * 0.02;
    const baseY = bubbleCy + ry * 0.8;
    if (y < baseY || y > tipY) return false;
    const f = (y - baseY) / (tipY - baseY); // 0 at base → 1 at tip
    const left = baseX1 + (tipX - baseX1) * f;
    const right = baseX2 + (tipX - baseX2) * f;
    return x >= left && x <= right;
  };

  for (let y = 0; y < S; y++) {
    const g = y / S;
    const bg = [
      Math.round(TOP[0] + (BOTTOM[0] - TOP[0]) * g),
      Math.round(TOP[1] + (BOTTOM[1] - TOP[1]) * g),
      Math.round(TOP[2] + (BOTTOM[2] - TOP[2]) * g),
    ];
    for (let x = 0; x < S; x++) {
      let c = bg;
      if (inBubble(x, y)) {
        c = [255, 255, 255];
        for (const dx of dots) {
          const dd = (x - dx) * (x - dx) + (y - dotY) * (y - dotY);
          if (dd <= dotR * dotR) { c = DOT; break; }
        }
      }
      const i = (y * S + x) * 4;
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
    }
  }
  return encodePNG(S, S, px);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon-512.png'), drawIcon(512));
fs.writeFileSync(path.join(outDir, 'icon-192.png'), drawIcon(192));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), drawIcon(180));
console.log('Icons written to public/icons/');
