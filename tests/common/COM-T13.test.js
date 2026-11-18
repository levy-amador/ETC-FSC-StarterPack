const t = require('../_lib');
module.exports = { id: 'COM-T13', catalogId: 'COM-027', title: 'Regla de duplicados detecta un RFC repetido (por API se rechaza)', requiresData: true,
  run: (ctx) => {
    const rfc = 'DUP' + String(Date.now()).slice(-6) + 'AA1';
    const first = t.expectAccept(ctx, 'Account', { Name: t.stamp(), ETC_RFC__c: rfc });
    if (!first.pass) return first;
    return t.expectReject(ctx, 'Account', { Name: t.stamp(), ETC_RFC__c: rfc }, 'Posible duplicado');
  } };
