const t = require('../_lib');
module.exports = { id: 'BNK-T03', catalogId: 'BNK-003', title: 'Cuenta válida con CLABE de 18 dígitos se acepta', requiresData: true,
  run: (ctx) => t.expectAccept(ctx, 'FinancialAccount', { Name: t.stamp(), FinancialAccountNumber: String(Date.now()).slice(-10), Type: 'Checking', ETC_CLABE__c: '012180001234567891', ETC_Moneda__c: 'MXN', Status: 'Active' }) };
