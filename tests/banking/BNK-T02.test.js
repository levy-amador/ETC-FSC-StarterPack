const t = require('../_lib');
module.exports = { id: 'BNK-T02', catalogId: 'BNK-003', title: 'Cuenta cerrada sin fecha de cierre se rechaza', requiresData: true,
  run: (ctx) => t.expectReject(ctx, 'FinancialAccount', { Name: t.stamp(), Status: 'Closed' }, 'Captura la fecha de cierre') };
