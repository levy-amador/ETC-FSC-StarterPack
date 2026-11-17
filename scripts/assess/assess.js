#!/usr/bin/env node
'use strict';
// npm run assess -- --target-org ALIAS
// COM-001 · Diagnóstico de edición, licencias y funcionalidades FSC. SOLO LECTURA: consulta, no modifica nada.
// Evalúa la base común y LAS TRES verticales, para saber qué soporta la org antes de elegir/confirmar la vertical.
// Salidas: build/assessment/<alias>.json (lo exige npm run deploy) y deployments/<alias>/ORG_ASSESSMENT.md.
const fs = require('fs');
const path = require('path');
const { ROOT, c, fail, parseArgs, writeJson, sf, query, orgIdentity, targetOrg } = require('../lib/common');
const { modules, readImplementation, labelOf } = require('../lib/vertical');

function main() {
  const args = parseArgs(process.argv.slice(2));
  const org = targetOrg(args);
  if (!org) fail('Indica la org con --target-org.');
  console.log(c.bold(`Diagnóstico FSC (solo lectura) · ${org}`));

  const id = orgIdentity(org);
  const objects = new Set(sf(['sobject', 'list', '--sobject', 'all', '--target-org', org]).result || []);
  const acct = sf(['sobject', 'describe', '--sobject', 'Account', '--target-org', org], { allowFail: true }).result;
  const personAccounts = !!acct?.fields?.some((f) => f.name === 'IsPersonAccount');
  const finservPkg = (query(org, "SELECT NamespacePrefix, Status FROM PackageLicense WHERE NamespacePrefix = 'FinServ'", { allowFail: true }) || []).length > 0;
  const psl =
    query(
      org,
      "SELECT DeveloperName, MasterLabel, Status, TotalLicenses, UsedLicenses FROM PermissionSetLicense WHERE MasterLabel LIKE '%FSC%' OR MasterLabel LIKE '%Financial%' OR MasterLabel LIKE '%Insurance%' OR MasterLabel LIKE '%Action Plan%' OR DeveloperName LIKE '%FSC%' OR DeveloperName LIKE '%Insurance%' ORDER BY MasterLabel",
      { allowFail: true }
    ) || [];
  // Licencias asignadas al usuario que corre el diagnóstico: `sf sobject list` solo devuelve lo que ese usuario puede ver.
  const me = (query(org, `SELECT Id FROM User WHERE Username = '${String(id.username).replace(/'/g, "\\'")}'`, { allowFail: true }) || [])[0];
  const myPsl = me ? (query(org, `SELECT PermissionSetLicense.MasterLabel FROM PermissionSetLicenseAssign WHERE AssigneeId = '${me.Id}' ORDER BY PermissionSetLicense.MasterLabel`, { allowFail: true }) || []).map((r) => r.PermissionSetLicense.MasterLabel) : [];
  const userLic = query(org, "SELECT Name, Status, TotalLicenses, UsedLicenses FROM UserLicense WHERE Status = 'Active' ORDER BY Name", { allowFail: true }) || [];
  const selected = readImplementation().verticals || [];

  const result = { assessedAt: new Date().toISOString(), org, orgId: id.orgId, orgName: id.orgName, edition: id.edition, isSandbox: id.isSandbox, personAccounts, finservManagedPackage: finservPkg, selectedVerticals: selected, permissionSetLicenses: psl, runningUserPsl: myPsl, modules: {} };

  for (const m of modules()) {
    const missing = m.requiredObjects.filter((o) => !objects.has(o));
    const optionalMissing = m.optionalObjects.filter((o) => !objects.has(o));
    const blockers = [...missing];
    if (m.requiresPersonAccounts && !personAccounts) blockers.push('Person Accounts');
    const hints = psl.filter((p) => m.licenseHints.some((h) => `${p.MasterLabel} ${p.DeveloperName}`.toLowerCase().includes(h.toLowerCase())));
    result.modules[m.id] = {
      label: m.label,
      verdict: blockers.length ? 'No listo' : 'Listo',
      missing: blockers,
      optionalMissing,
      present: [...m.requiredObjects, ...m.optionalObjects].filter((o) => objects.has(o)),
      licenses: hints.map((p) => `${p.MasterLabel} (${p.UsedLicenses}/${p.TotalLicenses})`),
      prerequisites: m.setupPrerequisites
    };
  }

  writeJson(path.join(ROOT, 'build', 'assessment', `${org}.json`), result);

  const yes = (b) => (b ? 'Sí' : 'No');
  const verdictTxt = (v) => (v === 'Listo' ? '✔ Listo' : '✖ No listo');
  const md = `# Diagnóstico de la org (COM-001)

Generado por \`npm run assess\` el ${result.assessedAt}. Solo lectura: no se modificó nada en la org.

| Dato | Valor |
|---|---|
| Org | ${org} · ${id.username} |
| Nombre / Org Id | ${id.orgName || '-'} · ${id.orgId || '-'} |
| Edición | ${id.edition || '-'}${id.isSandbox ? ' (sandbox)' : ''} |
| Person Accounts | ${yes(personAccounts)} |
| Paquete gestionado FinServ instalado | ${yes(finservPkg)}${finservPkg ? ' · ⚠ Este Starter Pack usa FSC Core (objetos estándar); Salesforce recomienda no mezclar ambos modelos' : ''} |
| Vertical seleccionada | ${selected.length ? labelOf(selected) : 'Sin seleccionar (npm run configure)'} |

> Los objetos se detectan con \`sf sobject list\`, que solo muestra lo que puede ver el usuario que corre el diagnóstico. Un objeto "faltante" puede deberse a una funcionalidad apagada en Setup **o** a una licencia/permiso no asignado a ese usuario.

Licencias asignadas al usuario del diagnóstico: ${myPsl.join(', ') || 'ninguna relacionada'}

## Disponibilidad por módulo

| Módulo | Veredicto | Faltan (requeridos) | Faltan (opcionales) | Licencias relacionadas |
|---|---|---|---|---|
${Object.entries(result.modules).map(([k, r]) => `| ${r.label}${selected.includes(k) ? ' **(seleccionada)**' : ''} | ${verdictTxt(r.verdict)} | ${r.missing.join(', ') || '-'} | ${r.optionalMissing.join(', ') || '-'} | ${r.licenses.join('; ') || '-'} |`).join('\n')}

## Prerrequisitos de Setup por módulo

${Object.values(result.modules).map((r) => `**${r.label}**\n${r.prerequisites.map((p) => `- ${p}`).join('\n')}`).join('\n\n')}

## Permission Set Licenses relacionadas

| Etiqueta | DeveloperName | Estado | Usadas / Total |
|---|---|---|---|
${psl.map((p) => `| ${p.MasterLabel} | ${p.DeveloperName} | ${p.Status} | ${p.UsedLicenses} / ${p.TotalLicenses} |`).join('\n') || '| - | - | - | - |'}

## Licencias de usuario activas

| Licencia | Usadas / Total |
|---|---|
${userLic.map((u) => `| ${u.Name} | ${u.UsedLicenses} / ${u.TotalLicenses} |`).join('\n') || '| - | - |'}

> La validación contractual de licencias y alcance la confirma una persona (COM-001: "Humano confirma licencias, alcance y arquitectura").
`;
  const outDir = path.join(ROOT, 'deployments', org);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'ORG_ASSESSMENT.md'), md);

  console.log(`  Edición: ${id.edition || '-'}${id.isSandbox ? ' (sandbox)' : ''} · Person Accounts: ${yes(personAccounts)} · FinServ gestionado: ${yes(finservPkg)}`);
  for (const [k, r] of Object.entries(result.modules)) {
    const mark = r.verdict === 'Listo' ? c.green('✔') : c.red('✖');
    console.log(`  ${mark} ${r.label.padEnd(16)} ${r.verdict}${r.missing.length ? ` · faltan: ${r.missing.join(', ')}` : ''}${selected.includes(k) ? c.bold('  ← seleccionada') : ''}`);
  }
  if (finservPkg) console.log(c.yellow('  ⚠ La org tiene el paquete FinServ: este Starter Pack usa FSC Core. Revisar antes de continuar.'));
  console.log(c.bold(`\nReporte: deployments/${org}/ORG_ASSESSMENT.md`));
}

main();
