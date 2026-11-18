const t = require('../_lib');
module.exports = { id: 'COM-T12', catalogId: 'COM-025', title: 'Flow asigna fecha compromiso a una aclaración nueva', requiresData: true,
  run: (ctx) => {
    const r = t.expectAccept(ctx, 'Case', { Subject: t.stamp(), Type: 'Aclaración', Status: 'New' });
    if (!r.pass) return r;
    const row = ctx.query(`SELECT ETC_Fecha_Compromiso__c, CreatedDate FROM Case WHERE Id = '${r.id}'`)[0];
    const cfg = (ctx.query("SELECT Dias_Compromiso_Aclaracion__c FROM ETC_Configuracion_FSC__mdt WHERE DeveloperName = 'Default'") || [])[0];
    if (!row.ETC_Fecha_Compromiso__c) return { pass: false, detail: 'Sin fecha compromiso' };
    const days = Math.round((new Date(row.ETC_Fecha_Compromiso__c) - new Date(row.CreatedDate.slice(0, 10))) / 86400000);
    const expected = cfg ? cfg.Dias_Compromiso_Aclaracion__c : 30;
    return { pass: Math.abs(days - expected) <= 1, detail: `Fecha compromiso ${row.ETC_Fecha_Compromiso__c} (+${days} días; configurado ${expected})` };
  } };
