const t = require('../_lib');
module.exports = { id: 'COM-T05', catalogId: 'COM-028', title: 'Cliente activo sin KYC aprobado se rechaza', requiresData: true,
  run: (ctx) => t.expectReject(ctx, 'Account', { Name: t.stamp(), ETC_Tipo_Cliente__c: 'Cliente activo', ETC_Estatus_KYC__c: 'Pendiente' }, 'requiere estatus KYC Aprobado') };
