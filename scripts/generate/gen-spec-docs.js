#!/usr/bin/env node
'use strict';
// Genera docs/DATA_DICTIONARY.md y docs/ACCESS_MATRIX.md desde config/spec/common-*.json.
// Se ejecuta con npm run docs. No edites a mano los archivos generados.
const fs = require('fs');
const path = require('path');
const { ROOT, readJson } = require('../lib/common');

const dd = readJson(path.join(ROOT, 'config', 'spec', 'common-data-dictionary.json'));
const am = readJson(path.join(ROOT, 'config', 'spec', 'common-access-matrix.json'));
const banner = '<!-- Generado por npm run docs desde config/spec/. No editar a mano. -->\n';
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const TYPE = { Text: 'Texto', Picklist: 'Lista', Date: 'Fecha', Checkbox: 'Casilla', LongTextArea: 'Texto largo' };
const typeOf = (f) => `${TYPE[f.type] || f.type}${f.length ? ` (${f.length})` : ''}`;
const objs = [...new Set(dd.fields.map((f) => f.object))];

let d = `${banner}# Diccionario de datos · Base común FSC\n\n**Estado:** ${dd.status}.\n\n${dd.usage}\n\n`;
d += `## Convenciones\n\n- Prefijo \`${dd.conventions.prefix}\` en todo campo propio.\n- ${dd.conventions.standardFirst}\n- ${dd.conventions.personAccountFields}\n- 🔒 = dato sensible (acceso restringido, ver [ACCESS_MATRIX](ACCESS_MATRIX.md)).\n\n`;
d += `## Resumen\n\n| Objeto | Campos ETC | Validaciones | Reglas de duplicados |\n|---|---|---|---|\n`;
for (const o of objs) d += `| ${o} | ${dd.fields.filter((f) => f.object === o).length} | ${dd.validationRules.filter((v) => v.object === o).length} | ${dd.duplicateRules.filter((v) => v.object === o).length} |\n`;
d += `| **Total** | **${dd.fields.length}** | **${dd.validationRules.length}** | **${dd.duplicateRules.length}** |\n\n`;
for (const o of objs) {
  d += `## ${o}\n\n| Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |\n|---|---|---|---|---|---|\n`;
  for (const f of dd.fields.filter((x) => x.object === o)) {
    d += `| ${f.sensitive ? '🔒 ' : ''}${esc(f.label)} | \`${f.apiName}\` | ${typeOf(f)} | ${esc((f.values || []).join(' · ') || (f.default !== undefined ? `Predeterminado: ${f.default}` : '-'))} | ${esc(f.purpose)} | ${f.catalog} |\n`;
  }
  d += '\n';
}
d += `## Campos estándar reutilizados\n\n| Objeto | Campo | Uso | Valores propuestos |\n|---|---|---|---|\n${dd.standardFields.map((s) => `| ${s.object} | \`${s.apiName}\` (${esc(s.label)}) | ${esc(s.use)} | ${esc((s.values || []).join(' · ') || 'Sin cambios')} |`).join('\n')}\n\n`;
d += `## Reglas de validación\n\n| Objeto | Regla | Qué asegura | Mensaje | Catálogo |\n|---|---|---|---|---|\n${dd.validationRules.map((v) => `| ${v.object} | \`${v.name}\` | ${esc(v.purpose)} | ${esc(v.message)} | ${v.catalog} |`).join('\n')}\n\n`;
d += `## Detección de duplicados\n\nTodas las reglas **alertan sin bloquear**; el bloqueo se decide con el cliente después de calibrar con datos reales (COM-027).\n\n| Objeto | Regla | Coincidencia | Campos |\n|---|---|---|---|\n${dd.duplicateRules.map((r) => `| ${r.object} | \`${r.name}\` | ${esc(r.match)} | ${r.fields.map((x) => `\`${x}\``).join(', ')} |`).join('\n')}\n\n`;
const asks = [...dd.fields, ...dd.validationRules].filter((x) => x.askClient);
d += `## Preguntas para el cliente\n\nSi el cliente no responde antes del despliegue, se usa la base de este documento.\n\n${asks.map((x) => `- **${esc(x.label || x.name)}:** ${esc(x.askClient)}`).join('\n')}\n`;
fs.writeFileSync(path.join(ROOT, 'docs', 'DATA_DICTIONARY.md'), d);

const P = am.personas.filter((p) => p.psg);
const head = `| | ${P.map((p) => p.label).join(' | ')} |\n|---|${P.map(() => '---').join('|')}|\n`;
let a = `${banner}# Matriz de acceso · Base común FSC\n\n**Estado:** ${am.status}.\n\n## Principios\n\n${am.principles.map((p) => `- ${p}`).join('\n')}\n\n`;
a += `## Personas\n\n| Persona | Qué hace | Rol | Permission Set Group | Licencia |\n|---|---|---|---|---|\n${am.personas.map((p) => `| ${p.label} | ${esc(p.description)} | ${p.role ? `\`${p.role}\`` : '-'} | ${p.psg ? `\`${p.psg}\`` : 'Perfil Administrador del sistema'} | ${p.license} |`).join('\n')}\n\n`;
a += `## Jerarquía de roles\n\n\`\`\`\n`;
const tree = (parent, depth) => am.roles.filter((r) => r.parent === parent).forEach((r) => { a += `${'    '.repeat(depth)}${depth ? '└─ ' : ''}${r.label} (${r.name})\n`; tree(r.name, depth + 1); });
tree(null, 0);
a += `\`\`\`\n\n## Valores predeterminados de toda la organización (OWD)\n\n| Objeto | Acceso |\n|---|---|\n${Object.entries(am.owd).map(([o, v]) => `| ${o} | ${v === 'ControlledByParent' ? 'Controlado por el principal' : v === 'Private' ? 'Privado' : v} |`).join('\n')}\n\n`;
a += `## Reglas de colaboración\n\n| Objeto | Regla | Registros | Se comparten con | Acceso | Por qué |\n|---|---|---|---|---|---|\n${am.sharingRules.map((s) => `| ${s.object} | \`${s.name}\` | ${esc(s.criteria)} | ${esc(s.sharedWith)} | ${s.access === 'Read' ? 'Lectura' : 'Lectura y edición'} | ${esc(s.why)} |`).join('\n')}\n\n`;
a += `## Permisos por objeto\n\nC = crear · R = leer · E = editar · D = eliminar (nadie tiene D) · — = sin acceso\n\n${head}${Object.entries(am.objectPermissions).map(([o, m]) => `| **${o}** | ${P.map((p) => m[p.id] || '—').join(' | ')} |`).join('\n')}\n| *Alcance* | ${P.map((p) => esc(am.recordScope[p.id])).join(' | ')} |\n\n`;
a += `## Seguridad de campo (datos sensibles)\n\nE = edita · R = lee · — = sin acceso. ${am.fieldSecurityDefault}\n\n${head}${Object.entries(am.fieldSecurity).map(([f, m]) => `| \`${f}\` | ${P.map((p) => (m[p.id] === '-' ? '—' : m[p.id])).join(' | ')} |`).join('\n')}\n\n`;
a += `## Permission Sets y grupos\n\n| Permission Set | Otorga |\n|---|---|\n${am.permissionSets.map((p) => `| \`${p.name}\` | ${esc(p.grants)} |`).join('\n')}\n\n| Permission Set Group | Incluye |\n|---|---|\n${Object.entries(am.permissionSetGroups).map(([g, l]) => `| \`${g}\` | ${l.map((x) => `\`${x}\``).join(' + ')} |`).join('\n')}\n\n`;
a += `## Preguntas para el cliente\n\n${[...am.askClient, ...am.personas.filter((p) => p.askClient).map((p) => p.askClient), ...am.sharingRules.filter((s) => s.askClient).map((s) => s.askClient)].map((q) => `- ${q}`).join('\n')}\n`;
fs.writeFileSync(path.join(ROOT, 'docs', 'ACCESS_MATRIX.md'), a);
console.log('docs/DATA_DICTIONARY.md y docs/ACCESS_MATRIX.md generados.');
