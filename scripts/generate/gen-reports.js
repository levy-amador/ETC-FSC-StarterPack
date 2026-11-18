#!/usr/bin/env node
'use strict';
// node scripts/generate/gen-reports.js   (lo ejecuta npm run generate)
// Genera carpetas, Custom Report Types, reportes y dashboards desde config/spec/<módulo>-ui.json.
// Las carpetas viven en la base común; los reportes y dashboards de cada vertical, en su módulo.
const fs = require('fs');
const path = require('path');
const { ROOT, c, fail, readJson, moduleSrc } = require('../lib/common');
const { modules } = require('../lib/vertical');

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';
const HDR = '<?xml version="1.0" encoding="UTF-8"?>\n';
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const common = readJson(path.join(ROOT, 'config', 'spec', 'common-ui.json'));
const RF = common.reportFolder.name;
const DF = common.dashboardFolder.name;
const counts = {};
const write = (mod, rel, body) => {
  const f = path.join(moduleSrc(mod), rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, HDR + body);
  counts[mod] = (counts[mod] || 0) + 1;
};

function chart([type, grouping, summary]) {
  return `    <chart>\n        <backgroundColor1>#FFFFFF</backgroundColor1>\n        <backgroundColor2>#FFFFFF</backgroundColor2>\n        <backgroundFadeDir>Diagonal</backgroundFadeDir>\n        <chartSummaries>\n${summary.agg ? `            <aggregate>${summary.agg}</aggregate>\n` : ''}            <axisBinding>y</axisBinding>\n            <column>${summary.col}</column>\n        </chartSummaries>\n        <chartType>${type}</chartType>\n        <enableHoverLabels>true</enableHoverLabels>\n        <expandOthers>true</expandOthers>\n        <groupingColumn>${grouping}</groupingColumn>\n${type === 'Donut' ? '        <legendPosition>Right</legendPosition>\n' : ''}        <location>CHART_BOTTOM</location>\n        <showAxisLabels>true</showAxisLabels>\n        <showPercentage>${type === 'Donut'}</showPercentage>\n        <showTotal>${type === 'Donut'}</showTotal>\n        <showValues>true</showValues>\n        <size>Medium</size>\n        <summaryAxisRange>Auto</summaryAxisRange>\n        <textColor>#000000</textColor>\n        <textSize>12</textSize>\n        <titleColor>#000000</titleColor>\n        <titleSize>18</titleSize>\n    </chart>\n`;
}

function reportXml(o) {
  const grouped = (o.groups || []).map((g) => (Array.isArray(g) ? g[0] : g));
  const cols = o.columns
    .filter((col) => !grouped.includes(Array.isArray(col) ? col[0] : col))
    .map((col) => (typeof col === 'string' ? `    <columns>\n        <field>${col}</field>\n    </columns>\n` : `    <columns>\n        <aggregateTypes>${col[1]}</aggregateTypes>\n        <field>${col[0]}</field>\n    </columns>\n`))
    .join('');
  const filter = o.filters
    ? `    <filter>\n${o.filters.map(([col, op, v]) => `        <criteriaItems>\n            <column>${col}</column>\n            <columnToColumn>false</columnToColumn>\n            <isUnlocked>true</isUnlocked>\n            <operator>${op}</operator>\n            <value>${X(v)}</value>\n        </criteriaItems>\n`).join('')}    </filter>\n`
    : '';
  const grp = (o.groups || []).map((g) => {
    const [f, gran = 'Day'] = Array.isArray(g) ? g : [g];
    return `    <groupingsDown>\n        <dateGranularity>${gran}</dateGranularity>\n        <field>${f}</field>\n        <sortOrder>Asc</sortOrder>\n    </groupingsDown>\n`;
  }).join('');
  const params = (o.params || []).map(([n, v]) => `    <params>\n        <name>${n}</name>\n        <value>${X(v)}</value>\n    </params>\n`).join('');
  const [dateCol, interval = 'INTERVAL_CUSTOM'] = o.time;
  return `<Report ${NS}>\n${o.chart ? chart(o.chart) : ''}${cols}    <description>${X(o.description)}</description>\n${filter}    <format>${o.groups ? 'Summary' : 'Tabular'}</format>\n${grp}    <name>${X(o.label)}</name>\n${params}    <reportType>${o.type}</reportType>\n    <scope>${o.scope}</scope>\n    <showDetails>true</showDetails>\n    <showGrandTotal>true</showGrandTotal>\n    <showSubTotals>true</showSubTotals>\n    <timeFrameFilter>\n        <dateColumn>${dateCol}</dateColumn>\n        <interval>${interval}</interval>\n    </timeFrameFilter>\n</Report>\n`;
}

function reportTypeXml(t) {
  const cols = t.fields.map((f, i) => `        <columns>\n            <checkedByDefault>${i < 6}</checkedByDefault>\n            <field>${f}</field>\n            <table>${t.baseObject}</table>\n        </columns>\n`).join('');
  return `<ReportType ${NS}>\n    <baseObject>${t.baseObject}</baseObject>\n    <category>other</category>\n    <deployed>true</deployed>\n    <description>${X(`ETC | ${t.label}: una fila por registro.`)}</description>\n    <label>${X(t.label)}</label>\n    <sections>\n${cols}        <masterLabel>${X(t.label)}</masterLabel>\n    </sections>\n</ReportType>\n`;
}

function dashComp(cmp, col, row, w, h) {
  const rep = `${RF}/${cmp.report}`;
  const inner = cmp.kind === 'Metric'
    ? `                <autoselectColumnsFromReport>false</autoselectColumnsFromReport>\n                <chartSummary>\n${cmp.agg ? `                    <aggregate>${cmp.agg}</aggregate>\n` : ''}                    <axisBinding>y</axisBinding>\n                    <column>${cmp.col}</column>\n                </chartSummary>\n                <componentType>Metric</componentType>\n                <groupingSortProperties/>\n                <indicatorHighColor>#54C254</indicatorHighColor>\n                <indicatorLowColor>#C25454</indicatorLowColor>\n                <indicatorMiddleColor>#C2C254</indicatorMiddleColor>\n                <report>${rep}</report>\n                <showRange>false</showRange>\n                <title>${X(cmp.title)}</title>\n`
    : `                <autoselectColumnsFromReport>true</autoselectColumnsFromReport>\n                <chartAxisRange>Auto</chartAxisRange>\n                <componentType>${cmp.type}</componentType>\n                <drillEnabled>false</drillEnabled>\n                <drillToDetailEnabled>false</drillToDetailEnabled>\n                <enableHover>true</enableHover>\n                <expandOthers>true</expandOthers>\n                <groupingSortProperties/>\n                <report>${rep}</report>\n                <showPercentage>false</showPercentage>\n                <showValues>true</showValues>\n                <sortBy>RowLabelAscending</sortBy>\n                <sortLegendValues>false</sortLegendValues>\n                <title>${X(cmp.title)}</title>\n                <useReportChart>true</useReportChart>\n`;
  return `        <dashboardGridComponents>\n            <colSpan>${w}</colSpan>\n            <columnIndex>${col}</columnIndex>\n            <dashboardComponent>\n${inner}            </dashboardComponent>\n            <rowIndex>${row}</rowIndex>\n            <rowSpan>${h}</rowSpan>\n        </dashboardGridComponents>\n`;
}
function dashboardXml(d) {
  const w = 12 / d.metrics.length;
  const parts = [
    ...d.metrics.map((m, i) => dashComp({ ...m, kind: 'Metric' }, i * w, 0, w, 4)),
    ...d.charts.map((ch, i) => dashComp(ch, (i % 3) * 4, 4 + Math.floor(i / 3) * 8, 4, 8))
  ];
  return `<Dashboard ${NS}>\n    <backgroundEndColor>#FFFFFF</backgroundEndColor>\n    <backgroundFadeDirection>Diagonal</backgroundFadeDirection>\n    <backgroundStartColor>#FFFFFF</backgroundStartColor>\n    <chartTheme>light</chartTheme>\n    <colorPalette>unity</colorPalette>\n    <dashboardChartTheme>light</dashboardChartTheme>\n    <dashboardColorPalette>unity</dashboardColorPalette>\n    <dashboardGridLayout>\n${parts.join('')}        <numberOfColumns>12</numberOfColumns>\n        <rowHeight>36</rowHeight>\n    </dashboardGridLayout>\n    <dashboardType>LoggedInUser</dashboardType>\n    <description>${X(d.description)}</description>\n    <isGridLayout>true</isGridLayout>\n    <textColor>#000000</textColor>\n    <title>${X(d.title)}</title>\n    <titleColor>#000000</titleColor>\n    <titleSize>12</titleSize>\n</Dashboard>\n`;
}

function main() {
  const folder = (type, f) => `<${type} ${NS}>\n    <folderShares>\n        <accessLevel>View</accessLevel>\n        <sharedTo>${f.shareRole}</sharedTo>\n        <sharedToType>RoleAndSubordinatesInternal</sharedToType>\n    </folderShares>\n    <name>${X(f.label)}</name>\n</${type}>\n`;
  for (const m of modules()) {
    const s = readJson(path.join(ROOT, 'config', 'spec', `${m.id}-ui.json`), null);
    if (!s) continue;
    const src = moduleSrc(m.id);
    for (const d of ['reports', 'dashboards', 'reportTypes']) fs.rmSync(path.join(src, d), { recursive: true, force: true });
    if (m.id === 'common') {
      write('common', `reports/${RF}.reportFolder-meta.xml`, folder('ReportFolder', common.reportFolder));
      write('common', `dashboards/${DF}.dashboardFolder-meta.xml`, folder('DashboardFolder', common.dashboardFolder));
    }
    const names = new Set((s.reports || []).map((r) => r.name));
    for (const t of s.reportTypes || []) write(m.id, `reportTypes/${t.name}.reportType-meta.xml`, reportTypeXml(t));
    for (const r of s.reports || []) write(m.id, `reports/${RF}/${r.name}.report-meta.xml`, reportXml(r));
    for (const d of s.dashboards || []) {
      for (const cmp of [...d.metrics, ...d.charts]) if (!names.has(cmp.report)) fail(`Dashboard ${d.name}: el reporte ${cmp.report} no está en el módulo ${m.id}`);
      write(m.id, `dashboards/${DF}/${d.name}.dashboard-meta.xml`, dashboardXml(d));
    }
  }
  console.log(c.bold('Reportes') + `  ${Object.entries(counts).map(([m, n]) => `${m} ${n}`).join(' · ')}`);
}

main();
