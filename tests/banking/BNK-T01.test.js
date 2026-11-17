const t = require('../_lib');
module.exports = { id: 'BNK-T01', catalogId: 'BNK-003', title: 'CLABE inválida se rechaza', requiresData: true,
  run: (ctx) => t.expectReject(ctx, 'FinancialAccount', { Name: t.stamp(), ETC_CLABE__c: '12345' }, 'La CLABE debe tener 18 dígitos') };
