const t = require('../_lib');
module.exports = { id: 'COM-T08', catalogId: 'COM-019', title: 'Aclaración cerrada sin dictamen se rechaza', requiresData: true,
  run: (ctx) => t.expectReject(ctx, 'Case', { Subject: t.stamp(), Status: 'Closed', Type: 'Aclaración', ETC_Resolucion__c: 'Se respondió al cliente' }, 'requieren dictamen') };
