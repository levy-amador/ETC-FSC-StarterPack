'use strict';
// Etapas de despliegue ordenadas por dependencias de Metadata API.
// Cada etapa toma archivos fuente (rutas relativas a modules/<módulo>/main/default) por expresión regular.
// Una etapa agrupa componentes de TODOS los módulos activos (base común + vertical elegida), porque las
// dependencias cruzan módulos: p. ej. un flow de Seguros usa un campo de la base común.
// `dynamic` indica piezas que build.js genera a partir del estado actual de la org.
const STAGES = [
  { id: '00-settings', label: 'Settings de la org (funcionalidades FSC habilitables por metadata)', match: [/^settings\//] },
  { id: '01-data-model', label: 'Modelo de datos (objetos ETC, campos, Custom Metadata)', match: [/^objects\/[^/]+\/[^/]+\.object-meta\.xml$/, /^objects\/[^/]+\/fields\//, /^customMetadata\//] },
  { id: '02-picklists-processes', label: 'Picklists estándar, record types y procesos', match: [/^standardValueSets\//, /^globalValueSets\//, /^objects\/[^/]+\/businessProcesses\//, /^objects\/[^/]+\/recordTypes\//], dynamic: 'standardValueSets' },
  { id: '03-validation-rules', label: 'Reglas de validación', match: [/^objects\/[^/]+\/validationRules\//] },
  { id: '04-matching-rules', label: 'Matching Rules', match: [/^matchingRules\//], waitFor: 'matchingRules' },
  { id: '05-duplicate-rules', label: 'Duplicate Rules', match: [/^duplicateRules\//] },
  { id: '06-sharing-model', label: 'Modelo de colaboración (OWD)', match: [], dynamic: 'sharingModel', waitFor: 'sharingModel' },
  { id: '07-roles', label: 'Jerarquía de roles', match: [/^roles\//] },
  { id: '08-queues-routing', label: 'Colas, reglas de asignación y escalamiento', match: [/^queues\//, /^assignmentRules\//, /^escalationRules\//] },
  { id: '09-layouts-actions', label: 'Page Layouts, Compact Layouts y acciones', match: [/^layouts\//, /^objects\/[^/]+\/compactLayouts\//, /^quickActions\//] },
  { id: '10-lightning-pages', label: 'Lightning Pages, Path, List Views y pestañas', match: [/^flexipages\//, /^pathAssistants\//, /^objects\/[^/]+\/listViews\//, /^tabs\//] },
  { id: '11-flows', label: 'Flows', match: [/^flows\//] },
  { id: '12-action-plans', label: 'Plantillas de Action Plans', match: [/^actionPlanTemplates\//] },
  { id: '13-app-branding', label: 'Aplicación Lightning y branding', match: [/^staticresources\//, /^contentassets\//, /^applications\//] },
  { id: '14-permissions', label: 'Permission Sets, grupos y asignación de layouts', match: [/^permissionsets\//, /^permissionsetgroups\//, /^profiles\//], waitFor: 'permissionSetGroups' },
  { id: '15-reports-dashboards', label: 'Reportes y dashboards', match: [/^reportTypes\//, /^reports\//, /^dashboards\//] }
];

// Ruta fuente -> [tipo de metadata, miembro]. null si el archivo no es un componente (ej. contenido de recursos).
function componentOf(rel) {
  let m;
  const t = (type, member) => [type, member];
  if ((m = rel.match(/^settings\/(.+)\.settings-meta\.xml$/))) return t('Settings', m[1]);
  if ((m = rel.match(/^objects\/([^/]+)\/fields\/(.+)\.field-meta\.xml$/))) return t('CustomField', `${m[1]}.${m[2]}`);
  if ((m = rel.match(/^objects\/([^/]+)\/\1\.object-meta\.xml$/))) return t('CustomObject', m[1]);
  if ((m = rel.match(/^objects\/([^/]+)\/validationRules\/(.+)\.validationRule-meta\.xml$/))) return t('ValidationRule', `${m[1]}.${m[2]}`);
  if ((m = rel.match(/^objects\/([^/]+)\/businessProcesses\/(.+)\.businessProcess-meta\.xml$/))) return t('BusinessProcess', `${m[1]}.${m[2]}`);
  if ((m = rel.match(/^objects\/([^/]+)\/recordTypes\/(.+)\.recordType-meta\.xml$/))) return t('RecordType', `${m[1]}.${m[2]}`);
  if ((m = rel.match(/^objects\/([^/]+)\/listViews\/(.+)\.listView-meta\.xml$/))) return t('ListView', `${m[1]}.${m[2]}`);
  if ((m = rel.match(/^objects\/([^/]+)\/compactLayouts\/(.+)\.compactLayout-meta\.xml$/))) return t('CompactLayout', `${m[1]}.${m[2]}`);
  if ((m = rel.match(/^customMetadata\/(.+)\.md-meta\.xml$/))) return t('CustomMetadata', m[1]);
  if ((m = rel.match(/^standardValueSets\/(.+)\.standardValueSet-meta\.xml$/))) return t('StandardValueSet', m[1]);
  if ((m = rel.match(/^globalValueSets\/(.+)\.globalValueSet-meta\.xml$/))) return t('GlobalValueSet', m[1]);
  if ((m = rel.match(/^matchingRules\/(.+)\.matchingRule-meta\.xml$/))) return t('MatchingRules', m[1]);
  if ((m = rel.match(/^duplicateRules\/(.+)\.duplicateRule-meta\.xml$/))) return t('DuplicateRule', m[1]);
  if ((m = rel.match(/^roles\/(.+)\.role-meta\.xml$/))) return t('Role', m[1]);
  if ((m = rel.match(/^queues\/(.+)\.queue-meta\.xml$/))) return t('Queue', m[1]);
  if ((m = rel.match(/^assignmentRules\/(.+)\.assignmentRules-meta\.xml$/))) return t('AssignmentRules', m[1]);
  if ((m = rel.match(/^escalationRules\/(.+)\.escalationRules-meta\.xml$/))) return t('EscalationRules', m[1]);
  if ((m = rel.match(/^layouts\/(.+)\.layout-meta\.xml$/))) return t('Layout', m[1]);
  if ((m = rel.match(/^quickActions\/(.+)\.quickAction-meta\.xml$/))) return t('QuickAction', m[1]);
  if ((m = rel.match(/^flexipages\/(.+)\.flexipage-meta\.xml$/))) return t('FlexiPage', m[1]);
  if ((m = rel.match(/^pathAssistants\/(.+)\.pathAssistant-meta\.xml$/))) return t('PathAssistant', m[1]);
  if ((m = rel.match(/^tabs\/(.+)\.tab-meta\.xml$/))) return t('CustomTab', m[1]);
  if ((m = rel.match(/^flows\/(.+)\.flow-meta\.xml$/))) return t('Flow', m[1]);
  if ((m = rel.match(/^actionPlanTemplates\/(.+)\.apt-meta\.xml$/))) return t('ActionPlanTemplate', m[1]);
  if ((m = rel.match(/^reportTypes\/(.+)\.reportType-meta\.xml$/))) return t('ReportType', m[1]);
  if ((m = rel.match(/^reports\/(.+)\.reportFolder-meta\.xml$/))) return t('Report', m[1]);
  if ((m = rel.match(/^reports\/(.+)\.report-meta\.xml$/))) return t('Report', m[1]);
  if ((m = rel.match(/^dashboards\/(.+)\.dashboardFolder-meta\.xml$/))) return t('Dashboard', m[1]);
  if ((m = rel.match(/^dashboards\/(.+)\.dashboard-meta\.xml$/))) return t('Dashboard', m[1]);
  if ((m = rel.match(/^staticresources\/(.+)\.resource-meta\.xml$/))) return t('StaticResource', m[1]);
  if ((m = rel.match(/^contentassets\/(.+)\.asset-meta\.xml$/))) return t('ContentAsset', m[1]);
  if ((m = rel.match(/^applications\/(.+)\.app-meta\.xml$/))) return t('CustomApplication', m[1]);
  if ((m = rel.match(/^permissionsets\/(.+)\.permissionset-meta\.xml$/))) return t('PermissionSet', m[1]);
  if ((m = rel.match(/^permissionsetgroups\/(.+)\.permissionsetgroup-meta\.xml$/))) return t('PermissionSetGroup', m[1]);
  if ((m = rel.match(/^profiles\/(.+)\.profile-meta\.xml$/))) return t('Profile', m[1]);
  return null;
}

module.exports = { STAGES, componentOf };
