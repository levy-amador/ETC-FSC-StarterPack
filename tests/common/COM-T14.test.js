module.exports = { id: 'COM-T14', catalogId: 'COM-013', title: 'Path activo en prospectos y oportunidades', requiresData: false,
  run: (ctx) => {
    const rows = ctx.query("SELECT DeveloperName, IsActive, SobjectType FROM PathAssistant WHERE DeveloperName LIKE 'ETC_%'", { tooling: true }) || [];
    const ok = rows.length === 2 && rows.every((r) => r.IsActive);
    return { pass: ok, detail: rows.map((r) => `${r.SobjectType}=${r.IsActive ? 'activo' : 'inactivo'}`).join(', ') || 'sin Path' };
  } };
