#!/usr/bin/env node
'use strict';
// npm run build [-- --target-org ALIAS] [--vertical insurance|banking|wealth] [--skip-org]
// Construye SOLO la base común + la vertical seleccionada para el cliente (config/implementation.json).
// Genera un manifest por etapa (manifest/) y el paquete Metadata API de cada etapa (build/mdapi/<etapa>).
// Con una org destino, además:
//   - toma una instantánea de la configuración actual (build/org-snapshot) para auditoría y reversión,
//   - combina los Standard Value Sets ETC con los valores existentes (los no ETC quedan inactivos, no se eliminan),
//   - genera el cambio de OWD sobre la definición actual de cada objeto (sin alterar otras propiedades).
const fs = require('fs');
const path = require('path');
const { ROOT, c, fail, parseArgs, readJson, writeJson, sf, query, orgIdentity, targetOrg, listFiles, moduleSrc, syncDuplicates } = require('../lib/common');
const { resolveVerticals, activeModules, labelOf } = require('../lib/vertical');
const { STAGES, componentOf } = require('./stages');

const API = readJson(path.join(ROOT, 'sfdx-project.json')).sourceApiVersion;
const BUILD = path.join(ROOT, 'build');
const MDAPI = path.join(BUILD, 'mdapi');
const SNAP = path.join(BUILD, 'org-snapshot');
const MANIFEST = path.join(ROOT, 'manifest');

function packageXml(types) {
  const body = Object.keys(types)
    .sort()
    .map((t) => `    <types>\n${[...types[t]].sort().map((m) => `        <members>${m}</members>\n`).join('')}        <name>${t}</name>\n    </types>\n`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n${body}    <version>${API}</version>\n</Package>\n`;
}

// Recorre los módulos activos y asigna cada componente a su etapa. Un mismo componente no puede vivir
// en dos módulos (los módulos se despliegan juntos y uno sobrescribiría al otro).
function collect(mods) {
  const stages = STAGES.map((s) => ({ ...s, components: [] }));
  const unassigned = [];
  const owner = new Map();
  for (const mod of mods) {
    const src = moduleSrc(mod.id);
    const files = listFiles(src).map((p) => path.relative(src, p).split(path.sep).join('/'));
    for (const rel of files) {
      const comp = componentOf(rel);
      if (!comp) continue;
      const key = `${comp[0]}:${comp[1]}`;
      if (owner.has(key)) fail(`${key} está definido en los módulos ${owner.get(key)} y ${mod.id}. Debe vivir en uno solo.`);
      owner.set(key, mod.id);
      const stage = stages.find((s) => s.match.some((r) => r.test(rel)));
      if (!stage) {
        unassigned.push(`${mod.id}: ${rel}`);
        continue;
      }
      stage.components.push({ type: comp[0], member: comp[1], rel, module: mod.id });
    }
  }
  if (unassigned.length) fail(`Archivos sin etapa asignada:\n  ${unassigned.join('\n  ')}`);
  return stages;
}

function retrieve(types, outDir) {
  const tmp = path.join(outDir, '_package.xml');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(tmp, packageXml(types));
  const res = sf(['project', 'retrieve', 'start', '--manifest', tmp, '--target-metadata-dir', outDir, '--unzip', '--target-org', ORG, '--wait', '30']);
  fs.unlinkSync(tmp);
  const found = {};
  for (const f of listFiles(outDir)) found[path.basename(f)] = f;
  return { res, found };
}

// ---------- Standard Value Sets: valores ETC activos + valores existentes desactivados
function mergeStandardValueSets(stageDir) {
  const svsDir = path.join(stageDir, 'standardValueSets');
  if (!fs.existsSync(svsDir)) return [];
  const names = fs.readdirSync(svsDir).map((f) => f.replace('.standardValueSet', ''));
  const { found } = retrieve({ StandardValueSet: new Set(names) }, path.join(SNAP, 'standardValueSets'));
  const report = [];
  for (const name of names) {
    const file = path.join(svsDir, `${name}.standardValueSet`);
    const ours = fs.readFileSync(file, 'utf8');
    const orgFile = found[`${name}.standardValueSet`];
    if (!orgFile) {
      report.push(`${name}: no existe en la org, se despliega tal cual`);
      continue;
    }
    const org = fs.readFileSync(orgFile, 'utf8');
    const ourNames = new Set([...ours.matchAll(/<fullName>([^<]+)<\/fullName>/g)].map((m) => m[1]));
    const extra = [...org.matchAll(/    <standardValue>[\s\S]*?<\/standardValue>\n/g)]
      .map((m) => m[0])
      .filter((block) => !ourNames.has(block.match(/<fullName>([^<]+)<\/fullName>/)[1]))
      .map((block) =>
        block
          .replace(/<default>true<\/default>/, '<default>false</default>')
          .replace(/\s*<isActive>[^<]*<\/isActive>/, '')
          .replace(/(\n    <\/standardValue>)/, '\n        <isActive>false</isActive>$1')
      );
    if (extra.length) {
      fs.writeFileSync(file, ours.replace('</StandardValueSet>', extra.join('') + '</StandardValueSet>'));
      report.push(`${name}: ${extra.length} valores existentes se conservan como inactivos`);
    } else report.push(`${name}: sin valores adicionales en la org`);
  }
  return report;
}

// ---------- OWD: definición actual del objeto con sharingModel/externalSharingModel objetivo
const CHILD_BLOCKS = ['fields', 'listViews', 'validationRules', 'webLinks', 'recordTypes', 'businessProcesses', 'compactLayouts', 'fieldSets', 'sharingReasons', 'indexes'];
function sharingTargets(mods) {
  const cfg = readJson(path.join(ROOT, 'config', 'sharing-model.json'));
  const out = {};
  for (const m of mods) Object.assign(out, (cfg.modules[m.id] || {}).objects || {});
  return out;
}
function buildSharingModel(stageDir, mods) {
  const targets = sharingTargets(mods);
  const objects = Object.keys(targets);
  if (!objects.length) return { report: ['Sin objetos con OWD objetivo'], changed: [] };
  const { found } = retrieve({ CustomObject: new Set(objects) }, path.join(SNAP, 'objects'));
  const outDir = path.join(stageDir, 'objects');
  fs.mkdirSync(outDir, { recursive: true });
  const report = [];
  const changed = [];
  for (const obj of objects) {
    const f = found[`${obj}.object`];
    if (!f) fail(`No se pudo recuperar la definición de ${obj} desde la org.`);
    let xml = fs.readFileSync(f, 'utf8');
    for (const tag of CHILD_BLOCKS) xml = xml.replace(new RegExp(`^    <${tag}>[\\s\\S]*?^    </${tag}>\\n`, 'gm'), '');
    const before = {
      sharingModel: (xml.match(/<sharingModel>([^<]+)</) || [])[1],
      externalSharingModel: (xml.match(/<externalSharingModel>([^<]+)</) || [])[1]
    };
    const target = targets[obj];
    if (before.sharingModel === target.sharingModel && before.externalSharingModel === target.externalSharingModel) {
      report.push(`${obj}: ya está en ${target.sharingModel}; no se modifica`);
      continue;
    }
    changed.push(obj);
    for (const [k, v] of Object.entries(target)) {
      const re = new RegExp(`<${k}>[^<]*</${k}>`);
      xml = re.test(xml) ? xml.replace(re, `<${k}>${v}</${k}>`) : xml.replace('</CustomObject>', `    <${k}>${v}</${k}>\n</CustomObject>`);
    }
    fs.writeFileSync(path.join(outDir, `${obj}.object`), xml);
    report.push(`${obj}: ${before.sharingModel} → ${target.sharingModel} (externo ${before.externalSharingModel} → ${target.externalSharingModel})`);
  }
  if (changed.length) fs.writeFileSync(path.join(stageDir, 'package.xml'), packageXml({ CustomObject: new Set(changed) }));
  else fs.rmSync(stageDir, { recursive: true, force: true });
  return { report, changed };
}

// ---------- Duplicate Rules: el orden debe continuar después de las reglas que ya existen en la org
function sequenceDuplicateRules(stageDir) {
  const dir = path.join(stageDir, 'duplicateRules');
  if (!fs.existsSync(dir)) return [];
  const existing = {};
  // Solo el retrieve distingue Account de PersonAccount (en SOQL y en la lista de metadata ambas salen como Account).
  const { found } = retrieve({ DuplicateRule: new Set(['*']) }, path.join(SNAP, 'duplicateRules'));
  for (const file of Object.keys(found).filter((f) => f.endsWith('.duplicateRule'))) {
    const [obj, name] = file.split('.');
    if (!name.startsWith('ETC_')) existing[obj] = (existing[obj] || 0) + 1;
  }
  const next = {};
  const report = [];
  for (const f of fs.readdirSync(dir).sort()) {
    const obj = f.split('.')[0];
    next[obj] = (next[obj] ?? existing[obj] ?? 0) + 1;
    const p = path.join(dir, f);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/<sortOrder>\d+<\/sortOrder>/, `<sortOrder>${next[obj]}</sortOrder>`));
  }
  for (const [o, n] of Object.entries(next)) report.push(`${o}: ${existing[o] || 0} reglas existentes; las ETC van de la ${(existing[o] || 0) + 1} a la ${n}`);
  return report;
}

// ---------- Case Settings: la regla de asignación de casos exige propietario predeterminado y usuario automatizado.
// Son datos de la org (un usuario), así que no viven en el repo: si faltan, se definen con la cola
// ETC_Servicio_General y el usuario que despliega (se pueden cambiar después en Setup › Configuración de casos).
function caseSettings(stageDir) {
  if (!ASSIGNMENT_RULES) return [];
  const { found } = retrieve({ Settings: new Set(['Case']) }, path.join(SNAP, 'settings'));
  const cur = found['Case.settings'] ? fs.readFileSync(found['Case.settings'], 'utf8') : '';
  const hasUser = /<defaultCaseUser>[^<]+<\/defaultCaseUser>/.test(cur);
  const hasOwner = /<defaultCaseOwner>[^<]+<\/defaultCaseOwner>/.test(cur);
  if (hasUser && hasOwner) return ['Case Settings: la org ya tiene propietario y usuario automatizado de casos; no se modifican'];
  const user = orgIdentity(ORG).username;
  const parts = [];
  if (!hasOwner) parts.push('    <defaultCaseOwner>ETC_Servicio_General</defaultCaseOwner>\n    <defaultCaseOwnerType>Queue</defaultCaseOwnerType>');
  if (!hasUser) parts.push(`    <defaultCaseUser>${user}</defaultCaseUser>`);
  fs.mkdirSync(path.join(stageDir, 'settings'), { recursive: true });
  fs.writeFileSync(path.join(stageDir, 'settings', 'Case.settings'), `<?xml version="1.0" encoding="UTF-8"?>\n<CaseSettings xmlns="http://soap.sforce.com/2006/04/metadata">\n${parts.join('\n')}\n</CaseSettings>\n`);
  const pkg = path.join(stageDir, 'package.xml');
  fs.writeFileSync(pkg, fs.readFileSync(pkg, 'utf8').replace('    <version>', '    <types>\n        <members>Case</members>\n        <name>Settings</name>\n    </types>\n    <version>'));
  return [`Case Settings: ${!hasOwner ? 'propietario predeterminado = cola ETC_Servicio_General; ' : ''}${!hasUser ? `usuario automatizado = ${user}` : ''} (ajustable en Setup)`];
}

let ORG;
let ASSIGNMENT_RULES = false;
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dups = syncDuplicates(['modules', 'config']);
  if (dups.length) fail(`Hay ${dups.length} copias " 2" (sincronización de iCloud/Dropbox). Mueve el proyecto fuera de carpetas sincronizadas y bórralas:\n  ${dups.slice(0, 10).join('\n  ')}`);
  const selected = await resolveVerticals(args, { interactive: true });
  const mods = activeModules(selected);
  const ui = readJson(path.join(ROOT, 'config', 'generated-ui.json'), { verticals: [] });
  if ([...ui.verticals].sort().join(',') !== [...selected].sort().join(',')) {
    fail(`La interfaz (layouts, perfiles y app) se generó para "${ui.verticals.join(',') || 'sin vertical'}" y el build es para "${selected.join(',')}". Ejecuta npm run configure (o node scripts/generate/gen-ui.js --vertical ${selected.join(',')}).`);
  }
  ORG = args['skip-org'] ? null : targetOrg(args);
  console.log(c.bold(`Build · base común + ${labelOf(selected)}${ORG ? ` · org ${ORG}` : ' · sin org'}`));
  const stages = collect(mods);

  fs.rmSync(MDAPI, { recursive: true, force: true });
  fs.mkdirSync(MDAPI, { recursive: true });
  fs.mkdirSync(MANIFEST, { recursive: true });
  for (const f of fs.readdirSync(MANIFEST)) if (/^package-.*\.xml$/.test(f)) fs.unlinkSync(path.join(MANIFEST, f));

  const summary = { builtAt: new Date().toISOString(), apiVersion: API, targetOrg: ORG || null, verticals: selected, modules: mods.map((m) => m.id), stages: [] };
  for (const s of stages) {
    const stageDir = path.join(MDAPI, s.id);
    const entry = { id: s.id, label: s.label, components: s.components.length, byModule: {}, notes: [] };
    for (const comp of s.components) entry.byModule[comp.module] = (entry.byModule[comp.module] || 0) + 1;
    if (s.components.length) {
      const types = {};
      for (const comp of s.components) (types[comp.type] ||= new Set()).add(comp.member);
      const manifest = path.join(MANIFEST, `package-${s.id}.xml`);
      fs.writeFileSync(manifest, packageXml(types));
      sf(['project', 'convert', 'source', '--manifest', manifest, '--output-dir', stageDir]);
      entry.types = Object.fromEntries(Object.entries(types).map(([k, v]) => [k, [...v].sort()]));
    }
    if (s.dynamic === 'standardValueSets' && s.components.length) {
      if (ORG) entry.notes.push(...mergeStandardValueSets(stageDir));
      else entry.notes.push('Sin org: los Standard Value Sets se construyen sin combinar con los valores existentes.');
    }
    if (s.id === '08-queues-routing' && s.components.length) {
      ASSIGNMENT_RULES = stages.some((x) => x.id === '08b-assignment-rules' && x.components.length);
      if (ORG) { const n = caseSettings(stageDir); entry.notes.push(...n); summary.caseSettingsPending = n.some((x) => !x.includes('no se modifican')); }
      else entry.notes.push('Sin org: la configuración de casos (propietario y usuario automatizado) se resuelve al construir contra la org.');
    }
    if (s.id === '05-duplicate-rules' && s.components.length) {
      if (ORG) entry.notes.push(...sequenceDuplicateRules(stageDir));
      else entry.notes.push('Sin org: el orden de las Duplicate Rules no se ajusta a las reglas existentes.');
    }
    if (s.dynamic === 'sharingModel') {
      if (ORG) {
        const { report, changed } = buildSharingModel(stageDir, mods);
        entry.notes.push(...report);
        entry.components = changed.length;
        entry.types = { CustomObject: changed };
      } else entry.notes.push('Sin org: la etapa de OWD requiere la definición actual de los objetos y se omite.');
    }
    summary.stages.push(entry);
    const mark = entry.components ? c.green('✔') : c.yellow('–');
    console.log(`${mark} ${s.id.padEnd(24)} ${String(entry.components).padStart(3)} componentes  ${s.label}`);
    for (const n of entry.notes) console.log(`    · ${n}`);
  }
  writeJson(path.join(BUILD, 'build-summary.json'), summary);
  console.log(c.bold(`\nBuild listo en build/mdapi (${summary.stages.reduce((a, s) => a + s.components, 0)} componentes, ${stages.length} etapas).`));
}

main().catch((e) => fail(e.stack || e.message));
