/**
 * Generates placeholder PNG assets for the Expo app build.
 * Run once with: node generate-assets.js
 */
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
  // PNG signature
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw image data: each row = filter byte (0) + RGB pixels
  const rowLen = 1 + width * 3;
  const raw    = Buffer.alloc(height * rowLen);
  for (let y = 0; y < height; y++) {
    const off = y * rowLen;
    raw[off] = 0; // filter none
    for (let x = 0; x < width; x++) {
      raw[off + 1 + x*3 + 0] = r;
      raw[off + 1 + x*3 + 1] = g;
      raw[off + 1 + x*3 + 2] = b;
    }
  }
  const compressed = zlib.deflateSync(raw);

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t   = Buffer.from(type);
    const crc = crc32(Buffer.concat([t, data]));
    const c   = Buffer.alloc(4); c.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, t, data, c]);
  }

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// CRC32 table
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF);
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// icon.png         — 1024x1024 orange
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPNG(1024, 1024, 249, 115, 22));
// adaptive-icon    — 1024x1024 white (foreground on orange bg)
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPNG(1024, 1024, 255, 255, 255));
// splash.png       — 1242x2436 dark bg
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPNG(1242, 2436, 30, 41, 59));
// notification-icon — 96x96 white
fs.writeFileSync(path.join(assetsDir, 'notification-icon.png'), createPNG(96, 96, 255, 255, 255));

console.log('✅ Assets generated in ./assets/');
console.log('   icon.png, adaptive-icon.png, splash.png, notification-icon.png');
