#!/usr/bin/env node
'use strict';
// npm run validate [-- --target-org ALIAS] [--local-only] [--stage 03-validation-rules]
// 1) Validaciones locales sobre TODOS los módulos (base común + 3 verticales): XML bien formado, prefijo ETC_,
//    sin referencias al paquete gestionado FinServ__ (modelo FSC Core), componentes no duplicados entre módulos,
//    permisos sin privilegios administrativos, referencias entre componentes, branding y catálogo.
// 2) Validación real (check-only, no modifica la org) de las etapas construidas por `npm run build`
//    (base común + vertical seleccionada).
const fs = require('fs');
const path = require('path');
const { ROOT, BRANDING_FILE, CATALOG_FILE, c, fail, parseArgs, readJson, writeJson, sf, targetOrg, listFiles, timestamp, moduleSrc } = require('../lib/common');
const { modules, labelOf } = require('../lib/vertical');
const { STAGES, componentOf } = require('../deploy/stages');
const png = require('../lib/png');

const errors = [];
const warnings = [];
const ok = [];
const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(p, 'utf8');

function checkXml(file) {
  const xml = read(file);
  if (!xml.startsWith('<?xml')) return 'falta la declaración XML';
  const body = xml.replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(body)) return 'contiene "&" sin escapar';
  const stack = [];
  const re = /<(\/?)([A-Za-z_][\w:.-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(body))) {
    const [, close, name, , selfClose] = m;
    if (selfClose) continue;
    if (close) {
      const top = stack.pop();
      if (top !== name) return `etiqueta </${name}> no coincide con <${top}>`;
    } else stack.push(name);
  }
  if (stack.length) return `etiquetas sin cerrar: ${stack.join(', ')}`;
  return null;
}

function localChecks() {
  const mods = modules();
  const owner = new Map();
  const components = new Set();
  let xmlCount = 0;
  const fieldSet = new Set();
  const psNames = new Set();
  const reports = new Set();
  const roles = {};
  for (const m of mods) {
    const src = moduleSrc(m.id);
    if (!fs.existsSync(src)) { errors.push(`Falta la carpeta del módulo ${m.id}`); continue; }
    for (const f of listFiles(src)) {
      const r = path.relative(src, f).split(path.sep).join('/');
      if (f.endsWith('.xml')) {
        xmlCount++;
        const e = checkXml(f);
        if (e) errors.push(`XML inválido ${rel(f)}: ${e}`);
        const x = read(f);
        if (/FinServ__/.test(x)) errors.push(`${rel(f)}: referencia al paquete gestionado FinServ__ (este Starter Pack usa FSC Core)`);
      }
      const comp = componentOf(r);
      if (!comp) continue;
      const key = `${comp[0]}:${comp[1]}`;
      if (owner.has(key)) errors.push(`${key} está duplicado en ${owner.get(key)} y ${m.id}`);
      owner.set(key, m.id);
      components.add(key);
      if (!STAGES.some((s) => s.match.some((re) => re.test(r)))) errors.push(`${rel(f)}: sin etapa de despliegue asignada`);
      const x = f.endsWith('.xml') ? read(f) : '';
      if (comp[0] === 'CustomField') {
        const [obj, api] = comp[1].split('.');
        if (!/^[A-Za-z][A-Za-z0-9_]{0,39}__c$/.test(api)) errors.push(`API Name inválido: ${comp[1]}`);
        if (!obj.endsWith('__mdt') && !api.startsWith('ETC_')) errors.push(`Campo sin prefijo ETC_: ${comp[1]}`);
        fieldSet.add(comp[1]);
      }
      if (comp[0] === 'CustomObject' && /__(c|mdt)$/.test(comp[1]) && !comp[1].startsWith('ETC_')) errors.push(`Objeto sin prefijo ETC_: ${comp[1]}`);
      if (comp[0] === 'CustomObject' && !/__(c|mdt)$/.test(comp[1])) warnings.push(`${rel(f)}: definición de objeto estándar en el repo; el OWD se maneja en config/sharing-model.json`);
      if (comp[0] === 'PermissionSet') {
        psNames.add(comp[1]);
        if (/<(modifyAllRecords|viewAllRecords)>true</.test(x)) errors.push(`${rel(f)}: otorga View All / Modify All`);
        for (const p of ['ModifyAllData', 'ViewAllData', 'ManageUsers', 'CustomizeApplication', 'AuthorApex', 'ManageProfilesPermissionsets']) if (x.includes(`<name>${p}</name>`)) errors.push(`${rel(f)}: otorga ${p}`);
      }
      if (comp[0] === 'Role') roles[comp[1]] = (x.match(/<parentRole>([^<]+)</) || [])[1];
      if (comp[0] === 'Report' && r.endsWith('.report-meta.xml')) reports.add(comp[1]);
      if (comp[0] === 'Flow' && !/<status>Active<\/status>/.test(x)) warnings.push(`${rel(f)}: no está activo`);
    }
  }
  ok.push(`XML bien formado y sin FinServ__ (${xmlCount} archivos en ${mods.length} módulos)`);
  ok.push(`Componentes únicos entre módulos (${components.size}) · campos ETC_ (${fieldSet.size})`);

  // Referencias cruzadas que pueden revisarse sin org
  for (const m of mods) {
    const src = moduleSrc(m.id);
    for (const f of listFiles(path.join(src, 'permissionsetgroups'))) for (const x of read(f).matchAll(/<permissionSets>([^<]+)</g)) if (!psNames.has(x[1])) errors.push(`${rel(f)}: Permission Set ${x[1]} no existe`);
    for (const f of listFiles(path.join(src, 'dashboards'), (p) => p.endsWith('.dashboard-meta.xml'))) for (const x of read(f).matchAll(/<report>([^<]+)<\/report>/g)) if (!reports.has(x[1])) errors.push(`${rel(f)}: reporte ${x[1]} no existe`);
    for (const f of listFiles(path.join(src, 'objects'), (p) => p.endsWith('.validationRule-meta.xml') || p.endsWith('.listView-meta.xml'))) {
      const obj = f.split(path.sep).slice(-3)[0];
      for (const x of read(f).matchAll(/\b(ETC_[A-Za-z0-9_]+__c)\b/g)) if (!fieldSet.has(`${obj}.${x[1]}`)) errors.push(`${rel(f)}: el campo ${obj}.${x[1]} no existe en el paquete`);
    }
  }
  for (const [r, p] of Object.entries(roles)) if (p && !(p in roles)) errors.push(`Rol ${r}: rol padre ${p} no existe en el paquete`);
  ok.push(`Permisos (${psNames.size} PS), roles (${Object.keys(roles).length}), reportes (${reports.size}) y referencias`);

  // Branding (si ya se configuró)
  const branding = readJson(BRANDING_FILE, null);
  if (!branding) warnings.push('Branding sin configurar: ejecuta npm run configure');
  else {
    const src = moduleSrc('common');
    const app = path.join(src, 'applications', `${branding.appApiName}.app-meta.xml`);
    if (!fs.existsSync(app)) errors.push(`No existe la app ${branding.appApiName}`);
    else if (!read(app).includes(`<headerColor>${branding.colors.primary}</headerColor>`)) errors.push('El color principal de la app no coincide con el branding');
    for (const f of [path.join(src, 'staticresources', 'ETC_App_Logo.png'), path.join(src, 'contentassets', 'ETC_App_Logo.asset')]) {
      try {
        const img = png.decode(fs.readFileSync(f));
        if (img.width > 1024 || img.height > 1024) warnings.push(`${rel(f)}: logo mayor a 1024 px`);
      } catch (e) {
        errors.push(`${rel(f)}: logo inválido (${e.message})`);
      }
    }
    ok.push(`Aplicación ${branding.appApiName}, logo y colores`);
  }

  // Catálogo: IDs únicos, módulos válidos, estados válidos y componentes declarados existentes
  const cat = readJson(CATALOG_FILE);
  const ids = new Set();
  const modIds = new Set(mods.map((m) => m.id));
  for (const it of cat.items) {
    if (ids.has(it.id)) errors.push(`Catálogo: ID duplicado ${it.id}`);
    ids.add(it.id);
    if (!modIds.has(it.module)) errors.push(`Catálogo: ${it.id} apunta a un módulo inexistente (${it.module})`);
    if (!(it.estado in cat.estados)) errors.push(`Catálogo: ${it.id} tiene estado inválido "${it.estado}"`);
    for (const k of it.componentes || []) if (!components.has(k)) errors.push(`Catálogo: ${it.id} declara ${k}, que no existe en el repo`);
    if (['Construido', 'Validado en org'].includes(it.estado) && !(it.componentes || []).length) errors.push(`Catálogo: ${it.id} está "${it.estado}" sin componentes declarados`);
  }
  // Especificación de la base común: consistencia entre diccionario y matriz de acceso
  const dd = readJson(path.join(ROOT, 'config', 'spec', 'common-data-dictionary.json'), null);
  const am = readJson(path.join(ROOT, 'config', 'spec', 'common-access-matrix.json'), null);
  if (dd && am) {
    const specFields = new Set(dd.fields.map((f) => `${f.object}.${f.apiName}`));
    for (const f of dd.fields) {
      if (!/^ETC_[A-Za-z0-9_]{1,36}__c$/.test(f.apiName)) errors.push(`Spec: API Name inválido ${f.object}.${f.apiName}`);
      if (f.type === 'Picklist' && !(f.values || []).length) errors.push(`Spec: ${f.object}.${f.apiName} es lista sin valores`);
      if (!ids.has(f.catalog)) errors.push(`Spec: ${f.object}.${f.apiName} apunta a un ítem de catálogo inexistente (${f.catalog})`);
    }
    for (const v of dd.validationRules) for (const m of v.formula.matchAll(/\b(ETC_[A-Za-z0-9_]+__c)\b/g)) if (!specFields.has(`${v.object}.${m[1]}`)) errors.push(`Spec: la validación ${v.object}.${v.name} usa ${m[1]}, que no está en el diccionario`);
    for (const r of dd.duplicateRules) for (const fld of r.fields) if (/^ETC_/.test(fld)) { const base = fld.replace(/__pc$/, '__c'); if (!specFields.has(`${r.object}.${base}`) && !specFields.has(`Contact.${base}`)) errors.push(`Spec: la regla ${r.name} usa ${fld}, que no está en el diccionario`); }
    for (const f of Object.keys(am.fieldSecurity)) if (!specFields.has(f)) errors.push(`Spec: seguridad de campo para ${f}, que no está en el diccionario`);
    const roleNames = new Set(am.roles.map((r) => r.name));
    for (const r of am.roles) if (r.parent && !roleNames.has(r.parent)) errors.push(`Spec: el rol ${r.name} tiene un padre inexistente (${r.parent})`);
    const psNames = new Set(am.permissionSets.map((p) => p.name));
    for (const [g, l] of Object.entries(am.permissionSetGroups)) for (const x of l) if (!psNames.has(x)) errors.push(`Spec: ${g} incluye ${x}, que no está definido`);
    for (const p of am.personas) { if (p.role && !roleNames.has(p.role)) errors.push(`Spec: la persona ${p.id} usa el rol inexistente ${p.role}`); if (p.psg && !am.permissionSetGroups[p.psg]) errors.push(`Spec: la persona ${p.id} usa el PSG inexistente ${p.psg}`); }
    for (const [o, m] of Object.entries(am.objectPermissions)) for (const v of Object.values(m)) if (/D/.test(v)) errors.push(`Spec: ${o} otorga eliminar a un usuario operativo`);
    ok.push(`Especificación base común (${dd.fields.length} campos, ${dd.validationRules.length} validaciones, ${am.personas.length} personas, ${am.roles.length} roles)`);
  }
  const done = cat.items.filter((i) => ['Construido', 'Validado en org'].includes(i.estado)).length;
  ok.push(`Catálogo (${cat.items.length} ítems, ${done} construidos)`);
}

// ---------- Validación real contra la org (check-only)

const CHILD_TYPE = { fields: 'CustomField', validationRules: 'ValidationRule', listViews: 'ListView', businessProcesses: 'BusinessProcess' };
// Elementos de primer nivel de un .object en formato Metadata API.
function objectElements(xml) {
  const inner = xml.replace(/^[\s\S]*?<CustomObject[^>]*>\n?/, '').replace(/<\/CustomObject>\s*$/, '');
  const out = [];
  const re = /^    <([A-Za-z]+)>[\s\S]*?^    <\/\1>\n|^    <([A-Za-z]+)>[^\n]*<\/\2>\n|^    <([A-Za-z]+)\/>\n/gm;
  let m;
  while ((m = re.exec(inner))) {
    const tag = m[1] || m[2] || m[3];
    const name = CHILD_TYPE[tag] ? (m[0].match(/<fullName>([^<]+)<\/fullName>/) || [])[1] : null;
    out.push({ tag, type: CHILD_TYPE[tag], name, xml: m[0] });
  }
  return out;
}
function writeObject(file, elements) {
  const seen = new Set();
  const uniq = elements.filter((e) => {
    const key = e.name ? `${e.tag}:${e.name}` : e.xml;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  uniq.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>\n<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">\n${uniq.map((e) => e.xml).join('')}</CustomObject>\n`);
}
const MDAPI_DIRS = { flexipages: ['FlexiPage', '.flexipage'], flows: ['Flow', '.flow'], layouts: ['Layout', '.layout'], applications: ['CustomApplication', '.app'], permissionsets: ['PermissionSet', '.permissionset'], permissionsetgroups: ['PermissionSetGroup', '.permissionsetgroup'], profiles: ['Profile', '.profile'], pathAssistants: ['PathAssistant', '.pathAssistant'], duplicateRules: ['DuplicateRule', '.duplicateRule'] };
function componentFromMdapi(relPath) {
  const [dir, ...rest] = relPath.split('/');
  if (dir === 'reports' || dir === 'dashboards') {
    const type = dir === 'reports' ? 'Report' : 'Dashboard';
    return [type, rest.join('/').replace(/(\.report|\.dashboard|-meta\.xml)$/, '')];
  }
  const d = MDAPI_DIRS[dir];
  if (!d) return null;
  return [d[0], rest.join('/').replace(d[1], '').replace(/-meta\.xml$/, '')];
}
function mergePackages(stageIds, outDir, exclude) {
  fs.rmSync(outDir, { recursive: true, force: true });
  const types = {};
  const skipped = [];
  for (const id of stageIds) {
    const dir = path.join(ROOT, 'build', 'mdapi', id);
    if (!fs.existsSync(path.join(dir, 'package.xml'))) continue;
    const pkg = read(path.join(dir, 'package.xml'));
    for (const t of pkg.matchAll(/<types>([\s\S]*?)<\/types>/g)) {
      const name = t[1].match(/<name>([^<]+)</)[1];
      for (const m of t[1].matchAll(/<members>([^<]+)</g)) {
        if (exclude(id, name, m[1])) { skipped.push(`${name}:${m[1]}`); continue; }
        (types[name] ||= new Set()).add(m[1]);
      }
    }
    for (const f of listFiles(dir)) {
      if (path.basename(f) === 'package.xml') continue;
      const relPath = path.relative(dir, f).split(path.sep).join('/');
      const dest = path.join(outDir, relPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (relPath.endsWith('.object')) {
        // En formato Metadata API los campos, validaciones, list views y OWD comparten el archivo .object.
        const obj = path.basename(relPath, '.object');
        const parts = objectElements(read(f)).filter((e) => !(e.name && exclude(id, e.type, `${obj}.${e.name}`)));
        const existing = fs.existsSync(dest) ? objectElements(read(dest)) : [];
        writeObject(dest, [...existing, ...parts]);
        continue;
      }
      const comp = componentFromMdapi(relPath);
      if (comp && exclude(id, comp[0], comp[1])) continue;
      fs.copyFileSync(f, dest);
    }
  }
  for (const f of listFiles(outDir, (p) => p.endsWith('.object'))) if (!objectElements(read(f)).length) fs.unlinkSync(f);
  const api = readJson(path.join(ROOT, 'sfdx-project.json')).sourceApiVersion;
  const body = Object.keys(types).sort().map((t) => `    <types>\n${[...types[t]].sort().map((m) => `        <members>${m}</members>\n`).join('')}        <name>${t}</name>\n    </types>\n`).join('');
  fs.writeFileSync(path.join(outDir, 'package.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n${body}    <version>${api}</version>\n</Package>\n`);
  return { count: Object.values(types).reduce((a, s) => a + s.size, 0), skipped };
}

function orgCheck(org, stageArg) {
  const summary = readJson(path.join(ROOT, 'build', 'build-summary.json'), null);
  if (!summary) fail('No existe build/build-summary.json: ejecuta npm run build primero.');
  const ids = stageArg ? String(stageArg).split(',') : STAGES.map((s) => s.id);
  const outDir = path.join(ROOT, 'build', 'mdapi', '_validate');
  const { count } = mergePackages(ids, outDir, () => false);
  console.log(`\nValidación check-only en ${c.bold(org)} · base común + ${labelOf(summary.verticals || [])} (${count} componentes)...`);
  if (!count) return { success: true, components: 0, failures: [], note: 'Sin componentes que validar' };
  const res = sf(['project', 'deploy', 'start', '--dry-run', '--metadata-dir', outDir, '--target-org', org, '--test-level', 'NoTestRun', '--wait', '60'], { allowFail: true });
  const r = res.result || {};
  const failures = [].concat(r.details?.componentFailures || []).map((f) => `${f.componentType} ${f.fullName}: ${f.problem}`);
  const out = { validatedAt: new Date().toISOString(), org, verticals: summary.verticals, stages: ids, components: count, success: !!r.success, status: r.status || res.message, deployId: r.id, failures };
  writeJson(path.join(ROOT, 'build', 'validation-result.json'), out);
  fs.mkdirSync(path.join(ROOT, 'build', 'deploy-results'), { recursive: true });
  writeJson(path.join(ROOT, 'build', 'deploy-results', `validate-${timestamp()}.json`), out);
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(c.bold('Validaciones locales'));
  localChecks();
  ok.forEach((m) => console.log(`  ${c.green('✔')} ${m}`));
  warnings.forEach((m) => console.log(`  ${c.yellow('⚠')} ${m}`));
  errors.forEach((m) => console.log(`  ${c.red('✖')} ${m}`));
  if (errors.length) fail(`${errors.length} errores locales. Corrige antes de validar contra la org.`);
  if (args['local-only']) return;

  const org = targetOrg(args);
  if (!org) fail('Indica la org con --target-org o usa --local-only.');
  const out = orgCheck(org, args.stage);
  if (out.success) console.log(c.green(`✔ Validación real exitosa (${out.components} componentes${out.deployId ? `, deploy id ${out.deployId}` : ''}).`));
  else {
    console.log(c.red(`✖ Validación real fallida: ${out.failures.length} errores (estado: ${out.status}).`));
    out.failures.forEach((f) => console.log(`  - ${f}`));
  }
  process.exit(out.success ? 0 : 1);
}

main();
