#!/usr/bin/env node
'use strict';
// node scripts/generate/gen-process.js [--vertical banking]   (lo ejecuta npm run generate, antes de gen-ui)
// Genera desde config/spec/common-process.json:
//   - Etapas de oportunidad y estados de prospecto (Standard Value Sets) y su Path con guía por etapa.
//   - Colas de casos (cada una en su módulo) y la regla de asignación de casos de la base común,
//     con las entradas de la base + las verticales ACTIVAS (como las secciones de layouts en gen-ui).
//   - Plantillas de Action Plans (cada una en su módulo).
const fs = require('fs');
const path = require('path');
const { ROOT, CATALOG_FILE, c, fail, parseArgs, readJson, writeJson, moduleSrc } = require('../lib/common');
const { normalize, readImplementation } = require('../lib/vertical');

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';
const HDR = '<?xml version="1.0" encoding="UTF-8"?>\n';
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const args = parseArgs(process.argv.slice(2));
const active = args.vertical ? normalize(args.vertical) : readImplementation().verticals || [];
const isActive = (m) => m === 'common' || active.includes(m);
const spec = readJson(path.join(ROOT, 'config', 'spec', 'common-process.json'));
const counts = {};
const catalog = {};
const addCat = (id, comp) => id && (catalog[id] ||= new Set()).add(comp);
const write = (mod, rel, body) => {
  const f = path.join(moduleSrc(mod), rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, HDR + body);
  counts[mod] = (counts[mod] || 0) + 1;
};

function clean() {
  for (const m of ['common', 'insurance', 'banking', 'wealth']) {
    for (const d of ['pathAssistants', 'queues', 'assignmentRules', 'actionPlanTemplates']) fs.rmSync(path.join(moduleSrc(m), d), { recursive: true, force: true });
  }
  for (const f of ['OpportunityStage', 'LeadStatus']) fs.rmSync(path.join(moduleSrc('common'), 'standardValueSets', `${f}.standardValueSet-meta.xml`), { force: true });
  fs.rmSync(path.join(moduleSrc('common'), 'settings', 'PathAssistant.settings-meta.xml'), { force: true });
}

function stagesAndPaths() {
  write('common', 'settings/PathAssistant.settings-meta.xml', `<PathAssistantSettings ${NS}>\n    <pathAssistantEnabled>true</pathAssistantEnabled>\n</PathAssistantSettings>\n`);
  addCat('COM-013', 'Settings:PathAssistant');
  const opp = spec.opportunityStages.map((s) => `    <standardValue>\n        <fullName>${X(s.value)}</fullName>\n        <default>false</default>\n        <label>${X(s.value)}</label>\n        <closed>${!!s.closed}</closed>\n        <forecastCategory>${s.forecast}</forecastCategory>\n        <probability>${s.probability}</probability>\n        <won>${!!s.won}</won>\n    </standardValue>\n`).join('');
  write('common', 'standardValueSets/OpportunityStage.standardValueSet-meta.xml', `<StandardValueSet ${NS}>\n    <sorted>false</sorted>\n${opp}</StandardValueSet>\n`);
  const lead = spec.leadStatuses.map((s) => `    <standardValue>\n        <fullName>${X(s.value)}</fullName>\n        <default>${!!s.default}</default>\n        <label>${X(s.value)}</label>\n        <converted>${!!s.converted}</converted>\n    </standardValue>\n`).join('');
  write('common', 'standardValueSets/LeadStatus.standardValueSet-meta.xml', `<StandardValueSet ${NS}>\n    <sorted>false</sorted>\n${lead}</StandardValueSet>\n`);
  addCat('COM-013', 'StandardValueSet:OpportunityStage');
  addCat('COM-013', 'StandardValueSet:LeadStatus');
  const pathXml = (entity, field, label, steps) =>
    `<PathAssistant ${NS}>\n    <active>true</active>\n    <entityName>${entity}</entityName>\n    <fieldName>${field}</fieldName>\n    <masterLabel>${X(label)}</masterLabel>\n` +
    steps.map((s) => `    <pathAssistantSteps>\n${s.fields.map((f) => `        <fieldNames>${f}</fieldNames>\n`).join('')}        <info>${X(`<p>${s.info}</p>`)}</info>\n        <picklistValueName>${X(s.value)}</picklistValueName>\n    </pathAssistantSteps>\n`).join('') +
    `    <recordTypeName>__MASTER__</recordTypeName>\n</PathAssistant>\n`;
  write('common', 'pathAssistants/ETC_Oportunidad_Path.pathAssistant-meta.xml', pathXml('Opportunity', 'StageName', 'ETC Oportunidad', spec.opportunityStages));
  write('common', 'pathAssistants/ETC_Prospecto_Path.pathAssistant-meta.xml', pathXml('Lead', 'Status', 'ETC Prospecto', spec.leadStatuses));
  addCat('COM-013', 'PathAssistant:ETC_Oportunidad_Path');
  addCat('COM-013', 'PathAssistant:ETC_Prospecto_Path');
}

function queuesAndRouting() {
  for (const q of spec.queues) {
    write(q.module, `queues/${q.name}.queue-meta.xml`,
      `<Queue ${NS}>\n    <doesSendEmailToMembers>false</doesSendEmailToMembers>\n    <name>${X(q.label)}</name>\n    <queueMembers>\n        <roleAndSubordinates>\n${q.members.map((r) => `            <roleAndSubordinate>${r}</roleAndSubordinate>\n`).join('')}        </roleAndSubordinates>\n    </queueMembers>\n    <queueSobject>\n        <sobjectType>${q.object}</sobjectType>\n    </queueSobject>\n</Queue>\n`);
    addCat(q.catalog, `Queue:${q.name}`);
  }
  const a = spec.caseAssignment;
  const entries = a.entries.filter((e) => isActive(e.module));
  if (entries[entries.length - 1].formula !== 'true') fail('La regla de asignación debe terminar con una entrada para todo lo demás.');
  write('common', 'assignmentRules/Case.assignmentRules-meta.xml',
    `<AssignmentRules ${NS}>\n    <assignmentRule>\n        <fullName>${a.name}</fullName>\n        <active>true</active>\n` +
    entries.map((e) => `        <ruleEntry>\n            <assignedTo>${e.queue}</assignedTo>\n            <assignedToType>Queue</assignedToType>\n            <formula>${X(e.formula)}</formula>\n        </ruleEntry>\n`).join('') +
    `    </assignmentRule>\n</AssignmentRules>\n`);
  addCat(a.catalog, 'AssignmentRules:Case');
  return entries.length;
}

function actionPlans() {
  for (const t of spec.actionPlans) {
    const items = t.items.map(([subject, days, priority], i) =>
      `    <actionPlanTemplateItem>\n` +
      [['Subject', 'valueLiteral', subject], ['Priority', 'valueLiteral', priority], ['ActivityDate', 'valueFormula', `StartDate + ${days}`]]
        .map(([n, k, v]) => `        <actionPlanTemplateItemValue>\n            <itemEntityType>Task</itemEntityType>\n            <name>${n}</name>\n            <${k}>${X(v)}</${k}>\n        </actionPlanTemplateItemValue>\n`).join('') +
      `        <displayOrder>${i + 1}</displayOrder>\n        <isRequired>${priority === 'High'}</isRequired>\n        <itemEntityType>Task</itemEntityType>\n        <name>${X(subject.slice(0, 80))}</name>\n        <uniqueName>${t.name}_${i + 1}</uniqueName>\n    </actionPlanTemplateItem>\n`).join('');
    write(t.module, `actionPlanTemplates/${t.name}.apt-meta.xml`,
      `<ActionPlanTemplate ${NS}>\n${items}    <actionPlanType>Industries</actionPlanType>\n    <description>${X(`${t.label}. Plantilla base ETC; se ajusta con el proceso del cliente.`)}</description>\n    <isAdHocItemCreationEnabled>true</isAdHocItemCreationEnabled>\n    <name>${X(t.label)}</name>\n    <targetEntityType>${t.target}</targetEntityType>\n    <uniqueName>${t.name}</uniqueName>\n</ActionPlanTemplate>\n`);
    addCat(t.catalog, `ActionPlanTemplate:${t.name}`);
  }
}

function main() {
  clean();
  stagesAndPaths();
  const n = queuesAndRouting();
  actionPlans();
  const cat = readJson(CATALOG_FILE);
  for (const it of cat.items) {
    if (!catalog[it.id]) continue;
    it.componentes = [...new Set([...(it.componentes || []), ...catalog[it.id]])].sort();
    if (it.estado === 'Pendiente') it.estado = 'En construcción';
  }
  writeJson(CATALOG_FILE, cat);
  console.log(c.bold('Procesos') + `  ${Object.entries(counts).map(([m, k]) => `${m} ${k}`).join(' · ')} · regla de asignación con ${n} entradas`);
}

main();
