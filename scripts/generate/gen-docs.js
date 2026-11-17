#!/usr/bin/env node
'use strict';
// npm run docs
// Genera docs/CATALOG.md y docs/modules/<MÓDULO>.md desde config/catalog/fsc-catalog.json y config/modules.json.
// El catálogo es la fuente única: no edites a mano los archivos generados.
const fs = require('fs');
const path = require('path');
const { ROOT, CATALOG_FILE, readJson } = require('../lib/common');
const { modules } = require('../lib/vertical');

const cat = readJson(CATALOG_FILE);
const mods = modules();
const esc = (s) => String(s || '').replace(/\|/g, '/').replace(/\n/g, ' ');
const count = (items, k, v) => items.filter((i) => i[k] === v).length;
const EXEC = ['Claude Code (con aprobación)', 'Humano con apoyo de IA', 'Humano'];
const ESTADOS = Object.keys(cat.estados);
const banner = '<!-- Generado por npm run docs desde config/catalog/fsc-catalog.json. No editar a mano. -->\n';

let md = `${banner}# Catálogo de configuraciones FSC\n\nFuente: *${cat.source.title}* (importado ${cat.source.importedAt}). ${cat.source.note}\n\n## Resumen por módulo\n\n| Módulo | Ítems | ${EXEC.join(' | ')} | ${ESTADOS.join(' | ')} |\n|---|---|${EXEC.map(() => '---').join('|')}|${ESTADOS.map(() => '---').join('|')}|\n`;
for (const m of mods) {
  const it = cat.items.filter((i) => i.module === m.id);
  md += `| [${m.label}](modules/${m.id.toUpperCase()}.md) | ${it.length} | ${EXEC.map((e) => count(it, 'ejecutor', e)).join(' | ')} | ${ESTADOS.map((e) => count(it, 'estado', e)).join(' | ')} |\n`;
}
md += `| **Total** | **${cat.items.length}** | ${EXEC.map((e) => `**${count(cat.items, 'ejecutor', e)}**`).join(' | ')} | ${ESTADOS.map((e) => `**${count(cat.items, 'estado', e)}**`).join(' | ')} |\n\n## Estados\n\n${Object.entries(cat.estados).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}\n`;
fs.writeFileSync(path.join(ROOT, 'docs', 'CATALOG.md'), md);

fs.mkdirSync(path.join(ROOT, 'docs', 'modules'), { recursive: true });
for (const m of mods) {
  const it = cat.items.filter((i) => i.module === m.id);
  let d = `${banner}# ${m.label} (${m.kind === 'base' ? 'siempre se despliega' : 'vertical: se despliega solo si el cliente la confirma'})\n\n${m.description}.\n\n`;
  d += `## Objetos FSC Core\n\n- Requeridos (sin ellos la org no está lista): ${m.requiredObjects.map((o) => `\`${o}\``).join(', ')}\n- Opcionales: ${m.optionalObjects.map((o) => `\`${o}\`${(m.unconfirmedObjects || []).includes(o) ? ' (nombre no confirmado en doc oficial)' : ''}`).join(', ')}\n\n## Prerrequisitos de Setup\n\n${m.setupPrerequisites.map((p) => `- ${p}`).join('\n')}\n\n`;
  d += `## Ítems del catálogo\n\n| ID | Área | Configuración | Ejecuta | Estado | Validación humana |\n|---|---|---|---|---|---|\n${it.map((i) => `| ${i.id} | ${esc(i.area)} | ${esc(i.item)} | ${esc(i.ejecutor)} | ${i.estado} | ${esc(i.validacionHumana)} |`).join('\n')}\n\n## Detalle\n\n`;
  d += it.map((i) => `### ${i.id} · ${i.item}\n\n- **Alcance:** ${i.descripcion}\n- **Tipo de trabajo:** ${i.tipoTrabajo}\n- **Prerrequisitos:** ${i.prerequisitos}\n- **Qué puede hacer Claude Code:** ${i.capacidadClaude}\n- **Validación humana:** ${i.validacionHumana}\n- **Componentes:** ${(i.componentes || []).length ? i.componentes.map((x) => `\`${x}\``).join(', ') : 'Pendiente'}\n`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'docs', 'modules', `${m.id.toUpperCase()}.md`), d);
}
console.log(`docs/CATALOG.md y docs/modules/*.md generados (${cat.items.length} ítems, ${mods.length} módulos).`);
