#!/usr/bin/env node
'use strict';
// npm run deployment-report -- --target-org ALIAS
// Consolida los registros de build/deploy-results y compara, por tipo de componente, lo que hay en el repo
// (módulos del build: base común + vertical) contra lo que existe realmente en la org (consultas SOQL/Tooling).
// Genera deployments/<org>/DEPLOYMENT_REPORT.md (no versionado: contiene identificadores de la instancia).
const fs = require('fs');
const path = require('path');
const { ROOT, c, fail, parseArgs, readJson, query, orgIdentity, targetOrg, listFiles, moduleSrc } = require('../lib/common');
const { labelOf } = require('../lib/vertical');
const { componentOf } = require('./stages');

const args = parseArgs(process.argv.slice(2));
const org = targetOrg(args);
if (!org) fail('Indica la org con --target-org.');
const summary = readJson(path.join(ROOT, 'build', 'build-summary.json'), null);
if (!summary) fail('No existe build/build-summary.json.');

// Conteo local por tipo, solo de los módulos del build.
const local = {};
for (const m of summary.modules) {
  const src = moduleSrc(m);
  for (const f of listFiles(src)) {
    const comp = componentOf(path.relative(src, f).split(path.sep).join('/'));
    if (comp && comp[0] === 'CustomField' && comp[1].split('.')[0].endsWith('__mdt')) continue; // campos de Custom Metadata (sin prefijo ETC_)
    if (comp && comp[0] === 'MatchingRules') { local.MatchingRules = (local.MatchingRules || 0) + (fs.readFileSync(f, 'utf8').match(/<matchingRules>/g) || []).length; continue; }
    if (comp && !(comp[0] === 'Report' && f.endsWith('.reportFolder-meta.xml')) && !(comp[0] === 'Dashboard' && f.endsWith('.dashboardFolder-meta.xml'))) local[comp[0]] = (local[comp[0]] || 0) + 1;
  }
}
const n = (soql, tooling) => {
  const r = query(org, soql, { tooling, allowFail: true });
  return r ? r.length : 'error';
};
const CHECKS = {
  CustomField: () => n("SELECT Id FROM CustomField WHERE DeveloperName LIKE 'ETC_%'", true),
  ValidationRule: () => n("SELECT Id FROM ValidationRule WHERE ValidationName LIKE 'ETC_%' AND Active = true", true),
  MatchingRules: () => n("SELECT Id FROM MatchingRule WHERE DeveloperName LIKE 'ETC_%' AND RuleStatus = 'Active'"),
  DuplicateRule: () => n("SELECT Id FROM DuplicateRule WHERE DeveloperName LIKE 'ETC_%' AND IsActive = true"),
  Flow: () => n("SELECT Id FROM FlowDefinitionView WHERE ApiName LIKE 'ETC_%' AND IsActive = true"),
  FlexiPage: () => n("SELECT Id FROM FlexiPage WHERE DeveloperName LIKE 'ETC_%'", true),
  Layout: () => n("SELECT Id FROM Layout WHERE Name LIKE 'ETC%'", true),
  ListView: () => n("SELECT Id FROM ListView WHERE DeveloperName LIKE 'ETC_%'"),
  PermissionSet: () => n("SELECT Id FROM PermissionSet WHERE Name LIKE 'ETC_%' AND Type = 'Regular'"),
  PermissionSetGroup: () => n("SELECT Id FROM PermissionSetGroup WHERE DeveloperName LIKE 'ETC_%' AND Status = 'Updated'"),
  Role: () => n("SELECT Id FROM UserRole WHERE DeveloperName LIKE 'ETC_%'"),
  Queue: () => n("SELECT Id FROM Group WHERE Type = 'Queue' AND DeveloperName LIKE 'ETC_%'"),
  RecordType: () => n("SELECT Id FROM RecordType WHERE DeveloperName LIKE 'ETC_%'"),
  Report: () => n("SELECT Id FROM Report WHERE DeveloperName LIKE 'ETC_%'"),
  Dashboard: () => n("SELECT Id FROM Dashboard WHERE DeveloperName LIKE 'ETC_%'")
};
const rows = Object.entries(local).sort().map(([type, exp]) => {
  const got = CHECKS[type] ? CHECKS[type]() : 'sin verificación automática';
  return [type, exp, got, typeof got === 'number' ? (got >= exp ? 'OK' : 'REVISAR') : 'MANUAL'];
});

const runs = listFiles(path.join(ROOT, 'build', 'deploy-results'), (p) => p.endsWith('deploy-log.json')).map((f) => readJson(f)).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
const lastByStage = {};
for (const r of runs) for (const s of r.stages) lastByStage[s.id] = { ...s, run: r.startedAt };
const branding = readJson(path.join(ROOT, 'config', 'branding', 'client-branding.json'), {});
const id = orgIdentity(org);

const md = `# Reporte de despliegue

Generado por \`npm run deployment-report\` el ${new Date().toISOString()}. La columna "En la org" proviene de consultas reales a la organización, no de los archivos locales.

| Dato | Valor |
|---|---|
| Org | ${org} · ${id.username} · ${id.orgName || ''} |
| Módulos | Base común + ${labelOf(summary.verticals || [])} |
| Aplicación | ${branding.appLabel || '-'} (\`${branding.appApiName || '-'}\`) |

## Etapas desplegadas

| Etapa | Resultado | Componentes | Deploy Id | Verificación posterior |
|---|---|---|---|---|
${Object.values(lastByStage).sort((a, b) => a.id.localeCompare(b.id)).map((s) => `| ${s.id} | ${s.result} | ${s.components ?? '-'} | ${s.deployId || '-'} | ${s.postCheck || '-'} |`).join('\n') || '| - | Sin ejecuciones | - | - | - |'}

## Verificación en la org

| Tipo de componente | En el repositorio | En la org | Estado |
|---|---|---|---|
${rows.map((r) => `| ${r.join(' | ')} |`).join('\n') || '| - | 0 | - | - |'}
`;
const outDir = path.join(ROOT, 'deployments', org);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'DEPLOYMENT_REPORT.md'), md);
for (const [t, e, g, s] of rows) console.log(`${s === 'OK' ? c.green('✔') : s === 'MANUAL' ? c.yellow('–') : c.red('✖')} ${t}: ${g}/${e}`);
console.log(c.bold(`\nReporte: deployments/${org}/DEPLOYMENT_REPORT.md`));
process.exit(rows.every((r) => r[3] !== 'REVISAR') ? 0 : 1);
