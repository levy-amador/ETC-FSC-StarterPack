module.exports = { id: 'COM-T17', catalogId: 'COM-022', title: 'Plantillas de Action Plans desplegadas', requiresData: false,
  run: (ctx) => {
    const rows = ctx.query("SELECT Name FROM ActionPlanTemplate WHERE Name LIKE 'ETC%'", { allowFail: true });
    if (!rows) return { pass: false, detail: 'No se pudo consultar ActionPlanTemplate' };
    return { pass: rows.length >= 2, detail: rows.map((r) => r.Name).join(', ') || 'sin plantillas' };
  } };
