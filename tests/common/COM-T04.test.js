const t = require('../_lib');
module.exports = { id: 'COM-T04', catalogId: 'COM-010', title: 'Cuenta personal válida (RFC física 13 y CURP 18) se acepta', requiresData: true,
  run: (ctx) => t.expectAccept(ctx, 'Account', { RecordTypeId: t.recordTypeId(ctx, 'Account', 'PersonAccount'), FirstName: 'Prueba', LastName: t.stamp(), ETC_RFC__c: 'GOMA850101AB2', ETC_CURP__pc: 'GOMA850101HDFRRN09' }) };
