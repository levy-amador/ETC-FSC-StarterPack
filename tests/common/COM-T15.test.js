const t = require('../_lib');
module.exports = { id: 'COM-T15', catalogId: 'COM-013', title: 'Etapas de oportunidad de la base ETC con probabilidad', requiresData: true,
  run: (ctx) => {
    const acc = t.expectAccept(ctx, 'Account', { Name: t.stamp() });
    if (!acc.pass) return acc;
    const close = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const r = t.expectAccept(ctx, 'Opportunity', { Name: t.stamp(), AccountId: acc.id, StageName: 'Negociación', CloseDate: close });
    if (!r.pass) return r;
    const o = ctx.query(`SELECT Probability, ForecastCategoryName FROM Opportunity WHERE Id = '${r.id}'`)[0];
    return { pass: o.Probability === 75, detail: `Negociación → ${o.Probability}% · ${o.ForecastCategoryName}` };
  } };
