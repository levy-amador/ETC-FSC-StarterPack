<!-- Generado por npm run docs desde config/catalog/fsc-catalog.json. No editar a mano. -->
# Seguros (vertical: se despliega solo si el cliente la confirma)

Pólizas, coberturas, participantes, bienes asegurados, siniestros y productores.

## Objetos FSC Core

- Requeridos (sin ellos la org no está lista): `InsurancePolicy`, `InsurancePolicyCoverage`, `InsurancePolicyParticipant`, `InsurancePolicyAsset`, `CustomerProperty`, `Producer`
- Opcionales: `InsurancePolicyTransaction`, `ProducerPolicyAssignment`, `ProducerCommission`, `InsuranceContract`, `Claim`, `ClaimParticipant`, `ClaimItem`, `ClaimCoverage`, `ClaimCoveragePaymentDetail`, `ClaimRecovery`

## Prerrequisitos de Setup

- PSL 'FSC Insurance' asignada (acceso a objetos de seguros)
- Siniestros: licencia 'Insurance Claim Management' (permiso FSCInsClaimMgmtPlatformUser)
- Administración de pólizas: licencia 'Insurance Policy Administration' (permiso FSCInsPolicyAdminPlatformUser)

## Ítems del catálogo

| ID | Área | Configuración | Ejecuta | Estado | Validación humana |
|---|---|---|---|---|---|
| INS-001 | Modelo de datos | Configuración del modelo de pólizas (Insurance Policy) | Humano con apoyo de IA | Validado en org | Humano valida ciclo de vida y modelo. |
| INS-002 | Modelo de datos | Configuración de coberturas y bienes asegurados | Humano con apoyo de IA | Pendiente | Humano valida catálogo y relaciones. |
| INS-003 | Modelo de datos | Configuración de beneficiarios y participantes | Claude Code (con aprobación) | Pendiente | Humano valida reglas y privacidad. |
| INS-004 | Modelo de datos | Configuración del modelo de siniestros | Humano con apoyo de IA | Validado en org | Humano valida proceso y cumplimiento. |
| INS-005 | Procesos | Configuración del ciclo de vida de pólizas | Claude Code (con aprobación) | Validado en org | Humano valida escenarios y excepciones. |
| INS-006 | Procesos | Configuración del ciclo de vida de siniestros | Claude Code (con aprobación) | Validado en org | Humano valida controles y aprobaciones. |
| INS-007 | Procesos | Configuración de renovaciones y vencimientos | Claude Code (con aprobación) | Pendiente | Humano valida calendario y mensajes. |
| INS-008 | Procesos | Configuración de asignación a agentes y ajustadores | Claude Code (con aprobación) | Pendiente | Humano valida distribución. |
| INS-009 | Sales | Configuración de productos y oportunidades de seguros | Claude Code (con aprobación) | Pendiente | Humano valida catálogo y reglas. |
| INS-010 | Servicio | Configuración de casos relacionados con pólizas y siniestros | Claude Code (con aprobación) | Validado en org | Humano valida proceso y acceso. |
| INS-011 | Servicio | Configuración de escalamiento de reclamaciones | Humano con apoyo de IA | Pendiente | Humano aprueba matriz. |
| INS-012 | Reportes | Configuración de indicadores de pólizas y siniestros | Claude Code (con aprobación) | Pendiente | Humano valida definiciones. |

## Detalle

### INS-001 · Configuración del modelo de pólizas (Insurance Policy)

- **Alcance:** Habilitar y adaptar el modelo de pólizas, atributos, estados y relaciones.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Licencia/funcionalidad FSC y modelo de póliza definido.
- **Qué puede hacer Claude Code:** El agente puede configurar campos y metadata relacionada; confirmar objeto y capacidades exactas de la versión instalada.
- **Validación humana:** Humano valida ciclo de vida y modelo.
- **Componentes:** `CustomField:InsurancePolicy.ETC_Aseguradora__c`, `CustomField:InsurancePolicy.ETC_Moneda__c`, `CustomField:InsurancePolicy.ETC_Ramo__c`

### INS-002 · Configuración de coberturas y bienes asegurados

- **Alcance:** Modelar coberturas, riesgos, bienes/activos asegurados y relaciones con pólizas.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Catálogo de productos, coberturas y modelo técnico/actuarial.
- **Qué puede hacer Claude Code:** Parte puede configurarse vía metadata; diseño de dominio y reglas de cobertura son humanos.
- **Validación humana:** Humano valida catálogo y relaciones.
- **Componentes:** Pendiente

### INS-003 · Configuración de beneficiarios y participantes

- **Alcance:** Registrar beneficiarios, asegurados adicionales, titulares y otros participantes.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Definición de roles y cardinalidades.
- **Qué puede hacer Claude Code:** Campos/relaciones son automatizables; reglas legales de beneficiarios requieren definición humana.
- **Validación humana:** Humano valida reglas y privacidad.
- **Componentes:** Pendiente

### INS-004 · Configuración del modelo de siniestros

- **Alcance:** Habilitar y adaptar registros de siniestros, estados, responsables y datos clave.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Disponibilidad de Claims y proceso de reclamaciones definido.
- **Qué puede hacer Claude Code:** Puede preparar metadata; verificar qué capacidades están licenciadas y si el objeto estándar cubre el caso.
- **Validación humana:** Humano valida proceso y cumplimiento.
- **Componentes:** `CustomField:Claim.ETC_Numero_Siniestro_Aseguradora__c`

### INS-005 · Configuración del ciclo de vida de pólizas

- **Alcance:** Configurar etapas/estados para cotización, emisión, vigencia, renovación y cancelación.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Estados y reglas del negocio asegurador.
- **Qué puede hacer Claude Code:** Automatizable mediante picklists, flows y reglas; decisiones de suscripción y cancelación son humanas.
- **Validación humana:** Humano valida escenarios y excepciones.
- **Componentes:** `CustomField:InsurancePolicy.ETC_Conducto_Cobro__c`, `ValidationRule:InsurancePolicy.ETC_Cancelacion_Requiere_Fecha`, `ValidationRule:InsurancePolicy.ETC_Vigencia_Valida`

### INS-006 · Configuración del ciclo de vida de siniestros

- **Alcance:** Configurar etapas de apertura, evaluación, autorización, pago y cierre.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Flujo operativo y matriz de autorizaciones.
- **Qué puede hacer Claude Code:** Puede construir automatizaciones; decisiones de cobertura, reservas y pago no deben delegarse al agente.
- **Validación humana:** Humano valida controles y aprobaciones.
- **Componentes:** `CustomField:Claim.ETC_Coaseguro_Aplicado__c`, `CustomField:Claim.ETC_Deducible_Aplicado__c`, `ValidationRule:Claim.ETC_Fecha_Siniestro_No_Futura`, `ValidationRule:Claim.ETC_Montos_No_Negativos`

### INS-007 · Configuración de renovaciones y vencimientos

- **Alcance:** Automatizar alertas, tareas y seguimiento previo al vencimiento de pólizas.
- **Tipo de trabajo:** Automatización declarativa
- **Prerrequisitos:** Fechas, ventanas de renovación y responsables.
- **Qué puede hacer Claude Code:** Flow/scheduled paths pueden automatizarse; reglas comerciales deben aprobarse.
- **Validación humana:** Humano valida calendario y mensajes.
- **Componentes:** Pendiente

### INS-008 · Configuración de asignación a agentes y ajustadores

- **Alcance:** Asignar prospectos, pólizas y siniestros según producto, región o especialidad.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Matriz de territorios, capacidad y especialidades.
- **Qué puede hacer Claude Code:** Reglas y colas pueden configurarse; criterios operativos requieren aprobación.
- **Validación humana:** Humano valida distribución.
- **Componentes:** Pendiente

### INS-009 · Configuración de productos y oportunidades de seguros

- **Alcance:** Configurar catálogo comercial, etapas y seguimiento de oportunidades de seguros.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Catálogo de productos, canales y proceso de venta.
- **Qué puede hacer Claude Code:** Puede configurar productos, campos y etapas; pricing y elegibilidad requieren decisión humana.
- **Validación humana:** Humano valida catálogo y reglas.
- **Componentes:** Pendiente

### INS-010 · Configuración de casos relacionados con pólizas y siniestros

- **Alcance:** Relacionar casos de atención con asegurados, pólizas y siniestros.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Modelo de casos y relaciones disponibles.
- **Qué puede hacer Claude Code:** Puede configurar campos, relaciones y layouts; validar visibilidad de información sensible.
- **Validación humana:** Humano valida proceso y acceso.
- **Componentes:** `CustomField:Case.ETC_Poliza__c`

### INS-011 · Configuración de escalamiento de reclamaciones

- **Alcance:** Definir criterios de prioridad y escalamiento por severidad, antigüedad o SLA.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Matriz de severidad, SLA y responsables autorizada.
- **Qué puede hacer Claude Code:** El agente puede implementar reglas; clasificación de severidad y SLA son decisiones de negocio.
- **Validación humana:** Humano aprueba matriz.
- **Componentes:** Pendiente

### INS-012 · Configuración de indicadores de pólizas y siniestros

- **Alcance:** Reportes de emisión, renovación, cancelación, siniestralidad operativa y tiempos de resolución.
- **Tipo de trabajo:** Analítica
- **Prerrequisitos:** Definiciones KPI y datos disponibles.
- **Qué puede hacer Claude Code:** Puede crear reportes; métricas actuariales/financieras deben definirse y validarse por especialistas.
- **Validación humana:** Humano valida definiciones.
- **Componentes:** Pendiente
