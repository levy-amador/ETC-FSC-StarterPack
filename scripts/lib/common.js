'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const MODULES_DIR = path.join(ROOT, 'modules');
const moduleSrc = (id) => path.join(MODULES_DIR, id, 'main', 'default');
// La base común contiene la app, el branding y la seguridad transversal.
const SRC = moduleSrc('common');
const BRANDING_FILE = path.join(ROOT, 'config', 'branding', 'client-branding.json');
const MODULES_FILE = path.join(ROOT, 'config', 'modules.json');
const IMPLEMENTATION_FILE = path.join(ROOT, 'config', 'implementation.json');
const CATALOG_FILE = path.join(ROOT, 'config', 'catalog', 'fsc-catalog.json');

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`
};

function fail(msg, code = 1) {
  console.error(c.red(`✖ ${msg}`));
  process.exit(code);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// Ejecuta `sf` y devuelve el JSON parseado. Nunca imprime tokens.
function sf(args, { allowFail = false } = {}) {
  const res = spawnSync('sf', [...args, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 200,
    env: { ...process.env, SF_DISABLE_AUTOUPDATE: 'true', SF_AUTOUPDATE_DISABLE: 'true' }
  });
  if (res.error) fail(`No se pudo ejecutar Salesforce CLI: ${res.error.message}`);
  const text = (res.stdout || '').trim();
  const start = text.indexOf('{');
  let json;
  try {
    json = JSON.parse(start >= 0 ? text.slice(start) : text);
  } catch {
    json = { status: res.status || 1, message: (res.stderr || text).trim() };
  }
  if (json.status !== 0 && !allowFail) {
    fail(`sf ${args.slice(0, 3).join(' ')} falló: ${json.message || json.name}`);
  }
  return json;
}

function targetOrg(args) {
  return args['target-org'] || process.env.SF_TARGET_ORG || readJson(path.join(ROOT, '.sf', 'config.json'), {})['target-org'];
}

function query(org, soql, { tooling = false, allowFail = false } = {}) {
  const a = ['data', 'query', '--query', soql, '--target-org', org];
  if (tooling) a.push('--use-tooling-api');
  const r = sf(a, { allowFail });
  return r.status === 0 ? r.result.records : null;
}

// Identidad de la org sin `sf org display` (ese comando devuelve el access token).
function orgIdentity(org) {
  const aliases = sf(['alias', 'list'], { allowFail: true }).result || [];
  const hit = aliases.find((a) => a.alias === org);
  const row = (query(org, 'SELECT Id, Name, OrganizationType, IsSandbox, InstanceName FROM Organization') || [])[0] || {};
  return { alias: org, username: hit ? hit.value : org, orgId: row.Id, orgName: row.Name, edition: row.OrganizationType, isSandbox: row.IsSandbox, instance: row.InstanceName };
}

function listFiles(dir, filter = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, filter));
    else if (e.name !== '.gitkeep' && filter(p)) out.push(p);
  }
  return out;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

module.exports = {
  ROOT, SRC, MODULES_DIR, BRANDING_FILE, MODULES_FILE, IMPLEMENTATION_FILE, CATALOG_FILE,
  c, fail, parseArgs, readJson, writeJson, sf, query, orgIdentity, targetOrg, listFiles, timestamp, moduleSrc
};
