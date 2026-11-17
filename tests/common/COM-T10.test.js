const t = require('../_lib');
module.exports = { id: 'COM-T10', catalogId: 'COM-004', title: 'Permission Set Groups calculados y con sus PS', requiresData: false,
  run: (ctx) => {
    const rows = ctx.query("SELECT DeveloperName, Status FROM PermissionSetGroup WHERE DeveloperName LIKE 'ETC_PSG_%'") || [];
    const ok = rows.length === 6 && rows.every((r) => r.Status === 'Updated');
    return { pass: ok, detail: `${rows.length} grupos: ${rows.map((r) => `${r.DeveloperName.replace('ETC_PSG_', '')}=${r.Status}`).join(', ')}` };
  } };
