#!/usr/bin/env node
'use strict';
// npm run test -- --target-org ALIAS [--allow-data] [--cleanup]
// Corre las pruebas funcionales de los módulos del build (base común + vertical).
// Cada prueba vive en tests/<módulo>/<ID>.test.js y exporta { id, catalogId, title, requiresData, run(ctx) }.
// run(ctx) devuelve { pass: boolean, detail: string }. ctx = { org, query, sf, created: [] }.
// Sin --allow-data se omiten las pruebas que crean registros. Con --cleanup se eliminan los registros creados.
const fs = require('fs');
const path = require('path');
const { ROOT, c, fail, parseArgs, readJson, sf, query, targetOrg, listFiles } = require('../lib/common');
const { labelOf } = require('../lib/vertical');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const org = targetOrg(args);
  if (!org) fail('Indica la org con --target-org.');
  const summary = readJson(path.join(ROOT, 'build', 'build-summary.json'), null);
  if (!summary) fail('No existe build: ejecuta npm run build primero.');
  const files = summary.modules.flatMap((m) => listFiles(path.join(ROOT, 'tests', m), (p) => p.endsWith('.test.js')));
  console.log(c.bold(`Pruebas · base común + ${labelOf(summary.verticals)} · ${org} · ${files.length} pruebas`));
  if (!files.length) {
    console.log(c.yellow('  Aún no hay pruebas definidas para estos módulos (tests/<módulo>/*.test.js).'));
    return;
  }
  const ctx = { org, sf, query: (q, o) => query(org, q, o), created: [] };
  const results = [];
  for (const f of files) {
    const t = require(f);
    if (t.requiresData && !args['allow-data']) { results.push({ ...t, status: 'Omitida', detail: 'Requiere --allow-data' }); continue; }
    try {
      const r = await t.run(ctx);
      results.push({ ...t, status: r.pass ? 'OK' : 'Falla', detail: r.detail });
    } catch (e) {
      results.push({ ...t, status: 'Error', detail: e.message });
    }
  }
  if (args.cleanup) for (const { sobject, id } of ctx.created.reverse()) sf(['data', 'delete', 'record', '--sobject', sobject, '--record-id', id, '--target-org', org], { allowFail: true });
  for (const r of results) console.log(`  ${r.status === 'OK' ? c.green('✔') : r.status === 'Omitida' ? c.yellow('–') : c.red('✖')} ${r.id} ${r.title} · ${r.detail || ''}`);
  const outDir = path.join(ROOT, 'deployments', org);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'TEST_RESULTS.md'), `# Resultados de pruebas\n\n${new Date().toISOString()} · base común + ${labelOf(summary.verticals)}\n\n| ID | Catálogo | Prueba | Resultado | Detalle |\n|---|---|---|---|---|\n${results.map((r) => `| ${r.id} | ${r.catalogId || '-'} | ${r.title} | ${r.status} | ${(r.detail || '').replace(/\|/g, '/')} |`).join('\n')}\n`);
  process.exit(results.some((r) => ['Falla', 'Error'].includes(r.status)) ? 1 : 0);
}

main().catch((e) => fail(e.stack || e.message));
