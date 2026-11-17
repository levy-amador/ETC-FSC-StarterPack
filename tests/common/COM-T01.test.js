const t = require('../_lib');
module.exports = { id: 'COM-T01', catalogId: 'COM-028', title: 'RFC con formato inválido se rechaza (empresa)', requiresData: true,
  run: (ctx) => t.expectReject(ctx, 'Account', { Name: t.stamp(), ETC_RFC__c: 'ABC12' }, 'El RFC no tiene un formato válido') };
