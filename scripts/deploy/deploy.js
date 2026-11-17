#!/usr/bin/env node
'use strict';
// npm run deploy -- --target-org ALIAS [--yes --confirm-vertical <id>] [--from 05-duplicate-rules] [--to 11-flows] [--only 11-flows]
//
// Controles antes de tocar la org:
//   1. La vertical del build debe confirmarse explícitamente (se escribe su id, o --confirm-vertical en modo no interactivo).
//   2. Debe existir un diagnóstico (npm run assess) de ESA org que marque como "Listo" la base y la vertical.
//      Solo se omite con --skip-assess, que queda registrado en el log.
//   3. Confirmación final del despliegue (o --yes).
// Antes de cada etapa se ejecuta una validación check-only; si falla, se detiene sin desplegarla.
// No realiza cambios destructivos (no usa destructiveChanges).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { spawnSync } = require('child_process');
const { ROOT, c, fail, parseArgs, readJson, writeJson, sf, query, orgIdentity, targetOrg, timestamp } = require('../lib/common');
const { labelOf, ask } = require('../lib/vertical');
const { STAGES } = require('./stages');

const MDAPI = path.join(ROOT, 'build', 'mdapi');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function failuresOf(res) {
  const r = res.result || {};
  const list = [].concat(r.details?.componentFailures || []).map((f) => `${f.componentType} ${f.fullName}: ${f.problem}`);
  if (!list.length && res.status !== 0) list.push(res.message || 'Error desconocido');
  return list;
}

function run(stageDir, org, dryRun) {
  const args = ['project', 'deploy', 'start', '--metadata-dir', stageDir, '--target-org', org, '--test-level', 'NoTestRun', '--wait', '60'];
  if (dryRun) args.push('--dry-run');
  return sf(args, { allowFail: true });
}

async function waitMatchingRules(org) {
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    const rows = query(org, "SELECT DeveloperName, RuleStatus FROM MatchingRule WHERE DeveloperName LIKE 'ETC_%'");
    const pending = rows.filter((r) => r.RuleStatus !== 'Active');
    if (rows.length && !pending.length) return `Matching Rules activas: ${rows.length}`;
    if (pending.some((r) => r.RuleStatus === 'Failed' || r.RuleStatus === 'ActivationFailed')) throw new Error(`Activación fallida: ${pending.map((r) => r.DeveloperName).join(', ')}`);
    process.stdout.write('.');
    await sleep(15000);
  }
  throw new Error('Tiempo de espera agotado para la activación de Matching Rules');
}

// El cambio de OWD se aplica de forma asíncrona (recálculo de colaboración).
// Solo los objetos con columna en Organization se pueden verificar por SOQL.
const OWD_FIELD = { Account: 'DefaultAccountAccess', Opportunity: 'DefaultOpportunityAccess', Contact: 'DefaultContactAccess', Case: 'DefaultCaseAccess', Lead: 'DefaultLeadAccess' };
const OWD_VALUE = { Private: 'None', ControlledByParent: 'ControlledByParent' };
async function waitSharingModel(org, modules) {
  const cfg = readJson(path.join(ROOT, 'config', 'sharing-model.json')).modules;
  const targets = Object.assign({}, ...modules.map((m) => (cfg[m] || {}).objects || {}));
  const checkable = Object.entries(targets).filter(([o]) => OWD_FIELD[o]);
  if (!checkable.length) return 'Sin OWD verificables por SOQL';
  const deadline = Date.now() + 30 * 60 * 1000;
  while (Date.now() < deadline) {
    const row = query(org, `SELECT ${checkable.map(([o]) => OWD_FIELD[o]).join(', ')} FROM Organization`)[0];
    const pending = checkable.filter(([o, v]) => row[OWD_FIELD[o]] !== (OWD_VALUE[v.sharingModel] || v.sharingModel));
    if (!pending.length) return `OWD aplicados: ${checkable.map(([o, v]) => `${o}=${v.sharingModel}`).join(', ')}`;
    process.stdout.write('.');
    await sleep(15000);
  }
  throw new Error('Tiempo de espera agotado para el recálculo de colaboración (OWD)');
}

async function waitPermissionSetGroups(org) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const rows = query(org, "SELECT DeveloperName, Status FROM PermissionSetGroup WHERE DeveloperName LIKE 'ETC_PSG_%'");
    if (!rows.length) return 'Sin Permission Set Groups ETC';
    const pending = rows.filter((r) => r.Status !== 'Updated');
    if (!pending.length) return `Permission Set Groups calculados: ${rows.length}`;
    if (pending.some((r) => r.Status === 'Failed')) throw new Error(`Cálculo fallido: ${pending.map((r) => r.DeveloperName).join(', ')}`);
    process.stdout.write('.');
    await sleep(10000);
  }
  throw new Error('Tiempo de espera agotado para el cálculo de Permission Set Groups');
}

// Metadata API no versiona un ContentAsset existente: si el logo cambió, se sube una nueva ContentVersion
// al documento del asset y se apunta logoVersion de la app a esa versión (en el paquete construido).
function syncLogo(org, stageDir) {
  const assetFile = path.join(stageDir, 'contentassets', 'ETC_App_Logo.asset');
  if (!fs.existsSync(assetFile)) return null;
  const rows = query(org, "SELECT Id, ContentDocumentId, VersionNumber, Checksum FROM ContentVersion WHERE Title = 'ETC_App_Logo' AND IsLatest = true");
  if (!rows.length) return null; // primera instalación: el ContentAsset se crea con la versión 1
  const local = fs.readFileSync(assetFile);
  let version = Number(rows[0].VersionNumber);
  let note = `logo sin cambios (versión ${version})`;
  if (crypto.createHash('md5').update(local).digest('hex') !== rows[0].Checksum) {
    const body = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'etc-logo-')), 'body.json');
    fs.writeFileSync(body, JSON.stringify({ ContentDocumentId: rows[0].ContentDocumentId, Title: 'ETC_App_Logo', PathOnClient: 'ETC_App_Logo.png', VersionData: local.toString('base64'), ReasonForChange: 'npm run deploy: logo actualizado' }));
    const r = spawnSync('sf', ['api', 'request', 'rest', `/services/data/v${readJson(path.join(ROOT, 'sfdx-project.json')).sourceApiVersion}/sobjects/ContentVersion`, '-X', 'POST', '-H', 'Content-Type:application/json', '--body', `@${body}`, '--target-org', org], { encoding: 'utf8' });
    if (!/"success"\s*:\s*true/.test(r.stdout || '')) throw new Error(`No se pudo subir la nueva versión del logo: ${(r.stdout || r.stderr).slice(-300)}`);
    version = Number(query(org, "SELECT VersionNumber FROM ContentVersion WHERE Title = 'ETC_App_Logo' AND IsLatest = true")[0].VersionNumber);
    note = `logo actualizado a la versión ${version}`;
  }
  for (const f of fs.readdirSync(path.join(stageDir, 'applications'))) {
    const p = path.join(stageDir, 'applications', f);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/<logoVersion>\d+<\/logoVersion>/, `<logoVersion>${version}</logoVersion>`));
  }
  return note;
}

// Control 2: diagnóstico de la org.
function checkAssessment(org, modules, args) {
  const file = path.join(ROOT, 'build', 'assessment', `${org}.json`);
  const a = readJson(file, null);
  if (args['skip-assess']) return { skipped: true, note: 'Diagnóstico omitido con --skip-assess' };
  if (!a) fail(`No hay diagnóstico de ${org}. Ejecuta npm run assess -- --target-org ${org} (o usa --skip-assess bajo tu responsabilidad).`);
  const notReady = modules.filter((m) => a.modules?.[m]?.verdict !== 'Listo');
  if (notReady.length) {
    for (const m of notReady) console.log(c.red(`  ✖ ${m}: ${a.modules?.[m]?.verdict || 'sin evaluar'} · ${(a.modules?.[m]?.missing || []).join(', ')}`));
    fail(`La org no está lista para: ${notReady.join(', ')}. Revisa deployments/${org}/ORG_ASSESSMENT.md.`);
  }
  return { skipped: false, assessedAt: a.assessedAt };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const org = targetOrg(args);
  if (!org) fail('Indica la org con --target-org.');
  const summary = readJson(path.join(ROOT, 'build', 'build-summary.json'), null);
  if (!summary) fail('No existe build: ejecuta npm run build -- --target-org ' + org);
  if (summary.targetOrg && summary.targetOrg !== org) fail(`El build se generó para ${summary.targetOrg}; vuelve a ejecutar npm run build -- --target-org ${org}`);
  if (!summary.targetOrg) fail('El build se generó sin org (--skip-org). Para desplegar, ejecuta npm run build -- --target-org ' + org);

  const verticals = summary.verticals || [];
  const id = orgIdentity(org);

  console.log(c.bold(`\nDespliegue ETC Financial Services Cloud Starter Pack → ${org} (${id.username} · ${id.orgName || 'org'}${id.isSandbox ? ' · sandbox' : ''})`));
  console.log(`  Módulos:  base común + ${c.bold(labelOf(verticals))}`);

  // Control 1: confirmación explícita de la vertical.
  if (args.yes) {
    if (String(args['confirm-vertical'] || '') !== verticals.join(',')) {
      fail(`En modo no interactivo confirma la vertical con --confirm-vertical ${verticals.join(',')}`, 2);
    }
  } else {
    if (!process.stdin.isTTY) fail('Sin terminal interactiva: usa --yes --confirm-vertical <id>.', 2);
    const typed = await ask(`\nEscribe el id de la vertical que se implementará con este cliente para confirmar (${verticals.join(',')}): `);
    if (typed.replace(/\s/g, '') !== verticals.join(',')) fail('La vertical no coincide con el build. Despliegue cancelado.', 2);
  }

  const assess = checkAssessment(org, summary.modules, args);
  if (assess.skipped) console.log(c.yellow(`  ⚠ ${assess.note}`));
  else console.log(`  Diagnóstico: ${c.green('Listo')} (${assess.assessedAt})`);

  let ids = STAGES.map((s) => s.id);
  if (args.from) ids = ids.slice(ids.indexOf(args.from));
  if (args.to) ids = ids.slice(0, ids.indexOf(args.to) + 1);
  if (args.only) ids = [args.only];
  if (!ids.length || ids.includes(undefined)) fail('Etapa desconocida.');
  for (const sid of ids) {
    const st = summary.stages.find((s) => s.id === sid);
    console.log(`  ${sid.padEnd(24)} ${String(st?.components ?? 0).padStart(3)} componentes`);
  }
  if (!args.yes) {
    const a = await ask('\n¿Confirmas que deseas desplegar esta configuración en la organización seleccionada? (s/N) ');
    if (!/^(s|si|sí|y|yes)$/i.test(a)) fail('Despliegue cancelado: no se recibió confirmación.', 2);
  }

  const runDir = path.join(ROOT, 'build', 'deploy-results', timestamp());
  fs.mkdirSync(runDir, { recursive: true });
  const log = { startedAt: new Date().toISOString(), org, username: id.username, orgId: id.orgId, verticals, modules: summary.modules, assessment: assess, stages: [] };
  const save = () => {
    writeJson(path.join(runDir, 'deploy-log.json'), log);
    writeJson(path.join(ROOT, 'build', 'deploy-results', 'latest.json'), { ...log, runDir: path.relative(ROOT, runDir) });
  };

  for (const sid of ids) {
    const stage = STAGES.find((s) => s.id === sid);
    const dir = path.join(MDAPI, sid);
    const entry = { id: sid, label: stage.label, startedAt: new Date().toISOString() };
    log.stages.push(entry);
    if (!fs.existsSync(path.join(dir, 'package.xml'))) {
      entry.result = 'Omitida (sin componentes)';
      console.log(`${c.yellow('–')} ${sid}: sin componentes`);
      save();
      continue;
    }
    if (sid === '13-app-branding') {
      const note = syncLogo(org, dir);
      if (note) { entry.preCheck = note; console.log(`${c.bold(sid)} ${note}`); }
    }
    process.stdout.write(`${c.bold(sid)} validando… `);
    const check = run(dir, org, true);
    entry.validationId = check.result?.id;
    if (!(check.result && check.result.success)) {
      entry.result = 'Validación fallida';
      entry.failures = failuresOf(check);
      save();
      console.log(c.red('fallida'));
      entry.failures.forEach((f) => console.log(`   - ${f}`));
      fail(`Despliegue detenido en ${sid}. Las etapas anteriores quedaron desplegadas; ninguna posterior se ejecutó.`);
    }
    process.stdout.write(`${c.green('ok')} · desplegando… `);
    const res = run(dir, org, false);
    writeJson(path.join(runDir, `${sid}.json`), res);
    entry.deployId = res.result?.id;
    entry.components = res.result?.numberComponentsDeployed;
    if (!(res.result && res.result.success)) {
      entry.result = 'Despliegue fallido';
      entry.failures = failuresOf(res);
      save();
      console.log(c.red('fallido'));
      entry.failures.forEach((f) => console.log(`   - ${f}`));
      fail(`Despliegue detenido en ${sid}.`);
    }
    try {
      if (stage.waitFor === 'matchingRules') entry.postCheck = await waitMatchingRules(org);
      if (stage.waitFor === 'sharingModel') entry.postCheck = await waitSharingModel(org, summary.modules);
      if (stage.waitFor === 'permissionSetGroups') entry.postCheck = await waitPermissionSetGroups(org);
    } catch (e) {
      entry.result = 'Desplegada con verificación posterior fallida';
      entry.failures = [e.message];
      save();
      fail(`${sid}: ${e.message}`);
    }
    entry.result = 'Desplegada';
    entry.finishedAt = new Date().toISOString();
    save();
    console.log(`${c.green('ok')} (${entry.components} componentes, ${entry.deployId})${entry.postCheck ? ' · ' + entry.postCheck : ''}`);
  }
  log.finishedAt = new Date().toISOString();
  log.success = log.stages.every((s) => s.result === 'Desplegada' || s.result.startsWith('Omitida'));
  save();
  console.log(c.green(`\n✔ Despliegue completo. Registro: ${path.relative(ROOT, runDir)}. Ejecuta npm run deployment-report.`));
}

main().catch((e) => fail(e.stack || e.message));
