#!/usr/bin/env node
'use strict';
// node scripts/generate/gen-flows.js   (lo ejecuta npm run generate)
// Genera la Custom Metadata de configuración (ETC_Configuracion_FSC__mdt, registro Default) desde
// config/spec/common-settings.json y los flows de cada módulo. Los umbrales viven en la Custom Metadata,
// no en los flows. Ningún flow envía correos ni borra registros.
const fs = require('fs');
const path = require('path');
const { ROOT, c, readJson, moduleSrc } = require('../lib/common');

const API = readJson(path.join(ROOT, 'sfdx-project.json')).sourceApiVersion;
const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';
const HDR = '<?xml version="1.0" encoding="UTF-8"?>\n';
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const settings = readJson(path.join(ROOT, 'config', 'spec', 'common-settings.json'));
const MDT = 'ETC_Configuracion_FSC__mdt';
const counts = {};
const write = (mod, rel, body) => {
  const f = path.join(moduleSrc(mod), rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, HDR + body);
  counts[mod] = (counts[mod] || 0) + 1;
};

// ---------- Custom Metadata de configuración (base común)
function customMetadata() {
  const dir = `objects/${MDT}`;
  fs.rmSync(path.join(moduleSrc('common'), dir), { recursive: true, force: true });
  write('common', `${dir}/${MDT}.object-meta.xml`, `<CustomObject ${NS}>\n    <description>ETC | Umbrales configurables de los flows del Starter Pack FSC (registro Default).</description>\n    <label>ETC Configuración FSC</label>\n    <pluralLabel>ETC Configuraciones FSC</pluralLabel>\n    <visibility>Public</visibility>\n</CustomObject>\n`);
  for (const f of settings.fields) {
    const body = f.type === 'Checkbox'
      ? `    <defaultValue>false</defaultValue>\n    <description>${X(f.description)}</description>\n    <externalId>false</externalId>\n    <fieldManageability>SubscriberControlled</fieldManageability>\n    <label>${X(f.label)}</label>\n    <type>Checkbox</type>\n`
      : `    <description>${X(f.description)}</description>\n    <externalId>false</externalId>\n    <fieldManageability>SubscriberControlled</fieldManageability>\n    <label>${X(f.label)}</label>\n    <precision>4</precision>\n    <required>false</required>\n    <scale>0</scale>\n    <type>Number</type>\n    <unique>false</unique>\n`;
    write('common', `${dir}/fields/${f.apiName}.field-meta.xml`, `<CustomField ${NS}>\n    <fullName>${f.apiName}</fullName>\n${body}</CustomField>\n`);
  }
  fs.rmSync(path.join(moduleSrc('common'), 'customMetadata'), { recursive: true, force: true });
  write('common', 'customMetadata/ETC_Configuracion_FSC.Default.md-meta.xml',
    `<CustomMetadata ${NS} xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n    <label>Default</label>\n    <protected>false</protected>\n` +
    settings.fields.map((f) => `    <values>\n        <field>${f.apiName}</field>\n        <value xsi:type="${f.type === 'Checkbox' ? 'xsd:boolean' : 'xsd:double'}">${f.value}</value>\n    </values>\n`).join('') +
    `</CustomMetadata>\n`);
}

// ---------- Piezas de flow (mismo patrón probado en Sales Cloud)
const PMV = ['BuilderType', 'CanvasMode', 'OriginBuilderType'].map((n) => `    <processMetadataValues>\n        <name>${n}</name>\n        <value>\n            <stringValue>${n === 'CanvasMode' ? 'AUTO_LAYOUT_CANVAS' : 'LightningFlowBuilder'}</stringValue>\n        </value>\n    </processMetadataValues>\n`).join('');
const val = (v) => (v && v.ref ? `<elementReference>${v.ref}</elementReference>` : typeof v === 'boolean' ? `<booleanValue>${v}</booleanValue>` : typeof v === 'number' ? `<numberValue>${v}</numberValue>` : `<stringValue>${X(v)}</stringValue>`);
const cond = ([l, op, r]) => `            <conditions>\n                <leftValueReference>${l}</leftValueReference>\n                <operator>${op}</operator>\n                <rightValue>\n                    ${val(r)}\n                </rightValue>\n            </conditions>\n`;
const decision = (name, label, target, conditions, y) =>
  `    <decisions>\n        <name>${name}</name>\n        <label>${X(label)}</label>\n        <locationX>0</locationX>\n        <locationY>${y}</locationY>\n        <defaultConnectorLabel>No</defaultConnectorLabel>\n        <rules>\n            <name>${name}_Si</name>\n            <conditionLogic>and</conditionLogic>\n${conditions.map(cond).join('')}            <connector>\n                <targetReference>${target}</targetReference>\n            </connector>\n            <label>Sí</label>\n        </rules>\n    </decisions>\n`;
const assignment = (name, label, items, y) =>
  `    <assignments>\n        <name>${name}</name>\n        <label>${X(label)}</label>\n        <locationX>0</locationX>\n        <locationY>${y}</locationY>\n` +
  items.map(([ref, v]) => `        <assignmentItems>\n            <assignToReference>${ref}</assignToReference>\n            <operator>Assign</operator>\n            <value>\n                ${val(v)}\n            </value>\n        </assignmentItems>\n`).join('') + `    </assignments>\n`;
const formula = (name, type, expr) => `    <formulas>\n        <name>${name}</name>\n        <dataType>${type}</dataType>\n${type === 'Number' ? '        <scale>0</scale>\n' : ''}        <expression>${X(expr)}</expression>\n    </formulas>\n`;
const getConfig = (next, y) =>
  `    <recordLookups>\n        <name>Get_Config</name>\n        <label>Obtener configuración FSC</label>\n        <locationX>0</locationX>\n        <locationY>${y}</locationY>\n        <assignNullValuesIfNoRecordsFound>false</assignNullValuesIfNoRecordsFound>\n        <connector>\n            <targetReference>${next}</targetReference>\n        </connector>\n        <filterLogic>and</filterLogic>\n        <filters>\n            <field>DeveloperName</field>\n            <operator>EqualTo</operator>\n            <value>\n                <stringValue>Default</stringValue>\n            </value>\n        </filters>\n        <filters>\n            <field>Activo__c</field>\n            <operator>EqualTo</operator>\n            <value>\n                <booleanValue>true</booleanValue>\n            </value>\n        </filters>\n        <getFirstRecordOnly>true</getFirstRecordOnly>\n        <object>${MDT}</object>\n        <storeOutputAutomatically>true</storeOutputAutomatically>\n    </recordLookups>\n`;
const createTask = (y, { subject, description, dueDate }) =>
  `    <recordCreates>\n        <name>Crear_Tarea</name>\n        <label>Crear tarea para el propietario</label>\n        <locationX>0</locationX>\n        <locationY>${y}</locationY>\n` +
  [['ActivityDate', { ref: dueDate }], ['Description', { ref: description }], ['OwnerId', { ref: '$Record.OwnerId' }], ['Subject', subject], ['WhatId', { ref: '$Record.Id' }]]
    .map(([f, v]) => `        <inputAssignments>\n            <field>${f}</field>\n            <value>\n                ${val(v)}\n            </value>\n        </inputAssignments>\n`).join('') +
  `        <object>Task</object>\n        <storeOutputAutomatically>true</storeOutputAutomatically>\n    </recordCreates>\n`;
const updateRecord = (y, obj, items) =>
  `    <recordUpdates>\n        <name>Actualizar_Registro</name>\n        <label>Actualizar registro</label>\n        <locationX>0</locationX>\n        <locationY>${y}</locationY>\n        <filterLogic>and</filterLogic>\n        <filters>\n            <field>Id</field>\n            <operator>EqualTo</operator>\n            <value>\n                <elementReference>$Record.Id</elementReference>\n            </value>\n        </filters>\n` +
  items.map(([f, v]) => `        <inputAssignments>\n            <field>${f}</field>\n            <value>\n                ${val(v)}\n            </value>\n        </inputAssignments>\n`).join('') +
  `        <object>${obj}</object>\n    </recordUpdates>\n`;
const beforeSave = (obj, first, trigger = 'CreateAndUpdate', filterFormula) =>
  `    <start>\n        <locationX>0</locationX>\n        <locationY>0</locationY>\n        <connector>\n            <targetReference>${first}</targetReference>\n        </connector>\n${filterFormula ? `        <filterFormula>${X(filterFormula)}</filterFormula>\n` : ''}        <object>${obj}</object>\n        <recordTriggerType>${trigger}</recordTriggerType>\n        <triggerType>RecordBeforeSave</triggerType>\n    </start>\n`;
const scheduled = (obj, first, filters) =>
  `    <start>\n        <locationX>0</locationX>\n        <locationY>0</locationY>\n        <connector>\n            <targetReference>${first}</targetReference>\n        </connector>\n        <filterLogic>and</filterLogic>\n` +
  filters.map(([f, op, v]) => `        <filters>\n            <field>${f}</field>\n            <operator>${op}</operator>\n            <value>\n                ${val(v)}\n            </value>\n        </filters>\n`).join('') +
  `        <object>${obj}</object>\n        <schedule>\n            <frequency>Daily</frequency>\n            <startDate>2026-11-18</startDate>\n            <startTime>07:00:00.000Z</startTime>\n        </schedule>\n        <triggerType>Scheduled</triggerType>\n    </start>\n`;
function flow(mod, name, label, description, p) {
  write(mod, `flows/${name}.flow-meta.xml`,
    `<Flow ${NS}>\n    <apiVersion>${API}</apiVersion>\n${p.assignments || ''}${p.decisions || ''}    <description>${X(description)}</description>\n    <environments>Default</environments>\n${p.formulas || ''}    <interviewLabel>${X(label)} {!$Flow.CurrentDateTime}</interviewLabel>\n    <label>${X(label)}</label>\n${PMV}    <processType>AutoLaunchedFlow</processType>\n${p.recordCreates || ''}${p.recordLookups || ''}${p.recordUpdates || ''}${p.start}    <status>Active</status>\n</Flow>\n`);
}

function main() {
  for (const m of ['common', 'insurance', 'banking', 'wealth']) fs.rmSync(path.join(moduleSrc(m), 'flows'), { recursive: true, force: true });
  customMetadata();

  // ===== Base común
  flow('common', 'ETC_Cuenta_Normalizacion', 'ETC Cuenta · normalización',
    'Before-save: normaliza RFC (Account) y CURP (cuentas personales) a mayúsculas sin espacios ni guiones, para validaciones y reglas de duplicados.', {
    assignments: assignment('Normalizar', 'Normalizar RFC y CURP', [['$Record.ETC_RFC__c', { ref: 'fxRFC' }], ['$Record.ETC_CURP__pc', { ref: 'fxCURP' }]], 150),
    formulas: formula('fxCURP', 'String', 'UPPER(SUBSTITUTE(SUBSTITUTE(TRIM({!$Record.ETC_CURP__pc}), " ", ""), "-", ""))') + formula('fxRFC', 'String', 'UPPER(SUBSTITUTE(SUBSTITUTE(TRIM({!$Record.ETC_RFC__c}), " ", ""), "-", ""))'),
    start: beforeSave('Account', 'Normalizar', 'CreateAndUpdate', 'OR(NOT(ISBLANK({!$Record.ETC_RFC__c})), NOT(ISBLANK({!$Record.ETC_CURP__pc})))')
  });
  flow('common', 'ETC_Prospecto_Normalizacion', 'ETC Prospecto · normalización',
    'Before-save: normaliza el RFC del prospecto a mayúsculas sin espacios ni guiones.', {
    assignments: assignment('Normalizar', 'Normalizar RFC', [['$Record.ETC_RFC__c', { ref: 'fxRFC' }]], 150),
    formulas: formula('fxRFC', 'String', 'UPPER(SUBSTITUTE(SUBSTITUTE(TRIM({!$Record.ETC_RFC__c}), " ", ""), "-", ""))'),
    start: beforeSave('Lead', 'Normalizar', 'CreateAndUpdate', 'NOT(ISBLANK({!$Record.ETC_RFC__c}))')
  });
  flow('common', 'ETC_Caso_Fecha_Compromiso', 'ETC Caso · fecha compromiso',
    'Before-save al crear: si el caso no tiene fecha compromiso, la calcula con los días configurados (aclaración/queja o general) en ETC_Configuracion_FSC__mdt.', {
    recordLookups: getConfig('Hay_Config', 150),
    decisions: decision('Hay_Config', '¿Hay configuración?', 'Asignar_Fecha', [['Get_Config', 'IsNull', false]], 300),
    assignments: assignment('Asignar_Fecha', 'Asignar fecha compromiso', [['$Record.ETC_Fecha_Compromiso__c', { ref: 'fxFecha' }]], 450),
    formulas: formula('fxFecha', 'Date', '{!$Flow.CurrentDate} + IF(OR(ISPICKVAL({!$Record.Type}, "Aclaración"), ISPICKVAL({!$Record.Type}, "Queja")), BLANKVALUE({!Get_Config.Dias_Compromiso_Aclaracion__c}, 30), BLANKVALUE({!Get_Config.Dias_Compromiso_General__c}, 5))'),
    start: beforeSave('Case', 'Get_Config', 'Create', 'ISBLANK({!$Record.ETC_Fecha_Compromiso__c})')
  });
  flow('common', 'ETC_Cuenta_KYC_Vencimiento', 'ETC Cuenta · vencimiento KYC',
    'Programado (diario): marca como Vencido el KYC aprobado cuya última revisión supera los días de vigencia configurados. No modifica otros campos.', {
    recordLookups: getConfig('Esta_Vencido', 150),
    decisions: decision('Esta_Vencido', '¿KYC vencido?', 'Actualizar_Registro', [['Get_Config', 'IsNull', false], ['fxVencido', 'EqualTo', true]], 300),
    formulas: formula('fxVencido', 'Boolean', 'AND(NOT(ISBLANK({!$Record.ETC_Fecha_Revision_KYC__c})), {!$Record.ETC_Fecha_Revision_KYC__c} + {!Get_Config.Dias_Vigencia_KYC__c} <= TODAY())'),
    recordUpdates: updateRecord(450, 'Account', [['ETC_Estatus_KYC__c', 'Vencido']]),
    start: scheduled('Account', 'Get_Config', [['ETC_Estatus_KYC__c', 'EqualTo', 'Aprobado']])
  });

  // ===== Seguros
  flow('insurance', 'ETC_Poliza_Aviso_Renovacion', 'ETC Póliza · aviso de renovación',
    'Programado (diario): crea una tarea para el propietario cuando faltan los días configurados para el fin de vigencia de una póliza no cancelada (INS-007).', {
    recordLookups: getConfig('Toca_Aviso', 150),
    decisions: decision('Toca_Aviso', '¿Toca aviso hoy?', 'Crear_Tarea', [['Get_Config', 'IsNull', false], ['fxToca', 'EqualTo', true]], 300),
    formulas:
      formula('fxDescripcion', 'String', '"La póliza " & {!$Record.Name} & " vence el " & TEXT(DATEVALUE({!$Record.ExpirationDate})) & ". Contacta al cliente para su renovación."') +
      formula('fxToca', 'Boolean', 'AND(NOT(ISBLANK({!$Record.ExpirationDate})), NOT(ISPICKVAL({!$Record.Status}, "Canceled")), DATEVALUE({!$Record.ExpirationDate}) - TODAY() = {!Get_Config.Dias_Aviso_Renovacion__c})') +
      formula('fxVence', 'Date', 'DATEVALUE({!$Record.ExpirationDate})'),
    recordCreates: createTask(450, { subject: 'Renovación de póliza', description: 'fxDescripcion', dueDate: 'fxVence' }),
    start: scheduled('InsurancePolicy', 'Get_Config', [['ExpirationDate', 'IsNull', false]])
  });

  // ===== Banca
  flow('banking', 'ETC_Cuenta_Financiera_Cierre', 'ETC Cuenta financiera · fecha de cierre',
    'Before-save: si la cuenta pasa a Closed sin fecha de cierre, registra la fecha de hoy.', {
    assignments: assignment('Asignar_Cierre', 'Asignar fecha de cierre', [['$Record.ClosingDate', { ref: '$Flow.CurrentDate' }]], 150),
    start: beforeSave('FinancialAccount', 'Asignar_Cierre', 'CreateAndUpdate', 'AND(ISPICKVAL({!$Record.Status}, "Closed"), ISBLANK({!$Record.ClosingDate}))')
  });

  // ===== Patrimonial
  flow('wealth', 'ETC_Proxima_Revision_Calculo', 'ETC Cuenta · próxima revisión de cartera',
    'Before-save: calcula la próxima revisión de cartera según la frecuencia (trimestral 90, semestral 180, anual 365 días) cuando se define o cambia la frecuencia (WLT-012).', {
    assignments: assignment('Asignar_Revision', 'Asignar próxima revisión', [['$Record.ETC_Proxima_Revision__c', { ref: 'fxProxima' }]], 150),
    formulas: formula('fxProxima', 'Date', '{!$Flow.CurrentDate} + CASE(TEXT({!$Record.ETC_Frecuencia_Revision__c}), "Trimestral", 90, "Semestral", 180, 365)'),
    start: beforeSave('Account', 'Asignar_Revision', 'CreateAndUpdate', 'AND(NOT(ISBLANK(TEXT({!$Record.ETC_Frecuencia_Revision__c}))), OR(ISBLANK({!$Record.ETC_Proxima_Revision__c}), ISCHANGED({!$Record.ETC_Frecuencia_Revision__c})))')
  });
  flow('wealth', 'ETC_Revision_Cartera_Aviso', 'ETC Cuenta · aviso de revisión de cartera',
    'Programado (diario): crea una tarea para el asesor cuando faltan los días configurados para la próxima revisión de cartera (WLT-012). No genera recomendaciones de inversión.', {
    recordLookups: getConfig('Toca_Aviso', 150),
    decisions: decision('Toca_Aviso', '¿Toca aviso hoy?', 'Crear_Tarea', [['Get_Config', 'IsNull', false], ['fxToca', 'EqualTo', true]], 300),
    formulas:
      formula('fxDescripcion', 'String', '"Revisión de cartera programada para el " & TEXT({!$Record.ETC_Proxima_Revision__c}) & ". Agenda la reunión con el cliente."') +
      formula('fxToca', 'Boolean', '{!$Record.ETC_Proxima_Revision__c} - TODAY() = {!Get_Config.Dias_Aviso_Revision__c}'),
    recordCreates: createTask(450, { subject: 'Revisión de cartera', description: 'fxDescripcion', dueDate: '$Record.ETC_Proxima_Revision__c' }),
    start: scheduled('Account', 'Get_Config', [['ETC_Proxima_Revision__c', 'IsNull', false]])
  });

  console.log(c.bold('Flows') + `  ${Object.entries(counts).map(([m, n]) => `${m} ${n}`).join(' · ')} (incluye Custom Metadata de configuración)`);
}

main();
