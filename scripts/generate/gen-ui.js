#!/usr/bin/env node
'use strict';
// node scripts/generate/gen-ui.js [--vertical banking]   (lo ejecuta npm run generate)
// Genera la experiencia de usuario desde config/spec/<módulo>-ui.json:
//   - Layouts, Lightning Record Pages y List Views de cada módulo (las verticales siempre se generan en su carpeta).
//   - En la base común: secciones que las verticales ACTIVAS agregan a los layouts comunes (extendLayouts),
//     asignación de layouts en los perfiles Administrador y Estándar, y páginas asignadas en la app.
// Las piezas de la base común que dependen de la vertical quedan marcadas en config/generated-ui.json;
// npm run build verifica que coincidan con la vertical del build.
const fs = require('fs');
const path = require('path');
const { ROOT, BRANDING_FILE, c, fail, parseArgs, readJson, writeJson, moduleSrc } = require('../lib/common');
const { modules, normalize, readImplementation, labelOf } = require('../lib/vertical');

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';
const HDR = '<?xml version="1.0" encoding="UTF-8"?>\n';
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const args = parseArgs(process.argv.slice(2));
const active = args.vertical ? normalize(args.vertical) : readImplementation().verticals || [];
const specs = Object.fromEntries(modules().map((m) => [m.id, readJson(path.join(ROOT, 'config', 'spec', `${m.id}-ui.json`), null)]).filter(([, s]) => s));
const isActive = (id) => id === 'common' || active.includes(id);
const counts = {};
const write = (mod, rel, body) => {
  const f = path.join(moduleSrc(mod), rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, HDR + body);
  counts[mod] = (counts[mod] || 0) + 1;
};

function clean(mod) {
  const src = moduleSrc(mod);
  for (const d of ['layouts', 'flexipages']) fs.rmSync(path.join(src, d), { recursive: true, force: true });
  fs.rmSync(path.join(src, 'profiles', 'Standard.profile-meta.xml'), { force: true });
  const objs = path.join(src, 'objects');
  if (fs.existsSync(objs)) for (const o of fs.readdirSync(objs)) fs.rmSync(path.join(objs, o, 'listViews'), { recursive: true, force: true });
}

// ---------- Layouts
const item = ([f, b = 'Edit']) => `            <layoutItems>\n                <behavior>${b}</behavior>\n                <field>${f}</field>\n            </layoutItems>\n`;
function section(s) {
  const cols = s.right ? [s.left, s.right] : [s.left];
  return `    <layoutSections>\n        <customLabel>true</customLabel>\n        <detailHeading>true</detailHeading>\n        <editHeading>true</editHeading>\n        <label>${X(s.label)}</label>\n` +
    cols.map((col) => `        <layoutColumns>\n${col.map(item).join('')}        </layoutColumns>\n`).join('') +
    `        <style>${s.right ? 'TwoColumnsLeftToRight' : 'OneColumn'}</style>\n    </layoutSections>\n`;
}
const SYSTEM = { label: 'Información del sistema', left: [['CreatedById', 'Readonly']], right: [['LastModifiedById', 'Readonly']] };
function layoutXml(l, extra) {
  // Algunos objetos FSC (p. ej. FinancialGoal) no admiten CreatedById/LastModifiedById en el layout: system: false
  return `<Layout ${NS}>\n${[...l.sections, ...extra, ...(l.system === false ? [] : [SYSTEM])].map(section).join('')}` +
    l.related.map((r) => `    <relatedLists>\n        <relatedList>${r}</relatedList>\n    </relatedLists>\n`).join('') +
    `    <showEmailCheckbox>false</showEmailCheckbox>\n    <showHighlightsPanel>false</showHighlightsPanel>\n    <showInteractionLogPanel>false</showInteractionLogPanel>\n    <showRunAssignmentRulesCheckbox>false</showRunAssignmentRulesCheckbox>\n    <showSubmitAndAttachButton>false</showSubmitAndAttachButton>\n</Layout>\n`;
}

// ---------- Lightning Record Pages (mismo patrón probado en Sales Cloud)
let uid = 0;
function comp(name, props = {}, id) {
  const p = Object.entries(props).map(([k, v]) => `                <componentInstanceProperties>\n                    <name>${k}</name>\n                    <value>${X(v)}</value>\n                </componentInstanceProperties>\n`).join('');
  return `        <itemInstances>\n            <componentInstance>\n${p}                <componentName>${name}</componentName>\n                <identifier>${id || name.replace(/[^A-Za-z0-9]/g, '_') + '_' + ++uid}</identifier>\n            </componentInstance>\n        </itemInstances>\n`;
}
const region = (name, type, items) => `    <flexiPageRegions>\n${items.join('')}        <name>${name}</name>\n        <type>${type}</type>\n    </flexiPageRegions>\n`;
const CONTENT = {
  detail: () => [comp('force:detailPanel')],
  related: () => [comp('force:relatedListContainer')]
};
function pageXml(p) {
  uid = 0;
  const regions = [region('header', 'Region', [comp('force:highlightsPanel', { collapsed: 'false', numVisibleActions: '4' })])];
  const tabItems = [];
  p.tabs.forEach(([key, title, content], i) => {
    regions.push(region(`${key}TabContent`, 'Facet', CONTENT[content]()));
    const props = { body: `${key}TabContent`, title };
    if (i === 0) props.active = 'true';
    tabItems.push(comp('flexipage:tab', props, `${key}Tab`));
  });
  regions.push(region('maintabs', 'Facet', tabItems));
  regions.push(region('main', 'Region', [comp('flexipage:tabset', { tabs: 'maintabs' }, 'mainTabset')]));
  regions.push(region('sidebar', 'Region', [comp('runtime_sales_activities:activityPanel', { showLegacyActivityComposer: 'false' }, 'sidebarActivity')]));
  return `<FlexiPage ${NS}>\n${regions.join('')}    <description>${X(`Página de registro ETC para ${p.object}. Actividad en la columna lateral.`)}</description>\n    <masterLabel>${X(p.label)}</masterLabel>\n    <sobjectType>${p.object}</sobjectType>\n    <template>\n        <name>flexipage:recordHomeTemplateDesktop</name>\n    </template>\n    <type>RecordPage</type>\n</FlexiPage>\n`;
}

// ---------- List Views
function listViewXml(v) {
  return `<ListView ${NS}>\n    <fullName>${v.name}</fullName>\n${v.booleanFilter ? `    <booleanFilter>${v.booleanFilter}</booleanFilter>\n` : ''}` +
    v.columns.map((col) => `    <columns>${col}</columns>\n`).join('') +
    `    <filterScope>${v.scope}</filterScope>\n` +
    v.filters.map(([f, op, val]) => `    <filters>\n        <field>${f}</field>\n        <operation>${op}</operation>\n        <value>${X(val)}</value>\n    </filters>\n`).join('') +
    `    <label>${X(v.label)}</label>\n</ListView>\n`;
}

function main() {
  // Extensiones que las verticales activas aplican a los layouts de la base común
  const ext = {};
  for (const [mod, s] of Object.entries(specs)) if (mod !== 'common' && isActive(mod)) for (const e of s.extendLayouts || []) (ext[e.layout] ||= []).push(...e.sections);

  const assignments = [];
  const pages = [];
  for (const [mod, s] of Object.entries(specs)) {
    clean(mod);
    for (const l of s.layouts || []) {
      const full = `${l.object}-${l.name}`;
      write(mod, `layouts/${full}.layout-meta.xml`, layoutXml(l, mod === 'common' ? ext[full] || [] : []));
      if (isActive(mod)) for (const a of l.assign) assignments.push({ layout: full, recordType: a.recordType });
    }
    for (const p of s.recordPages || []) {
      write(mod, `flexipages/${p.name}.flexipage-meta.xml`, pageXml(p));
      if (isActive(mod)) pages.push(p);
    }
    for (const v of s.listViews || []) write(mod, `objects/${v.object}/listViews/${v.name}.listView-meta.xml`, listViewXml(v));
  }

  // Perfiles: asignación de layouts (Administrador conserva su FLS y record types de gen-module)
  const la = assignments
    .sort((a, b) => (a.layout + (a.recordType || '')).localeCompare(b.layout + (b.recordType || '')))
    .map((a) => `    <layoutAssignments>\n        <layout>${a.layout}</layout>\n${a.recordType ? `        <recordType>${a.recordType}</recordType>\n` : ''}    </layoutAssignments>\n`).join('');
  const adminFile = path.join(moduleSrc('common'), 'profiles', 'Admin.profile-meta.xml');
  if (!fs.existsSync(adminFile)) fail('Falta el perfil Administrador: ejecuta primero gen-module.js common.');
  let admin = fs.readFileSync(adminFile, 'utf8').replace(/    <layoutAssignments>[\s\S]*?<\/layoutAssignments>\n/g, '');
  admin = admin.replace(/(    <recordTypeVisibilities>)/, `${la}$1`);
  fs.writeFileSync(adminFile, admin);
  write('common', 'profiles/Standard.profile-meta.xml', `<Profile ${NS}>\n    <custom>false</custom>\n${la}</Profile>\n`);

  // App: páginas de registro asignadas a nivel de app (no como predeterminadas de la org)
  const branding = readJson(BRANDING_FILE, null);
  if (branding) {
    const appFile = path.join(moduleSrc('common'), 'applications', `${branding.appApiName}.app-meta.xml`);
    let app = fs.readFileSync(appFile, 'utf8').replace(/    <actionOverrides>[\s\S]*?<\/actionOverrides>\n/g, '');
    const ov = pages.sort((a, b) => a.object.localeCompare(b.object)).map((p) => `    <actionOverrides>\n        <actionName>View</actionName>\n        <content>${p.name}</content>\n        <formFactor>Large</formFactor>\n        <skipRecordTypeSelect>false</skipRecordTypeSelect>\n        <type>Flexipage</type>\n        <pageOrSobjectType>${p.object}</pageOrSobjectType>\n    </actionOverrides>\n`).join('');
    app = app.replace(/(<CustomApplication [^>]*>\n)/, `$1${ov}`);
    fs.writeFileSync(appFile, app);
  }

  writeJson(path.join(ROOT, 'config', 'generated-ui.json'), { description: 'Vertical(es) para la que se generaron las piezas de la base común que dependen de ella (secciones de layouts, perfiles y app). npm run build exige que coincida con la vertical del build.', verticals: active });
  console.log(c.bold(`UI · base común${active.length ? ' + ' + labelOf(active) : ' (sin vertical)'}`));
  console.log(`  Archivos: ${Object.entries(counts).map(([m, n]) => `${m} ${n}`).join(' · ')} · layouts asignados ${assignments.length} · páginas en la app ${pages.length}`);
}

main();
