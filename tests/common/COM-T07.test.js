const t = require('../_lib');
module.exports = { id: 'COM-T07', catalogId: 'COM-019', title: 'Caso cerrado sin resolución se rechaza', requiresData: true,
  run: (ctx) => t.expectReject(ctx, 'Case', { Subject: t.stamp(), Status: 'Closed' }, 'Captura la resolución') };
