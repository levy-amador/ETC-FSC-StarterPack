'use strict';
// Codificador/decodificador PNG mínimo (sin dependencias externas).
// Soporta PNG sin entrelazado: tipos 0 (gris), 2 (RGB), 3 (paleta), 4 (gris+alfa) y 6 (RGBA);
// 8 bits por canal, o 1/2/4/8 bits en gris y paleta.
const zlib = require('zlib');

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

// rgba: Uint8Array de width*height*4
function encode(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profundidad
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function decode(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('No es un archivo PNG válido');
  let off = 8;
  let width, height, depth, colorType, interlace, palette, trns;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const okDepth = depth === 8 || ([0, 3].includes(colorType) && [1, 2, 4].includes(depth));
  if (!channels || !okDepth || interlace !== 0 || (colorType === 3 && !palette)) {
    throw new Error(`PNG no soportado para análisis de color (bits=${depth}, tipo=${colorType}, entrelazado=${interlace})`);
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = Math.max(1, (channels * depth) >> 3); // bytes por pixel para los filtros
  const stride = Math.ceil((width * channels * depth) / 8);
  const out = new Uint8Array(width * height * 4);
  const prev = new Uint8Array(stride);
  const cur = new Uint8Array(stride);
  const sample = (x) => {
    if (depth === 8) return cur[x];
    const bit = x * depth;
    return (cur[bit >> 3] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
  };
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      const v = raw[p++];
      let r;
      switch (filter) {
        case 0: r = v; break;
        case 1: r = v + a; break;
        case 2: r = v + b; break;
        case 3: r = v + ((a + b) >> 1); break;
        case 4: r = v + paeth(a, b, c); break;
        default: throw new Error('Filtro PNG desconocido');
      }
      cur[x] = r & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (colorType === 3) {
        const idx = sample(x);
        out[o] = palette[idx * 3];
        out[o + 1] = palette[idx * 3 + 1];
        out[o + 2] = palette[idx * 3 + 2];
        out[o + 3] = trns && idx < trns.length ? trns[idx] : 255;
      } else if (colorType === 0 && depth < 8) {
        const v = Math.round((sample(x) * 255) / ((1 << depth) - 1));
        out[o] = out[o + 1] = out[o + 2] = v;
        out[o + 3] = 255;
      } else {
        const i = x * channels;
        if (channels === 1 || channels === 2) {
          out[o] = out[o + 1] = out[o + 2] = cur[i];
          out[o + 3] = channels === 2 ? cur[i + 1] : 255;
        } else {
          out[o] = cur[i];
          out[o + 1] = cur[i + 1];
          out[o + 2] = cur[i + 2];
          out[o + 3] = channels === 4 ? cur[i + 3] : 255;
        }
      }
    }
    prev.set(cur);
  }
  return { width, height, rgba: out };
}

module.exports = { encode, decode };
