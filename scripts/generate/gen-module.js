#!/usr/bin/env node
'use strict';
// npm run generate            (todos los módulos con especificación)
// node scripts/generate/gen-module.js <common|insurance|banking|wealth>
// Genera la metadata de un módulo desde config/spec/<módulo>-*.json (fuente única):
//   campos ETC, Standard Value Sets, reglas de validación, matching y duplicate rules, roles,
//   reglas de colaboración, Permission Sets, Permission Set Groups y FLS del perfil Administrador.
// Antes de escribir, verifica que la suma de permisos de cada grupo reproduzca exactamente la matriz de acceso.
// Actualiza en el catálogo los componentes de cada ítem. No toca la org.
const fs = require('fs');
const path = require('path');
const { ROOT, BRANDING_FILE, CATALOG_FILE, c, fail, readJson, writeJson, moduleSrc } = require('../lib/common');

const MODULE = process.argv[2] || 'common';
const SRC = moduleSrc(MODULE);
const dd = readJson(path.join(ROOT, 'config', 'spec', `${MODULE}-data-dictionary.json`));
const am = readJson(path.join(ROOT, 'config', 'spec', `${MODULE}-access-matrix.json`));
for (const k of ['standardFields', 'validationRules', 'duplicateRules']) dd[k] ||= [];
for (const k of ['roles', 'sharingRules', 'personas']) am[k] ||= [];
am.permissionSetGroups ||= {};
const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const generated = [];
const catalogMap = {};
function write(rel, body, catalog) {
  const f = path.join(SRC, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, `<?xml version="1.0" encoding="UTF-8"?>\n${body}`);
  generated.push(rel);
  return f;
}
const addCat = (id, comp) => id && (catalogMap[id] ||= new Set()).add(comp);

// Limpia lo que este generador produjo antes (solo componentes ETC de la base común) para no dejar huérfanos.
function clean() {
  const rm = (p) => fs.rmSync(path.join(SRC, p), { recursive: true, force: true });
  for (const o of fs.existsSync(path.join(SRC, 'objects')) ? fs.readdirSync(path.join(SRC, 'objects')) : []) {
    for (const sub of ['fields', 'validationRules']) {
      const d = path.join(SRC, 'objects', o, sub);
      if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.startsWith('ETC_')) fs.rmSync(path.join(d, f));
    }
  }
  ['standardValueSets', 'matchingRules', 'duplicateRules', 'roles', 'sharingRules', 'permissionsets', 'permissionsetgroups'].forEach(rm);
}

// ---------- Campos
function fieldXml(f) {
  if (f.label.length > 40) fail(`Etiqueta mayor a 40 caracteres: ${f.object}.${f.apiName} (${f.label})`);
  const parts = [`    <fullName>${f.apiName}</fullName>`];
  if (f.type === 'Checkbox') parts.push(`    <defaultValue>${f.default ? 'true' : 'false'}</defaultValue>`);
  if (f.type === 'Lookup') parts.push('    <deleteConstraint>SetNull</deleteConstraint>');
  parts.push(`    <description>${X(f.purpose.slice(0, 1000))}</description>`);
  if (f.helpText) parts.push(`    <inlineHelpText>${X(f.helpText)}</inlineHelpText>`);
  parts.push(`    <label>${X(f.label)}</label>`);
  if (f.type === 'Text') parts.push(`    <length>${f.length}</length>`);
  if (f.type === 'Currency') parts.push('    <precision>18</precision>');
  if (f.type === 'Lookup') parts.push(`    <referenceTo>${f.referenceTo}</referenceTo>\n    <relationshipLabel>${X(f.relationshipLabel)}</relationshipLabel>\n    <relationshipName>${f.relationshipName}</relationshipName>`);
  if (f.type === 'LongTextArea') parts.push(`    <length>${f.length}</length>`);
  if (['Text', 'Currency', 'Lookup'].includes(f.type)) parts.push('    <required>false</required>');
  if (f.type === 'Currency') parts.push('    <scale>2</scale>');
  if (f.sensitive) parts.push('    <securityClassification>Confidential</securityClassification>');
  if (f.type !== 'Checkbox' && f.type !== 'LongTextArea') parts.push('    <trackHistory>false</trackHistory>');
  parts.push(`    <type>${f.type}</type>`);
  if (f.type === 'Text') parts.push('    <unique>false</unique>');
  if (f.type === 'Picklist') {
    const vals = f.values.map((v) => `            <value>\n                <fullName>${X(v)}</fullName>\n                <default>${f.default === v}</default>\n                <label>${X(v)}</label>\n            </value>`).join('\n');
    parts.push(`    <valueSet>\n        <restricted>true</restricted>\n        <valueSetDefinition>\n            <sorted>false</sorted>\n${vals}\n        </valueSetDefinition>\n    </valueSet>`);
  }
  if (f.type === 'LongTextArea') parts.push('    <visibleLines>4</visibleLines>');
  return `<CustomField ${NS}>\n${parts.join('\n')}\n</CustomField>\n`;
}

// ---------- Permisos: expansión de patrones y verificación contra la matriz
const allFields = dd.fields.map((f) => `${f.object}.${f.apiName}`);
const expand = (pats) => allFields.filter((f) => pats.some((p) => (p.endsWith('.*') ? f.startsWith(p.slice(0, -1)) : f === p)));
function psEffective(def) {
  const ex = new Set(def.exclude || []);
  const edit = new Set(expand(def.fieldsEdit).filter((f) => !ex.has(f)));
  const read = new Set([...expand(def.fieldsRead), ...edit].filter((f) => !ex.has(f) || def.fieldsRead.includes(f)));
  for (const f of def.fieldsRead) if (!f.endsWith('.*')) read.add(f);
  return { edit, read, objects: def.objects };
}
const LEVEL = (r, e) => (e ? 'E' : r ? 'R' : '-');
function verifyMatrix() {
  const defs = am.permissionSetDefinitions;
  const errs = [];
  for (const p of am.personas.filter((x) => x.psg)) {
    const sets = am.permissionSetGroups[p.psg].map((n) => psEffective(defs[n]));
    const has = (f, k) => sets.some((s) => s[k].has(f));
    for (const [f, m] of Object.entries(am.fieldSecurity)) {
      const got = LEVEL(has(f, 'read'), has(f, 'edit'));
      if (got !== m[p.id]) errs.push(`${p.id} · ${f}: matriz ${m[p.id]}, permisos ${got}`);
    }
    for (const [o, m] of Object.entries(am.objectPermissions)) {
      const letters = new Set(sets.flatMap((s) => (s.objects[o] || '').split('')));
      const got = ['C', 'R', 'E'].filter((l) => letters.has(l)).join('');
      if (got !== (m[p.id] || '')) errs.push(`${p.id} · ${o}: matriz "${m[p.id] || ''}", permisos "${got}"`);
    }
  }
  if (errs.length) fail(`Los Permission Sets no reproducen la matriz de acceso:\n  ${errs.join('\n  ')}`);
}

function permissionSetXml(name, def, label, description, app) {
  const eff = psEffective(def);
  const parts = [];
  if (def.app && app) parts.push(`    <applicationVisibilities>\n        <application>${app}</application>\n        <visible>true</visible>\n    </applicationVisibilities>`);
  parts.push(`    <description>${X(description)}</description>`);
  for (const f of [...eff.read].sort()) parts.push(`    <fieldPermissions>\n        <editable>${eff.edit.has(f)}</editable>\n        <field>${f}</field>\n        <readable>true</readable>\n    </fieldPermissions>`);
  parts.push('    <hasActivationRequired>false</hasActivationRequired>');
  parts.push(`    <label>${X(label)}</label>`);
  for (const [o, lv] of Object.entries(def.objects).sort()) {
    parts.push(`    <objectPermissions>\n        <allowCreate>${lv.includes('C')}</allowCreate>\n        <allowDelete>false</allowDelete>\n        <allowEdit>${lv.includes('E')}</allowEdit>\n        <allowRead>true</allowRead>\n        <modifyAllRecords>false</modifyAllRecords>\n        <object>${o}</object>\n        <viewAllRecords>false</viewAllRecords>\n    </objectPermissions>`);
  }
  return `<PermissionSet ${NS}>\n${parts.join('\n')}\n</PermissionSet>\n`;
}

function main() {
  if (am.personas.length) verifyMatrix();
  clean();
  const branding = readJson(BRANDING_FILE, null);
  const app = branding?.appApiName;

  for (const f of dd.fields) {
    write(`objects/${f.object}/fields/${f.apiName}.field-meta.xml`, fieldXml(f));
    addCat(f.catalog, `CustomField:${f.object}.${f.apiName}`);
  }

  for (const s of dd.standardFields.filter((x) => x.valueSet && x.values)) {
    const vals = s.values.map((v, i) => `    <standardValue>\n        <fullName>${X(v)}</fullName>\n        <default>${i === 0 && s.valueSet !== 'CaseType' ? 'false' : 'false'}</default>\n        <label>${X(v)}</label>\n    </standardValue>`).join('\n');
    write(`standardValueSets/${s.valueSet}.standardValueSet-meta.xml`, `<StandardValueSet ${NS}>\n    <sorted>false</sorted>\n${vals}\n</StandardValueSet>\n`);
    addCat('COM-013', `StandardValueSet:${s.valueSet}`);
  }

  for (const v of dd.validationRules) {
    write(`objects/${v.object}/validationRules/${v.name}.validationRule-meta.xml`, `<ValidationRule ${NS}>\n    <fullName>${v.name}</fullName>\n    <active>true</active>\n    <description>${X(v.purpose)}</description>\n    <errorConditionFormula>${X(v.formula)}</errorConditionFormula>\n    <errorMessage>${X(v.message)}</errorMessage>\n</ValidationRule>\n`);
    addCat(v.catalog, `ValidationRule:${v.object}.${v.name}`);
  }

  // Matching rules: un archivo por objeto; cada regla de duplicados usa su propia matching rule.
  const MATCH = {
    ETC_Cuenta_RFC: { items: [['ETC_RFC__c', 'Exact']] },
    ETC_Persona_CURP: { items: [['ETC_CURP__pc', 'Exact']] },
    ETC_Persona_Correo_Nombre: { items: [['PersonEmail', 'Exact'], ['FirstName', 'FirstName'], ['LastName', 'LastName'], ['PersonMobilePhone', 'Phone']], filter: '1 OR (2 AND 3 AND 4)' },
    ETC_Contacto_Correo: { items: [['Email', 'Exact']] },
    ETC_Prospecto_RFC_Correo: { items: [['ETC_RFC__c', 'Exact'], ['Email', 'Exact']], filter: '1 OR 2' }
  };
  const byObj = {};
  for (const r of dd.duplicateRules.filter((x) => x.enabled !== false)) (byObj[r.object] ||= []).push(r);
  for (const [obj, rules] of Object.entries(byObj)) {
    const body = rules.map((r) => {
      const m = MATCH[r.name];
      if (!m) fail(`Sin definición de matching para ${r.name}`);
      return `    <matchingRules>\n        <fullName>${r.name}_MR</fullName>\n${m.filter ? `        <booleanFilter>${m.filter}</booleanFilter>\n` : ''}        <description>${X(r.match)}. Un valor vacío nunca coincide.</description>\n        <label>${X(`ETC ${r.match}`).slice(0, 80)}</label>\n${m.items.map(([fld, meth]) => `        <matchingRuleItems>\n            <blankValueBehavior>NullNotAllowed</blankValueBehavior>\n            <fieldName>${fld}</fieldName>\n            <matchingMethod>${meth}</matchingMethod>\n        </matchingRuleItems>`).join('\n')}\n        <ruleStatus>Active</ruleStatus>\n    </matchingRules>`;
    }).join('\n');
    write(`matchingRules/${obj}.matchingRule-meta.xml`, `<MatchingRules ${NS}>\n${body}\n</MatchingRules>\n`);
    addCat('COM-027', `MatchingRules:${obj}`);
    rules.forEach((r, i) => {
      write(`duplicateRules/${obj}.${r.name}.duplicateRule-meta.xml`, `<DuplicateRule ${NS} xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n    <actionOnInsert>Allow</actionOnInsert>\n    <actionOnUpdate>Allow</actionOnUpdate>\n    <alertText>Posible duplicado (${X(r.match)}). Revisa los registros coincidentes antes de guardar.</alertText>\n    <description>${X(r.match)}. Alerta sin bloquear (base ETC; se calibra con el cliente).</description>\n    <duplicateRuleFilter xsi:nil="true"/>\n    <duplicateRuleMatchRules>\n        <matchRuleSObjectType>${obj}</matchRuleSObjectType>\n        <matchingRule>${r.name}_MR</matchingRule>\n        <objectMapping xsi:nil="true"/>\n    </duplicateRuleMatchRules>\n    <isActive>true</isActive>\n    <masterLabel>${X(`ETC ${r.match}`).slice(0, 80)}</masterLabel>\n    <operationsOnInsert>Alert</operationsOnInsert>\n    <operationsOnInsert>Report</operationsOnInsert>\n    <operationsOnUpdate>Alert</operationsOnUpdate>\n    <operationsOnUpdate>Report</operationsOnUpdate>\n    <securityOption>EnforceSharingRules</securityOption>\n    <sortOrder>${i + 1}</sortOrder>\n</DuplicateRule>\n`);
      addCat(r.catalog, `DuplicateRule:${obj}.${r.name}`);
    });
  }

  for (const r of am.roles) {
    write(`roles/${r.name}.role-meta.xml`, `<Role ${NS}>\n    <caseAccessLevel>Read</caseAccessLevel>\n    <contactAccessLevel>Edit</contactAccessLevel>\n    <description>ETC | ${X(r.label)}</description>\n    <mayForecastManagerShare>false</mayForecastManagerShare>\n    <name>${X(r.label)}</name>\n    <opportunityAccessLevel>Read</opportunityAccessLevel>\n${r.parent ? `    <parentRole>${r.parent}</parentRole>\n` : ''}</Role>\n`);
    addCat('COM-006', `Role:${r.name}`);
  }

  // Reglas de colaboración por propietario (rol y subordinados)
  const SH = {
    ETC_Clientes_Lectura_Servicio: { from: ['roleAndSubordinatesInternal', 'ETC_Direccion'], to: ['roleAndSubordinatesInternal', 'ETC_Supervisor_Servicio'], account: ['None', 'Read', 'None'] },
    ETC_Clientes_Edicion_Cumplimiento: { from: ['roleAndSubordinatesInternal', 'ETC_Direccion'], to: ['role', 'ETC_Cumplimiento'], account: ['Read', 'Edit', 'None'] },
    ETC_Casos_Lectura_Comercial: { from: ['roleAndSubordinatesInternal', 'ETC_Supervisor_Servicio'], to: ['roleAndSubordinatesInternal', 'ETC_Gerente_Comercial'] }
  };
  const shByObj = {};
  for (const s of am.sharingRules) (shByObj[s.object] ||= []).push(s);
  for (const [obj, rules] of Object.entries(shByObj)) {
    const body = rules.map((s) => {
      const d = SH[s.name];
      if (!d) fail(`Sin definición de colaboración para ${s.name}`);
      const acc = d.account ? `        <accountSettings>\n            <caseAccessLevel>${d.account[0]}</caseAccessLevel>\n            <contactAccessLevel>${d.account[1]}</contactAccessLevel>\n            <opportunityAccessLevel>${d.account[2]}</opportunityAccessLevel>\n        </accountSettings>\n` : '';
      return `    <sharingOwnerRules>\n        <fullName>${s.name}</fullName>\n        <accessLevel>${s.access}</accessLevel>\n${acc}        <description>${X(s.why)}</description>\n        <label>${X(s.name.replace(/_/g, ' '))}</label>\n        <sharedTo>\n            <${d.to[0]}>${d.to[1]}</${d.to[0]}>\n        </sharedTo>\n        <sharedFrom>\n            <${d.from[0]}>${d.from[1]}</${d.from[0]}>\n        </sharedFrom>\n    </sharingOwnerRules>`;
    }).join('\n');
    write(`sharingRules/${obj}.sharingRules-meta.xml`, `<SharingRules ${NS}>\n${body}\n</SharingRules>\n`);
    addCat('COM-007', `SharingRules:${obj}`);
  }

  for (const ps of am.permissionSets) {
    const def = am.permissionSetDefinitions[ps.name];
    if (!def) fail(`Sin definición ejecutable para ${ps.name}`);
    write(`permissionsets/${ps.name}.permissionset-meta.xml`, permissionSetXml(ps.name, def, ps.label, ps.grants, app));
    addCat('COM-004', `PermissionSet:${ps.name}`);
  }
  for (const [g, list] of Object.entries(am.permissionSetGroups)) {
    const persona = am.personas.find((p) => p.psg === g);
    write(`permissionsetgroups/${g}.permissionsetgroup-meta.xml`, `<PermissionSetGroup ${NS}>\n    <description>${X(`${persona.label}: ${list.join(' + ')}`)}</description>\n    <hasActivationRequired>false</hasActivationRequired>\n    <label>${X(`ETC | ${persona.label}`).slice(0, 80)}</label>\n${list.map((p) => `    <permissionSets>${p}</permissionSets>`).join('\n')}\n    <status>Updated</status>\n</PermissionSetGroup>\n`);
    addCat('COM-004', `PermissionSetGroup:${g}`);
  }

  // Perfil Administrador (solo base común): app visible, FLS completo de los campos ETC y record types de Account
  if (MODULE === 'common') {
  const appVis = app ? `    <applicationVisibilities>\n        <application>${app}</application>\n        <default>false</default>\n        <visible>true</visible>\n    </applicationVisibilities>\n` : '';
  const adminFls = allFields.sort().map((f) => `    <fieldPermissions>\n        <editable>true</editable>\n        <field>${f}</field>\n        <readable>true</readable>\n    </fieldPermissions>`).join('\n');
  write('profiles/Admin.profile-meta.xml', `<Profile ${NS}>\n${appVis}    <custom>false</custom>\n${adminFls}\n    <recordTypeVisibilities>\n        <default>true</default>\n        <recordType>Account.ETC_Empresa</recordType>\n        <visible>true</visible>\n    </recordTypeVisibilities>\n    <recordTypeVisibilities>\n        <default>false</default>\n        <personAccountDefault>true</personAccountDefault>\n        <recordType>PersonAccount.PersonAccount</recordType>\n        <visible>true</visible>\n    </recordTypeVisibilities>\n</Profile>\n`);
  addCat('COM-005', 'Profile:Admin');
  }

  // Catálogo: componentes declarados por ítem (sin perder los existentes, p. ej. settings y record type)
  const cat = readJson(CATALOG_FILE);
  const OWNED = /^(CustomField|StandardValueSet|ValidationRule|MatchingRules|DuplicateRule|Role|SharingRules|PermissionSet|PermissionSetGroup):/;
  for (const it of cat.items) {
    if (it.module !== MODULE) continue;
    const kept = (it.componentes || []).filter((x) => !OWNED.test(x)); // lo que no genera este script (settings, record types, perfil)
    if (!catalogMap[it.id] && kept.length === (it.componentes || []).length) continue;
    it.componentes = [...new Set([...kept, ...(catalogMap[it.id] || [])])].sort();
    if (it.estado === 'Pendiente') it.estado = 'En construcción';
  }
  writeJson(CATALOG_FILE, cat);

  const count = (pre) => generated.filter((g) => g.startsWith(pre)).length;
  console.log(c.bold(`Módulo ${MODULE}`));
  if (am.personas.length) console.log(c.green('✔ Matriz de acceso verificada: los Permission Set Groups reproducen permisos por objeto y seguridad de campo.'));
  console.log(`  Campos ${dd.fields.length} · Standard Value Sets ${count('standardValueSets')} · Validaciones ${dd.validationRules.length} · Matching ${count('matchingRules')} archivos · Duplicate ${count('duplicateRules')} · Roles ${count('roles')} · Sharing ${count('sharingRules')} archivos · PS ${count('permissionsets')} · PSG ${count('permissionsetgroups')}${MODULE === 'common' ? ' · Perfil Admin' : ''}`);
  console.log(`  Catálogo actualizado: ${Object.keys(catalogMap).sort().join(', ')}`);
}

main();
