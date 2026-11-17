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
