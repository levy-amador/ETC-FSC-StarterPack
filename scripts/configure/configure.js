#!/usr/bin/env node
'use strict';
// npm run configure -- --client "Cliente" --vertical insurance|banking|wealth --name "Mi App" [--logo ruta.png] [--primary #RRGGBB] [--secondary #RRGGBB]
// Sin argumentos y en una terminal interactiva, pregunta cliente, vertical y branding.
// Genera: config/implementation.json (cliente + vertical), config/branding/client-branding.json,
// la Lightning App (pestañas de la base común + la vertical), el logo (Static Resource + ContentAsset)
// y actualiza la visibilidad de la app en el Permission Set ETC_FSC_Base_Access (si existe).
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');
const { ROOT, SRC, BRANDING_FILE, IMPLEMENTATION_FILE, c, fail, parseArgs, readJson, writeJson } = require('../lib/common');
const { resolveVerticals, activeModules, labelOf } = require('../lib/vertical');
const png = require('../lib/png');

const DEFAULTS = { primary: '#0B5CAB', secondary: '#F28C28' };
const LOGO_NAME = 'ETC_App_Logo';
const DEFAULT_LOGO = path.join(ROOT, 'assets', 'default-logo.png');
const TEMPLATE = path.join(__dirname, 'templates', 'application.xml');
const CORE_PS = path.join(SRC, 'permissionsets', 'ETC_FSC_Base_Access.permissionset-meta.xml');
const ADMIN_PROFILE = path.join(SRC, 'profiles', 'Admin.profile-meta.xml');
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const HEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

function normalizeHex(v) {
  if (!v) return null;
  const m = String(v).trim().match(HEX);
  if (!m) return undefined;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return '#' + h.toUpperCase();
}

function toApiName(label) {
  let s = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  if (!/^[A-Za-z]/.test(s)) s = 'App_' + s;
  s = s.slice(0, 40).replace(/_+$/, '');
  if (!s) fail('No se pudo generar un API Name a partir del nombre indicado.');
  return s;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- Logo predeterminado: monograma "ETC" ----------
const GLYPHS = {
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111']
};

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function generateDefaultLogo(primary, secondary) {
  const S = 256;
  const R = 40; // radio de esquina
  const buf = new Uint8Array(S * S * 4);
  const [pr, pg, pb] = hexToRgb(primary);
  const [sr, sg, sb] = hexToRgb(secondary);
  const set = (x, y, r, g, b, a = 255) => {
    const o = (y * S + x) * 4;
    buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = a;
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const cx = x < R ? R : x >= S - R ? S - R - 1 : x;
      const cy = y < R ? R : y >= S - R ? S - R - 1 : y;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= R * R) set(x, y, pr, pg, pb);
    }
  }
  const scale = 10;
  const gap = 20;
  const word = 'ETC';
  const w = word.length * 5 * scale + (word.length - 1) * gap;
  const x0 = Math.floor((S - w) / 2);
  const y0 = 70;
  word.split('').forEach((ch, i) => {
    GLYPHS[ch].forEach((row, gy) => {
      row.split('').forEach((bit, gx) => {
        if (bit !== '1') return;
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++)
            set(x0 + i * (5 * scale + gap) + gx * scale + dx, y0 + gy * scale + dy, 255, 255, 255);
      });
    });
  });
  for (let y = 168; y < 180; y++) for (let x = x0; x < x0 + w; x++) set(x, y, sr, sg, sb);
  return png.encode(S, S, buf);
}

// ---------- Procesamiento de logo del cliente ----------
function detectImageType(buf) {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  return null;
}

// Recorta márgenes transparentes o blancos (deja 4% de aire) para que el logo use todo el espacio disponible.
function trimLogo(buf) {
  let img;
  try {
    img = png.decode(buf);
  } catch {
    return buf;
  }
  const { width: w, height: h, rgba } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (rgba[o + 3] < 16 || (rgba[o] > 245 && rgba[o + 1] > 245 && rgba[o + 2] > 245)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return buf;
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04);
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  if (x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1) return buf;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const out = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) out.set(rgba.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4), y * cw * 4);
  return png.encode(cw, ch, out);
}

// Convierte a PNG, recorta márgenes y limita a 512 px usando `sips` (macOS). En otros SO conserva el PNG recortado.
function normalizeLogo(src) {
  const ext = path.extname(src).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) fail('El logo debe ser PNG, JPG o JPEG.');
  if (!fs.existsSync(src)) fail(`No existe el archivo de logo: ${src}`);
  const stat = fs.statSync(src);
  if (stat.size > MAX_LOGO_BYTES) fail('El logo excede 5 MB.');
  const original = fs.readFileSync(src);
  const kind = detectImageType(original);
  if (!kind) fail('El contenido del archivo no es una imagen PNG/JPG válida.');
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'etc-logo-')), 'logo.png');
  const hasSips = process.platform === 'darwin' && spawnSync('which', ['sips']).status === 0;
  if (hasSips) {
    const sips = (args) => {
      const r = spawnSync('sips', args, { encoding: 'utf8' });
      if (r.status !== 0) fail(`No se pudo procesar el logo con sips: ${r.stderr}`);
    };
    sips(['-s', 'format', 'png', src, '--out', tmp]);
    fs.writeFileSync(tmp, trimLogo(fs.readFileSync(tmp)));
    sips(['-Z', '512', tmp]);
    return fs.readFileSync(tmp);
  }
  if (kind !== 'png') fail('Sin herramienta de conversión disponible: proporciona el logo en formato PNG.');
  console.log(c.yellow('⚠ No se encontró herramienta de redimensionado; se usa el PNG recortado sin redimensionar.'));
  return trimLogo(original);
}

// Propone una paleta: color dominante saturado y un segundo color con tono distinto.
function proposePalette(pngBuf) {
  let img;
  try {
    img = png.decode(pngBuf);
  } catch (e) {
    console.log(c.yellow(`⚠ No se pudo analizar el logo (${e.message}).`));
    return null;
  }
  const buckets = new Map();
  for (let i = 0; i < img.rgba.length; i += 4) {
    const [r, g, b, a] = [img.rgba[i], img.rgba[i + 1], img.rgba[i + 2], img.rgba[i + 3]];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 40 || max < 40 || min > 225) continue; // descarta grises, negros y blancos
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b;
    buckets.set(key, e);
  }
  const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).map((e) => [e.r / e.n, e.g / e.n, e.b / e.n]);
  if (!ranked.length) return null;
  const hue = ([r, g, b]) => {
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (!d) return 0;
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const first = ranked[0];
  const second = ranked.find((x) => {
    const d = Math.abs(hue(x) - hue(first));
    return Math.min(d, 360 - d) > 30;
  });
  return { primary: toHex(first), secondary: second ? toHex(second) : null };
}

async function ask(rl, q) {
  return new Promise((res) => rl.question(q, (a) => res(a.trim())));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const previous = readJson(BRANDING_FILE, null);
  let { name, logo, primary, secondary, client } = args;
  const interactive = process.stdin.isTTY && !args['non-interactive'];
  const impl = readJson(IMPLEMENTATION_FILE, { verticals: [] });

  // Cliente y vertical: la decisión que build y deploy exigen.
  if (!client && interactive) {
    const rl0 = readline.createInterface({ input: process.stdin, output: process.stdout });
    client = (await ask(rl0, `Nombre del cliente${impl.client ? ` [Enter = ${impl.client}]` : ''}: `)) || impl.client;
    rl0.close();
  }
  client = client || impl.client || null;
  writeJson(IMPLEMENTATION_FILE, { ...impl, client });
  const verticals = await resolveVerticals({ ...args, 'change-vertical': interactive && !args.vertical }, { interactive, persist: true });

  if (!name && interactive) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    name = await ask(rl, '¿Cómo quieres llamar a tu aplicación Lightning? (obligatorio): ');
    logo = (await ask(rl, '¿Quieres agregar un logo? Ruta local PNG/JPG (Enter para usar el predeterminado): ')) || undefined;
    primary = (await ask(rl, 'Color principal HEX (opcional): ')) || undefined;
    secondary = (await ask(rl, 'Color secundario HEX (opcional): ')) || undefined;
    rl.close();
  }
  if (!name && previous) name = previous.appLabel;
  if (!name || typeof name !== 'string') fail('El nombre de la aplicación es obligatorio (--name "Mi App").');
  name = name.trim();
  if (name.length > 255) fail('El nombre de la aplicación excede 255 caracteres.');

  let p = normalizeHex(primary);
  let s = normalizeHex(secondary);
  if (p === undefined) fail(`Color principal inválido: ${primary}`);
  if (s === undefined) fail(`Color secundario inválido: ${secondary}`);

  let logoBuf;
  let logoSource;
  let paletteSource = p ? 'usuario' : 'predeterminada';
  if (logo && logo !== true) {
    const abs = path.resolve(process.cwd(), logo);
    logoBuf = normalizeLogo(abs);
    logoSource = path.basename(abs);
    if (!p || !s) {
      const proposed = proposePalette(logoBuf);
      if (proposed) {
        if (!p) { p = proposed.primary; paletteSource = 'propuesta desde el logo'; }
        if (!s && proposed.secondary) s = proposed.secondary;
      }
    }
  }
  if (!p) p = DEFAULTS.primary;
  if (!s) s = DEFAULTS.secondary;
  if (!logoBuf) {
    logoBuf = generateDefaultLogo(p, s);
    fs.mkdirSync(path.dirname(DEFAULT_LOGO), { recursive: true });
    fs.writeFileSync(DEFAULT_LOGO, logoBuf);
    logoSource = 'predeterminado (monograma ETC)';
  }

  const apiName = toApiName(name);

  // Static Resource (requerido por el Starter Pack) y ContentAsset (lo que referencia la app Lightning).
  const srDir = path.join(SRC, 'staticresources');
  fs.mkdirSync(srDir, { recursive: true });
  fs.writeFileSync(path.join(srDir, `${LOGO_NAME}.png`), logoBuf);
  fs.writeFileSync(
    path.join(srDir, `${LOGO_NAME}.resource-meta.xml`),
    `<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>image/png</contentType>
    <description>Logo de la aplicación Lightning (${escapeXml(name)}). Generado por npm run configure.</description>
</StaticResource>
`
  );
  const caDir = path.join(SRC, 'contentassets');
  fs.mkdirSync(caDir, { recursive: true });
  fs.writeFileSync(path.join(caDir, `${LOGO_NAME}.asset`), logoBuf);
  fs.writeFileSync(
    path.join(caDir, `${LOGO_NAME}.asset-meta.xml`),
    `<?xml version="1.0" encoding="UTF-8"?>
<ContentAsset xmlns="http://soap.sforce.com/2006/04/metadata">
    <isVisibleByExternalUsers>false</isVisibleByExternalUsers>
    <language>en_US</language>
    <masterLabel>${LOGO_NAME}</masterLabel>
    <relationships>
        <organization>
            <access>VIEWER</access>
        </organization>
    </relationships>
    <versions>
        <version>
            <number>1</number>
            <pathOnClient>${LOGO_NAME}.png</pathOnClient>
        </version>
    </versions>
</ContentAsset>
`
  );

  // Lightning App
  const appDir = path.join(SRC, 'applications');
  fs.mkdirSync(appDir, { recursive: true });
  if (previous && previous.appApiName && previous.appApiName !== apiName) {
    const old = path.join(appDir, `${previous.appApiName}.app-meta.xml`);
    if (fs.existsSync(old)) {
      fs.unlinkSync(old);
      console.log(c.yellow(`⚠ Se retiró del proyecto local la app anterior ${previous.appApiName}. No se elimina de la org.`));
    }
  }
  const app = fs
    .readFileSync(TEMPLATE, 'utf8')
    .replace(/{{APP_LABEL}}/g, escapeXml(name))
    .replace(/{{HEADER_COLOR}}/g, p)
    .replace(/{{LOGO}}/g, LOGO_NAME)
    .replace(/{{VERTICAL_LABEL}}/g, escapeXml(labelOf(verticals)))
    .replace('{{TABS}}', [...new Set(activeModules(verticals).flatMap((m) => m.appTabs))].map((t) => `    <tabs>${t}</tabs>`).join('\n'));
  fs.writeFileSync(path.join(appDir, `${apiName}.app-meta.xml`), app);

  // Visibilidad de la app en el perfil de administrador (no predeterminada)
  if (fs.existsSync(ADMIN_PROFILE)) {
    const prof = fs.readFileSync(ADMIN_PROFILE, 'utf8');
    fs.writeFileSync(
      ADMIN_PROFILE,
      prof.replace(/(<applicationVisibilities>\s*<application>)[^<]*(<\/application>)/, `$1${apiName}$2`)
    );
  }

  // Visibilidad de la app en el Permission Set base
  if (fs.existsSync(CORE_PS)) {
    const ps = fs.readFileSync(CORE_PS, 'utf8');
    const block = `<applicationVisibilities>\n        <application>${apiName}</application>\n        <visible>true</visible>\n    </applicationVisibilities>`;
    const updated = /<applicationVisibilities>[\s\S]*?<\/applicationVisibilities>/.test(ps)
      ? ps.replace(/<applicationVisibilities>[\s\S]*?<\/applicationVisibilities>/, block)
      : ps.replace(/(<PermissionSet[^>]*>\n)/, `$1    ${block}\n`);
    fs.writeFileSync(CORE_PS, updated);
  }

  const branding = {
    appLabel: name,
    appApiName: apiName,
    logo: {
      source: logoSource,
      staticResource: LOGO_NAME,
      contentAsset: LOGO_NAME,
      format: 'image/png'
    },
    colors: {
      primary: p,
      secondary: s,
      source: paletteSource,
      appliedTo: {
        primary: 'CustomApplication.brand.headerColor (barra de navegación de la app)',
        secondary: 'Se conserva en configuración; Lightning App metadata no expone un segundo color. Se usa en el logo predeterminado.'
      }
    },
    overridesOrgTheme: true,
    modifiesGlobalTheme: false,
    generatedAt: new Date().toISOString()
  };
  writeJson(BRANDING_FILE, branding);

  console.log(c.green('✔ Configuración lista'));
  console.log(`  Cliente:    ${client || '(sin nombre)'}`);
  console.log(`  Vertical:   base común + ${labelOf(verticals)}  (config/implementation.json)`);
  console.log(`  Aplicación: ${name} (${apiName})`);
  console.log(`  Logo:       ${logoSource}`);
  console.log(`  Colores:    principal ${p} · secundario ${s} (${paletteSource})`);
  console.log(`  Archivo:    ${path.relative(ROOT, BRANDING_FILE)}`);
}

main().catch((e) => fail(e.stack || e.message));
