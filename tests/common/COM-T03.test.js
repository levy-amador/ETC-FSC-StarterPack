const t = require('../_lib');
module.exports = { id: 'COM-T03', catalogId: 'COM-028', title: 'CURP inválida se rechaza en cuenta personal', requiresData: true,
  run: (ctx) => t.expectReject(ctx, 'Account', { RecordTypeId: t.recordTypeId(ctx, 'Account', 'PersonAccount'), LastName: t.stamp(), ETC_CURP__pc: 'CURP123' }, 'La CURP no tiene un formato válido') };
