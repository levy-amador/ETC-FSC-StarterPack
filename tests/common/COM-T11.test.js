const t = require('../_lib');
module.exports = { id: 'COM-T11', catalogId: 'COM-028', title: 'Flow normaliza el RFC (minúsculas y guion)', requiresData: true,
  run: (ctx) => {
    const r = t.expectAccept(ctx, 'Account', { Name: t.stamp(), ETC_RFC__c: 'xyz-991231ab9' });
    if (!r.pass) return r;
    const rfc = ctx.query(`SELECT ETC_RFC__c FROM Account WHERE Id = '${r.id}'`)[0].ETC_RFC__c;
    return { pass: rfc === 'XYZ991231AB9', detail: `Guardado como ${rfc}` };
  } };
