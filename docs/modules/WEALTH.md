<!-- Generado por npm run docs desde config/catalog/fsc-catalog.json. No editar a mano. -->
# Patrimonial (vertical: se despliega solo si el cliente la confirma)

Cuentas de inversión, instrumentos, tenencias, objetivos financieros y activos/pasivos.

## Objetos FSC Core

- Requeridos (sin ellos la org no está lista): `FinancialAccount`, `FinancialAccountParty`, `FinancialGoal`, `FinancialSecurity`
- Opcionales: `FinancialGoalParty`, `SecuritiesHolding`, `PartyFinancialAsset`, `PartyFinancialLiability`

## Prerrequisitos de Setup

- Activar 'Financial Account Management Standard Objects' en Setup
- SecuritiesHolding existe en la org de referencia; validar su uso para tenencias (la doc oficial lo describe ligado a pólizas)

## Ítems del catálogo

| ID | Área | Configuración | Ejecuta | Estado | Validación humana |
|---|---|---|---|---|---|
| WLT-001 | Modelo de datos | Configuración de clientes y estructuras patrimoniales | Humano con apoyo de IA | Pendiente | Humano valida estructura y cumplimiento. |
| WLT-002 | Modelo de datos | Configuración de hogares y grupos familiares | Claude Code (con aprobación) | Pendiente | Humano valida sharing y privacidad. |
| WLT-003 | Modelo de datos | Configuración de cuentas financieras de inversión | Humano con apoyo de IA | Pendiente | Humano valida fuente maestra. |
| WLT-004 | Modelo de datos | Configuración de activos, posiciones y tenencias | Humano | Pendiente | Humano valida valoración y reconciliación. |
| WLT-005 | Modelo de datos | Configuración de valores e instrumentos financieros | Humano con apoyo de IA | Pendiente | Humano valida catálogo. |
| WLT-006 | Modelo de datos | Configuración de objetivos financieros | Claude Code (con aprobación) | Validado en org | Humano valida metodología. |
| WLT-007 | Modelo de datos | Configuración de asesores y equipos patrimoniales | Claude Code (con aprobación) | Pendiente | Humano valida asignaciones. |
| WLT-008 | Interfaz | Configuración de Financial Accounts 360 / resumen de cuentas | Humano con apoyo de IA | Pendiente | Humano valida saldos y acceso. |
| WLT-009 | Interfaz | Configuración de Actionable Relationship Center | Humano con apoyo de IA | Pendiente | Humano valida grafo. |
| WLT-010 | Interfaz | Configuración de resumen patrimonial | Humano | Pendiente | Humano valida metodología y cifras. |
| WLT-011 | Procesos | Configuración de onboarding patrimonial | Humano con apoyo de IA | Pendiente | Humano valida compliance. |
| WLT-012 | Procesos | Configuración de revisiones periódicas de cartera | Claude Code (con aprobación) | Validado en org | Humano valida política de asesoría. |
| WLT-013 | Procesos | Configuración de eventos de vida | Humano con apoyo de IA | Pendiente | Humano valida privacidad y reglas. |
| WLT-014 | Sales | Configuración de oportunidades de inversión y servicios | Claude Code (con aprobación) | Validado en org | Humano valida cumplimiento. |
| WLT-015 | Servicio | Configuración de casos relacionados con cuentas y clientes | Claude Code (con aprobación) | Pendiente | Humano valida acceso. |
| WLT-016 | Reportes | Configuración de indicadores de patrimonio y asesores | Claude Code (con aprobación) | Pendiente | Humano valida cálculos. |

## Detalle

### WLT-001 · Configuración de clientes y estructuras patrimoniales

- **Alcance:** Configurar personas, entidades legales, fideicomisos u otras estructuras según alcance.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Modelo legal/operativo y funcionalidades/licencias FSC.
- **Qué puede hacer Claude Code:** Puede configurar metadata; tratamiento legal/fiscal y titularidad beneficiaria requieren expertos.
- **Validación humana:** Humano valida estructura y cumplimiento.
- **Componentes:** Pendiente

### WLT-002 · Configuración de hogares y grupos familiares

- **Alcance:** Configurar Household, miembros y relaciones patrimoniales/familiares.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Criterios de agrupación y reglas de confidencialidad.
- **Qué puede hacer Claude Code:** Puede configurar relaciones y páginas; acceso a datos familiares requiere revisión.
- **Validación humana:** Humano valida sharing y privacidad.
- **Componentes:** Pendiente

### WLT-003 · Configuración de cuentas financieras de inversión

- **Alcance:** Habilitar/adaptar Financial Accounts para cuentas de inversión y custodia.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** FSC/licencia y definición de cuentas/custodios.
- **Qué puede hacer Claude Code:** Puede extender metadata; integración de posiciones y saldos requiere fuentes externas.
- **Validación humana:** Humano valida fuente maestra.
- **Componentes:** Pendiente

### WLT-004 · Configuración de activos, posiciones y tenencias

- **Alcance:** Configurar representación de activos e inversiones por cuenta/cliente.
- **Tipo de trabajo:** Configuración FSC / integración
- **Prerrequisitos:** Modelo de instrumentos, frecuencia de actualización y custodios.
- **Qué puede hacer Claude Code:** Puede crear estructuras y mappings; cálculo/conciliación de posiciones requiere integración y validación financiera.
- **Validación humana:** Humano valida valoración y reconciliación.
- **Componentes:** Pendiente

### WLT-005 · Configuración de valores e instrumentos financieros

- **Alcance:** Configurar securities/instrumentos, clases y relaciones con cuentas y posiciones.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Catálogo de instrumentos y modelo de datos disponible.
- **Qué puede hacer Claude Code:** Puede preparar metadata/catálogos; clasificación y datos de mercado deben provenir de fuentes autorizadas.
- **Validación humana:** Humano valida catálogo.
- **Componentes:** Pendiente

### WLT-006 · Configuración de objetivos financieros

- **Alcance:** Habilitar/adaptar Financial Goals y relaciones con clientes/hogares.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Objetivos, atributos y funcionalidades FSC disponibles.
- **Qué puede hacer Claude Code:** Puede configurar metadata y páginas; metodología de planificación financiera es humana.
- **Validación humana:** Humano valida metodología.
- **Componentes:** `CustomField:FinancialGoal.ETC_Horizonte__c`, `ValidationRule:FinancialGoal.ETC_Fecha_Meta_Valida`, `ValidationRule:FinancialGoal.ETC_Monto_Meta_Positivo`

### WLT-007 · Configuración de asesores y equipos patrimoniales

- **Alcance:** Configurar asesores responsables, equipos, roles y relaciones con clientes.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Modelo operativo y asignación de carteras.
- **Qué puede hacer Claude Code:** Puede configurar metadata y asignaciones; decisión de ownership y cobertura es humana.
- **Validación humana:** Humano valida asignaciones.
- **Componentes:** Pendiente

### WLT-008 · Configuración de Financial Accounts 360 / resumen de cuentas

- **Alcance:** Mostrar cuentas financieras y datos relacionados en una vista consolidada.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Componentes FSC y fuentes de datos disponibles.
- **Qué puede hacer Claude Code:** Puede configurar páginas/componentes soportados; exactitud de datos consolidados depende de integración.
- **Validación humana:** Humano valida saldos y acceso.
- **Componentes:** Pendiente

### WLT-009 · Configuración de Actionable Relationship Center

- **Alcance:** Visualizar relaciones entre clientes, hogares, entidades y asesores.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Componente disponible y relaciones configuradas.
- **Qué puede hacer Claude Code:** Puede preparar configuración; validar relaciones y seguridad visualmente.
- **Validación humana:** Humano valida grafo.
- **Componentes:** Pendiente

### WLT-010 · Configuración de resumen patrimonial

- **Alcance:** Mostrar composición patrimonial, distribución de activos y métricas relevantes.
- **Tipo de trabajo:** Configuración FSC / analítica
- **Prerrequisitos:** Definiciones de patrimonio, valoración, moneda y fuentes.
- **Qué puede hacer Claude Code:** El agente puede construir componentes estándar/reportes si los datos están disponibles; cálculos patrimoniales requieren definición y validación experta.
- **Validación humana:** Humano valida metodología y cifras.
- **Componentes:** Pendiente

### WLT-011 · Configuración de onboarding patrimonial

- **Alcance:** Configurar etapas, checklist, tareas y documentación para alta de clientes.
- **Tipo de trabajo:** Automatización declarativa
- **Prerrequisitos:** Proceso de aceptación, KYC/AML, documentos y aprobaciones.
- **Qué puede hacer Claude Code:** Puede automatizar seguimiento; verificaciones KYC/AML y aceptación son humanas/sistemas especializados.
- **Validación humana:** Humano valida compliance.
- **Componentes:** Pendiente

### WLT-012 · Configuración de revisiones periódicas de cartera

- **Alcance:** Programar tareas, revisiones y seguimiento periódico con clientes.
- **Tipo de trabajo:** Automatización declarativa
- **Prerrequisitos:** Frecuencia, segmentos y responsables.
- **Qué puede hacer Claude Code:** Automatizable con Flow/tareas; recomendaciones de inversión no deben generarse sin marco aprobado.
- **Validación humana:** Humano valida política de asesoría.
- **Componentes:** `ActionPlanTemplate:ETC_Revision_Cartera`, `CustomField:Account.ETC_Frecuencia_Revision__c`, `CustomField:Account.ETC_Proxima_Revision__c`

### WLT-013 · Configuración de eventos de vida

- **Alcance:** Registrar eventos relevantes y generar actividades de seguimiento.
- **Tipo de trabajo:** Configuración FSC / automatización
- **Prerrequisitos:** Taxonomía de eventos y tratamiento de datos personales.
- **Qué puede hacer Claude Code:** Puede configurar campos/flows; interpretación y uso de eventos sensibles requiere política humana.
- **Validación humana:** Humano valida privacidad y reglas.
- **Componentes:** Pendiente

### WLT-014 · Configuración de oportunidades de inversión y servicios

- **Alcance:** Configurar oportunidades para servicios, productos y soluciones patrimoniales.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Catálogo, etapas y reglas de idoneidad.
- **Qué puede hacer Claude Code:** Puede configurar metadata; suitability, recomendaciones y aceptación de riesgo requieren especialistas autorizados.
- **Validación humana:** Humano valida cumplimiento.
- **Componentes:** `CustomField:Account.ETC_Fecha_Perfilamiento__c`, `CustomField:Account.ETC_Perfil_Inversionista__c`, `ValidationRule:Account.ETC_Perfil_Requiere_Fecha`

### WLT-015 · Configuración de casos relacionados con cuentas y clientes

- **Alcance:** Gestionar solicitudes y consultas vinculadas con cuentas financieras y clientes.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Taxonomía de servicio y relaciones de cuenta.
- **Qué puede hacer Claude Code:** Automatizable con metadata; validar segregación de información patrimonial.
- **Validación humana:** Humano valida acceso.
- **Componentes:** Pendiente

### WLT-016 · Configuración de indicadores de patrimonio y asesores

- **Alcance:** Reportes de activos administrados, clientes, objetivos, revisiones y productividad.
- **Tipo de trabajo:** Analítica
- **Prerrequisitos:** Definiciones KPI, datos de custodia/mercado y permisos.
- **Qué puede hacer Claude Code:** Puede construir reportes; AUM, rendimiento y valorización requieren fuentes y validación financiera.
- **Validación humana:** Humano valida cálculos.
- **Componentes:** Pendiente
