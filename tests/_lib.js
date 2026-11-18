'use strict';
// Utilidades para pruebas funcionales: crean registros por API y registran su limpieza (--cleanup).
const vals = (o) => Object.entries(o).map(([k, v]) => `${k}='${String(v).replace(/'/g, "\\'")}'`).join(' ');

function create(ctx, sobject, values) {
  const r = ctx.sf(['data', 'create', 'record', '--sobject', sobject, '--values', vals(values), '--target-org', ctx.org], { allowFail: true });
  if (r.status === 0) ctx.created.push({ sobject, id: r.result.id });
  return { ok: r.status === 0, id: r.result?.id, message: r.message || '' };
}

// Debe fallar con un mensaje que contenga `expect`.
function expectReject(ctx, sobject, values, expect) {
  const r = create(ctx, sobject, values);
  if (r.ok) return { pass: false, detail: `Se guardó y debía rechazarse (${r.id})` };
  if (/No such column|INVALID_FIELD|insufficient access/i.test(r.message)) return { pass: false, detail: `Error de acceso, no de validación: ${r.message.slice(0, 160)}` };
  return { pass: r.message.includes(expect), detail: r.message.includes(expect) ? `Rechazado: "${expect}"` : `Rechazado con otro mensaje: ${r.message.slice(0, 160)}` };
}

function expectAccept(ctx, sobject, values) {
  const r = create(ctx, sobject, values);
  return { pass: r.ok, detail: r.ok ? `Guardado (${sobject})` : r.message.slice(0, 200), id: r.id };
}

function recordTypeId(ctx, sobject, developerName) {
  const rows = ctx.query(`SELECT Id FROM RecordType WHERE SobjectType = '${sobject}' AND DeveloperName = '${developerName}'`) || [];
  return rows[0]?.Id;
}

const stamp = () => `ETC TEST ${Date.now().toString(36).toUpperCase()}`;
module.exports = { create, expectReject, expectAccept, recordTypeId, stamp };

// Crea un registro por REST con el encabezado que activa las reglas de asignación (como la UI o Email-to-Case).
const { spawnSync } = require('child_process');
function createAutoAssign(ctx, sobject, values) {
  const api = require('../sfdx-project.json').sourceApiVersion;
  const r = spawnSync('sf', ['api', 'request', 'rest', `/services/data/v${api}/sobjects/${sobject}`, '-X', 'POST', '-H', 'Sforce-Auto-Assign:TRUE', '-H', 'Content-Type:application/json', '--body', JSON.stringify(values), '--target-org', ctx.org], { encoding: 'utf8' });
  const m = (r.stdout || '').match(/"id"\s*:\s*"(\w+)"/);
  if (m) ctx.created.push({ sobject, id: m[1] });
  return { ok: !!m, id: m && m[1], message: m ? '' : (r.stdout || r.stderr).slice(-200) };
}
function ownerQueue(ctx, sobject, id) {
  const row = ctx.query(`SELECT OwnerId FROM ${sobject} WHERE Id = '${id}'`)[0];
  const q = (ctx.query(`SELECT DeveloperName FROM Group WHERE Id = '${row.OwnerId}'`) || [])[0];
  return q ? q.DeveloperName : `usuario ${row.OwnerId}`;
}
module.exports.createAutoAssign = createAutoAssign;
module.exports.ownerQueue = ownerQueue;
