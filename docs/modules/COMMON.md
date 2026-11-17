<!-- Generado por npm run docs desde config/catalog/fsc-catalog.json. No editar a mano. -->
# Base común FSC (siempre se despliega)

Clientes, relaciones y hogares, seguridad, app, casos, calidad de datos y reportes.

## Objetos FSC Core

- Requeridos (sin ellos la org no está lista): `Account`, `Contact`, `Case`, `AccountContactRelation`, `ContactContactRelation`, `AccountAccountRelation`, `PartyRelationshipGroup`
- Opcionales: `PersonLifeEvent`, `BusinessMilestone`, `PartyProfile`, `IdentityDocument`, `ActionPlanTemplate`, `ActionPlan`, `ActionPlanItem`

## Prerrequisitos de Setup

- Person Accounts habilitadas (IRREVERSIBLE: requiere decisión del cliente; se habilita desde Setup o con Soporte de Salesforce)
- Activar 'Permitir a los usuarios relacionar un contacto con cuentas múltiples' (Contacts to Multiple Accounts) DESDE SETUP, no por metadata: la bandera AccountSettings.enableRelateContactToMultipleAccounts se guarda pero no habilita AccountContactRelation
- Activar 'Group Membership' en Setup y asignar el permiso Group Membership (habilita AccountAccountRelation, ContactContactRelation y PartyRelationshipGroup)

## Ítems del catálogo

| ID | Área | Configuración | Ejecuta | Estado | Validación humana |
|---|---|---|---|---|---|
| COM-001 | Plataforma | Diagnóstico de edición, licencias y funcionalidades FSC | Humano | Pendiente | Humano confirma licencias, alcance y arquitectura. |
| COM-002 | Plataforma | Habilitación de funcionalidades FSC | Humano con apoyo de IA | En construcción | Aprobación del arquitecto/admin antes de activar. |
| COM-003 | Plataforma | Instalación o actualización de paquetes administrados | Humano con apoyo de IA | Pendiente | Humano ejecuta o aprueba instalación y smoke tests. |
| COM-004 | Seguridad | Activación y asignación de Permission Sets / Permission Set Groups | Claude Code (con aprobación) | Pendiente | Humano aprueba matriz y prueba acceso por persona. |
| COM-005 | Seguridad | Configuración de perfiles | Claude Code (con aprobación) | En construcción | Humano valida mínimo privilegio y regresión. |
| COM-006 | Seguridad | Configuración de roles y jerarquías | Humano con apoyo de IA | Pendiente | Humano define y aprueba el modelo. |
| COM-007 | Seguridad | Configuración de sharing rules y OWD | Humano con apoyo de IA | Pendiente | Revisión de seguridad obligatoria. |
| COM-008 | Aplicación | Creación/configuración de aplicación Lightning | Claude Code (con aprobación) | Pendiente | Humano valida experiencia por perfil. |
| COM-009 | Aplicación | Personalización de página de inicio | Claude Code (con aprobación) | Pendiente | Humano valida presentación y usabilidad. |
| COM-010 | Modelo de datos | Creación de campos personalizados | Claude Code (con aprobación) | Pendiente | Humano aprueba definición y prueba datos. |
| COM-011 | Modelo de datos | Creación de objetos personalizados | Claude Code (con aprobación) | Pendiente | Humano aprueba modelo y estrategia de gobierno. |
| COM-012 | Modelo de datos | Configuración de relaciones entre objetos | Claude Code (con aprobación) | Pendiente | Humano valida cardinalidad, integridad y migración. |
| COM-013 | Modelo de datos | Configuración de record types y picklists | Claude Code (con aprobación) | En construcción | Humano valida catálogos y escenarios. |
| COM-014 | Interfaz | Configuración de Lightning Record Pages | Claude Code (con aprobación) | Pendiente | Humano valida renderizado y experiencia. |
| COM-015 | Interfaz | Configuración de page layouts y acciones | Claude Code (con aprobación) | Pendiente | Humano valida por perfil. |
| COM-016 | Interfaz | Configuración de related lists y componentes relacionados | Claude Code (con aprobación) | Pendiente | Humano valida contenido y rendimiento. |
| COM-017 | Interfaz | Configuración de listas y vistas de lista | Claude Code (con aprobación) | Pendiente | Humano valida resultados. |
| COM-018 | Procesos | Configuración de Flow Builder | Claude Code (con aprobación) | Pendiente | Humano aprueba lógica y pruebas UAT. |
| COM-019 | Procesos | Configuración de reglas de validación | Claude Code (con aprobación) | Pendiente | Humano aprueba reglas y excepciones. |
| COM-020 | Procesos | Configuración de aprobación | Humano con apoyo de IA | Pendiente | Humano define delegaciones, SLA y segregación. |
| COM-021 | Procesos | Configuración de tareas, eventos y actividades | Claude Code (con aprobación) | Pendiente | Humano valida experiencia y reporting. |
| COM-022 | Procesos | Configuración de Action Plans / plantillas de planes de acción | Humano con apoyo de IA | Pendiente | Humano valida ejecución end-to-end. |
| COM-023 | Servicio | Configuración de Case Management | Claude Code (con aprobación) | Pendiente | Humano aprueba proceso de atención. |
| COM-024 | Servicio | Configuración de colas y asignación de casos | Claude Code (con aprobación) | Pendiente | Humano valida ownership y SLA. |
| COM-025 | Servicio | Configuración de escalamiento y entitlements | Humano con apoyo de IA | Pendiente | Humano define SLA y valida calendario. |
| COM-026 | Reportes | Creación de report types, reportes y dashboards | Claude Code (con aprobación) | Pendiente | Humano valida fórmulas, filtros y métricas. |
| COM-027 | Calidad de datos | Configuración de duplicate/matching rules | Claude Code (con aprobación) | Pendiente | Humano valida falsos positivos/negativos. |
| COM-028 | Calidad de datos | Configuración de validaciones de datos | Claude Code (con aprobación) | Pendiente | Humano aprueba reglas. |
| COM-029 | Documentos | Configuración de gestión documental | Humano con apoyo de IA | Pendiente | Humano valida seguridad y cumplimiento. |
| COM-030 | Despliegue | Preparación y despliegue de cambios entre ambientes | Claude Code (con aprobación) | Pendiente | Humano aprueba release y smoke tests. |

## Detalle

### COM-001 · Diagnóstico de edición, licencias y funcionalidades FSC

- **Alcance:** Inventariar edición Salesforce, licencias, permisos y funcionalidades FSC disponibles.
- **Tipo de trabajo:** Validación / preparación
- **Prerrequisitos:** Acceso de solo lectura a Setup y documentación contractual.
- **Qué puede hacer Claude Code:** Claude Code puede consultar metadatos y generar un inventario si dispone de Salesforce CLI/API; la validación contractual y de licencias requiere responsable humano.
- **Validación humana:** Humano confirma licencias, alcance y arquitectura.
- **Componentes:** Pendiente

### COM-002 · Habilitación de funcionalidades FSC

- **Alcance:** Activar funcionalidades disponibles de FSC y verificar dependencias.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Licencias y permisos administrativos; algunas funciones requieren soporte o aprovisionamiento Salesforce.
- **Qué puede hacer Claude Code:** El agente puede guiar y, en ciertos casos, configurar opciones vía Setup/API. No debe asumir que puede habilitar cualquier feature.
- **Validación humana:** Aprobación del arquitecto/admin antes de activar.
- **Componentes:** `Settings:Industries`

### COM-003 · Instalación o actualización de paquetes administrados

- **Alcance:** Instalar/actualizar paquetes requeridos y verificar versiones y dependencias.
- **Tipo de trabajo:** Configuración técnica
- **Prerrequisitos:** URL/paquete oficial, permisos de instalación, ventana de cambio y validación de compatibilidad.
- **Qué puede hacer Claude Code:** Puede preparar comandos y revisar dependencias; instalación en org productiva requiere autorización y puede exigir interacción de administrador.
- **Validación humana:** Humano ejecuta o aprueba instalación y smoke tests.
- **Componentes:** Pendiente

### COM-004 · Activación y asignación de Permission Sets / Permission Set Groups

- **Alcance:** Asignar permisos por rol funcional y licencia.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Salesforce CLI/API con permisos adecuados; matriz de acceso aprobada.
- **Qué puede hacer Claude Code:** Puede crear/actualizar metadata y asignaciones cuando la API lo permita; no debe decidir privilegios de negocio.
- **Validación humana:** Humano aprueba matriz y prueba acceso por persona.
- **Componentes:** Pendiente

### COM-005 · Configuración de perfiles

- **Alcance:** Ajustar perfiles existentes y permisos necesarios, minimizando cambios en perfiles estándar.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Acceso Metadata API; definición de permisos aprobada.
- **Qué puede hacer Claude Code:** Puede modificar metadata de perfiles; cambios amplios o sobre perfiles existentes requieren revisión por riesgo.
- **Validación humana:** Humano valida mínimo privilegio y regresión.
- **Componentes:** `Profile:Admin`

### COM-006 · Configuración de roles y jerarquías

- **Alcance:** Definir jerarquía organizacional y visibilidad basada en roles.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Organigrama, modelo operativo y reglas de visibilidad aprobados.
- **Qué puede hacer Claude Code:** El agente puede preparar metadata y configuración soportada; el diseño de acceso es decisión de negocio.
- **Validación humana:** Humano define y aprueba el modelo.
- **Componentes:** Pendiente

### COM-007 · Configuración de sharing rules y OWD

- **Alcance:** Configurar valores predeterminados de acceso, reglas de compartición y excepciones.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Matriz de acceso, modelo de datos y criterios regulatorios.
- **Qué puede hacer Claude Code:** Puede preparar reglas y metadata; impacto de exposición de datos exige aprobación y pruebas humanas.
- **Validación humana:** Revisión de seguridad obligatoria.
- **Componentes:** Pendiente

### COM-008 · Creación/configuración de aplicación Lightning

- **Alcance:** Crear app, navegación, pestañas y utilidades.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Metadata API y diseño aprobado.
- **Qué puede hacer Claude Code:** Normalmente automatizable mediante metadata; requiere prueba de navegación y permisos.
- **Validación humana:** Humano valida experiencia por perfil.
- **Componentes:** Pendiente

### COM-009 · Personalización de página de inicio

- **Alcance:** Configurar Lightning Home Page, componentes y asignaciones por app/perfil.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Diseño, componentes disponibles y criterios por perfil.
- **Qué puede hacer Claude Code:** Puede generar y desplegar FlexiPage metadata; algunos componentes/configuraciones requieren ajuste visual en Setup.
- **Validación humana:** Humano valida presentación y usabilidad.
- **Componentes:** Pendiente

### COM-010 · Creación de campos personalizados

- **Alcance:** Crear campos, tipos, etiquetas, help text, valores y seguridad de campo.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Diccionario de datos aprobado; límites de campos y convenciones.
- **Qué puede hacer Claude Code:** Altamente automatizable con metadata/API; decisiones de tipo, obligatoriedad y retención deben venir del negocio.
- **Validación humana:** Humano aprueba definición y prueba datos.
- **Componentes:** Pendiente

### COM-011 · Creación de objetos personalizados

- **Alcance:** Crear objetos, nombres, etiquetas, configuración y relaciones.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Modelo de datos y convenciones aprobadas.
- **Qué puede hacer Claude Code:** Automatizable vía metadata; no sustituye el diseño funcional del modelo.
- **Validación humana:** Humano aprueba modelo y estrategia de gobierno.
- **Componentes:** Pendiente

### COM-012 · Configuración de relaciones entre objetos

- **Alcance:** Crear lookup/master-detail y relaciones requeridas.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Modelo entidad-relación aprobado y datos existentes revisados.
- **Qué puede hacer Claude Code:** Puede crear metadata de relaciones; cambios en objetos con datos requieren análisis de impacto.
- **Validación humana:** Humano valida cardinalidad, integridad y migración.
- **Componentes:** Pendiente

### COM-013 · Configuración de record types y picklists

- **Alcance:** Crear tipos de registro, valores y dependencias de listas.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Procesos y valores de negocio definidos.
- **Qué puede hacer Claude Code:** Automatizable vía metadata; requiere consistencia entre procesos, layouts y automatizaciones.
- **Validación humana:** Humano valida catálogos y escenarios.
- **Componentes:** `RecordType:Account.ETC_Empresa`

### COM-014 · Configuración de Lightning Record Pages

- **Alcance:** Diseñar páginas de registro y asignaciones por app, perfil o tipo de registro.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Diseño funcional y componentes disponibles.
- **Qué puede hacer Claude Code:** Puede crear/actualizar FlexiPage metadata; visibilidad dinámica compleja necesita pruebas visuales.
- **Validación humana:** Humano valida renderizado y experiencia.
- **Componentes:** Pendiente

### COM-015 · Configuración de page layouts y acciones

- **Alcance:** Configurar secciones, campos, botones y acciones en layouts.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Diseño por objeto y perfiles.
- **Qué puede hacer Claude Code:** Automatizable con metadata; probar acciones y compatibilidad con record types.
- **Validación humana:** Humano valida por perfil.
- **Componentes:** Pendiente

### COM-016 · Configuración de related lists y componentes relacionados

- **Alcance:** Mostrar listas relacionadas, tarjetas y componentes relevantes.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Relaciones existentes y diseño de página.
- **Qué puede hacer Claude Code:** Puede editar layouts/FlexiPages; componentes de terceros pueden requerir configuración manual.
- **Validación humana:** Humano valida contenido y rendimiento.
- **Componentes:** Pendiente

### COM-017 · Configuración de listas y vistas de lista

- **Alcance:** Crear filtros, columnas, orden y visibilidad de vistas.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Criterios de negocio y permisos.
- **Qué puede hacer Claude Code:** Generalmente automatizable con metadata; validar filtros y sharing.
- **Validación humana:** Humano valida resultados.
- **Componentes:** Pendiente

### COM-018 · Configuración de Flow Builder

- **Alcance:** Crear record-triggered, screen y autolaunched flows.
- **Tipo de trabajo:** Automatización declarativa
- **Prerrequisitos:** Diseño de proceso, criterios, manejo de errores y datos de prueba.
- **Qué puede hacer Claude Code:** Puede generar metadata de Flow y desplegarla; requiere pruebas exhaustivas y revisión de límites/recursividad.
- **Validación humana:** Humano aprueba lógica y pruebas UAT.
- **Componentes:** Pendiente

### COM-019 · Configuración de reglas de validación

- **Alcance:** Crear reglas de validación y mensajes de error.
- **Tipo de trabajo:** Automatización declarativa
- **Prerrequisitos:** Reglas de negocio y excepciones documentadas.
- **Qué puede hacer Claude Code:** Automatizable con metadata; debe probarse con procesos e integraciones existentes.
- **Validación humana:** Humano aprueba reglas y excepciones.
- **Componentes:** Pendiente

### COM-020 · Configuración de aprobación

- **Alcance:** Configurar procesos de aprobación o mecanismos equivalentes disponibles.
- **Tipo de trabajo:** Automatización declarativa
- **Prerrequisitos:** Matriz de aprobaciones, licencias y capacidades de la org.
- **Qué puede hacer Claude Code:** El agente puede preparar metadata donde esté soportado; disponibilidad y evolución de approvals debe verificarse en la org.
- **Validación humana:** Humano define delegaciones, SLA y segregación.
- **Componentes:** Pendiente

### COM-021 · Configuración de tareas, eventos y actividades

- **Alcance:** Configurar tipos, campos, acciones y uso de actividades.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Modelo de actividad y necesidades de seguimiento.
- **Qué puede hacer Claude Code:** Puede configurar metadata y acciones soportadas; adopción y reglas operativas son humanas.
- **Validación humana:** Humano valida experiencia y reporting.
- **Componentes:** Pendiente

### COM-022 · Configuración de Action Plans / plantillas de planes de acción

- **Alcance:** Definir plantillas, tareas, responsables y criterios de ejecución.
- **Tipo de trabajo:** Configuración declarativa FSC
- **Prerrequisitos:** Disponibilidad de Action Plans en la org/licencia y diseño de proceso.
- **Qué puede hacer Claude Code:** Puede ayudar a preparar configuración y metadata si el componente está expuesto; ciertas plantillas/relaciones pueden requerir Setup o UI.
- **Validación humana:** Humano valida ejecución end-to-end.
- **Componentes:** Pendiente

### COM-023 · Configuración de Case Management

- **Alcance:** Configurar casos, tipos, estados, prioridades, origen y campos.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Proceso de atención y modelo de soporte.
- **Qué puede hacer Claude Code:** Automatizable en buena medida vía metadata; colas, canales y permisos requieren validación.
- **Validación humana:** Humano aprueba proceso de atención.
- **Componentes:** Pendiente

### COM-024 · Configuración de colas y asignación de casos

- **Alcance:** Crear colas, reglas de asignación y criterios de enrutamiento.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Equipos, criterios, usuarios y modelo de operación.
- **Qué puede hacer Claude Code:** Puede generar metadata soportada; probar distribución real y fallback.
- **Validación humana:** Humano valida ownership y SLA.
- **Componentes:** Pendiente

### COM-025 · Configuración de escalamiento y entitlements

- **Alcance:** Configurar escalamiento, hitos y derechos de servicio cuando aplique.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Licencias/capacidades habilitadas, SLA y reglas aprobadas.
- **Qué puede hacer Claude Code:** El agente puede preparar parte de la metadata; disponibilidad de entitlements/milestones varía por org.
- **Validación humana:** Humano define SLA y valida calendario.
- **Componentes:** Pendiente

### COM-026 · Creación de report types, reportes y dashboards

- **Alcance:** Crear tipos de informe, reportes, filtros, gráficos y tableros.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** KPIs, fuentes y permisos definidos.
- **Qué puede hacer Claude Code:** Puede crear metadata de reportes y dashboards cuando sea compatible; visualización y calidad de datos requieren revisión.
- **Validación humana:** Humano valida fórmulas, filtros y métricas.
- **Componentes:** Pendiente

### COM-027 · Configuración de duplicate/matching rules

- **Alcance:** Definir reglas de coincidencia y duplicados para personas/cuentas.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Política de identidad, campos confiables y tolerancia a falsos positivos.
- **Qué puede hacer Claude Code:** Puede configurar metadata; calibración requiere datos representativos y decisión humana.
- **Validación humana:** Humano valida falsos positivos/negativos.
- **Componentes:** Pendiente

### COM-028 · Configuración de validaciones de datos

- **Alcance:** Definir formatos, obligatoriedad y controles de calidad.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Reglas de captura y fuentes de datos.
- **Qué puede hacer Claude Code:** Puede automatizar reglas declarativas; no puede decidir política de calidad.
- **Validación humana:** Humano aprueba reglas.
- **Componentes:** Pendiente

### COM-029 · Configuración de gestión documental

- **Alcance:** Configurar Files, relaciones, tipos de documento y acceso.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Política documental, permisos y almacenamiento.
- **Qué puede hacer Claude Code:** Puede configurar parte de metadata; repositorios externos, retención y clasificación requieren intervención humana.
- **Validación humana:** Humano valida seguridad y cumplimiento.
- **Componentes:** Pendiente

### COM-030 · Preparación y despliegue de cambios entre ambientes

- **Alcance:** Generar package/deployment, validar dependencias y ejecutar despliegues.
- **Tipo de trabajo:** Operación ALM
- **Prerrequisitos:** Repositorios, Salesforce CLI, ambientes y pipeline autorizados.
- **Qué puede hacer Claude Code:** El agente puede preparar/desplegar metadata vía CLI; promoción a producción debe tener aprobación y plan de reversa.
- **Validación humana:** Humano aprueba release y smoke tests.
- **Componentes:** Pendiente
