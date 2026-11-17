const t = require('../_lib');
module.exports = { id: 'COM-T06', catalogId: 'COM-028', title: 'KYC aprobado sin fecha de revisión se rechaza', requiresData: true,
  run: (ctx) => t.expectReject(ctx, 'Account', { Name: t.stamp(), ETC_Estatus_KYC__c: 'Aprobado' }, 'Captura la fecha de revisión KYC') };
