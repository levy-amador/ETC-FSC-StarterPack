const t = require('../_lib');
module.exports = { id: 'BNK-T04', catalogId: 'BNK-012', title: 'Una solicitud sobre una cuenta financiera se asigna a la cola de Banca', requiresData: true,
  run: (ctx) => {
    const fa = t.expectAccept(ctx, 'FinancialAccount', { Name: t.stamp(), FinancialAccountNumber: String(Date.now()).slice(-9), Type: 'Checking' });
    if (!fa.pass) return fa;
    const r = t.createAutoAssign(ctx, 'Case', { Subject: t.stamp(), Type: 'Solicitud de servicio', Status: 'New', ETC_Cuenta_Financiera__c: fa.id });
    if (!r.ok) return { pass: false, detail: r.message };
    const q = t.ownerQueue(ctx, 'Case', r.id);
    return { pass: q === 'ETC_Servicio_Banca', detail: `Propietario: ${q}` };
  } };
