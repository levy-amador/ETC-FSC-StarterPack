const t = require('../_lib');
module.exports = { id: 'COM-T02', catalogId: 'COM-028', title: 'RFC válido de persona moral se acepta', requiresData: true,
  run: (ctx) => t.expectAccept(ctx, 'Account', { Name: t.stamp(), ETC_RFC__c: 'ABC010203XY1', ETC_Segmento__c: 'PyME' }) };
