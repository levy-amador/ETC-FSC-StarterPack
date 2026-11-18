const t = require('../_lib');
module.exports = { id: 'COM-T16', catalogId: 'COM-024', title: 'Una aclaración se asigna a la cola de aclaraciones y quejas', requiresData: true,
  run: (ctx) => {
    const r = t.createAutoAssign(ctx, 'Case', { Subject: t.stamp(), Type: 'Aclaración', Status: 'New' });
    if (!r.ok) return { pass: false, detail: r.message };
    const q = t.ownerQueue(ctx, 'Case', r.id);
    return { pass: q === 'ETC_Aclaraciones_Quejas', detail: `Propietario: ${q}` };
  } };
