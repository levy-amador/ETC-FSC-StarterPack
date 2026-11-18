const t = require('../_lib');
module.exports = { id: 'BNK-T02', catalogId: 'BNK-003', title: 'Cuenta cerrada sin fecha: el flow registra la fecha de cierre', requiresData: true,
  run: (ctx) => {
    const r = t.expectAccept(ctx, 'FinancialAccount', { Name: t.stamp(), FinancialAccountNumber: String(Date.now()).slice(-9), Type: 'Checking', Status: 'Closed' });
    if (!r.pass) return r;
    const row = ctx.query(`SELECT ClosingDate FROM FinancialAccount WHERE Id = '${r.id}'`)[0];
    return { pass: !!row.ClosingDate, detail: row.ClosingDate ? `Flow registró la fecha de cierre (${row.ClosingDate})` : 'Sin fecha de cierre' };
  } };
