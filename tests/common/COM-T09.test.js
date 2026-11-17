const t = require('../_lib');
module.exports = { id: 'COM-T09', catalogId: 'COM-007', title: 'OWD privado aplicado (Account, Opportunity, Case, Lead)', requiresData: false,
  run: (ctx) => {
    const r = ctx.query('SELECT DefaultAccountAccess, DefaultOpportunityAccess, DefaultCaseAccess, DefaultLeadAccess, DefaultContactAccess FROM Organization')[0];
    const ok = ['DefaultAccountAccess', 'DefaultOpportunityAccess', 'DefaultCaseAccess', 'DefaultLeadAccess'].every((k) => r[k] === 'None') && r.DefaultContactAccess === 'ControlledByParent';
    return { pass: ok, detail: `Account ${r.DefaultAccountAccess} · Opp ${r.DefaultOpportunityAccess} · Case ${r.DefaultCaseAccess} · Lead ${r.DefaultLeadAccess} · Contact ${r.DefaultContactAccess}` };
  } };
