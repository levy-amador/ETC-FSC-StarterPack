<!-- Generado por npm run docs desde config/catalog/fsc-catalog.json. No editar a mano. -->
# Banca (vertical: se despliega solo si el cliente la confirma)

Cuentas financieras, titulares, movimientos, tarjetas y sucursales.

## Objetos FSC Core

- Requeridos (sin ellos la org no está lista): `FinancialAccount`, `FinancialAccountParty`, `FinancialAccountTransaction`
- Opcionales: `FinancialAccountBalance`, `IssuedCard`, `BranchUnit`, `BranchUnitRelatedRecord`, `Banker`

## Prerrequisitos de Setup

- Activar 'Financial Account Management Standard Objects' en Setup

## Ítems del catálogo

| ID | Área | Configuración | Ejecuta | Estado | Validación humana |
|---|---|---|---|---|---|
| BNK-001 | Modelo de datos | Configuración de clientes individuales y empresariales | Claude Code (con aprobación) | Pendiente | Humano valida modelo y controles. |
| BNK-002 | Modelo de datos | Configuración de hogares y grupos económicos | Claude Code (con aprobación) | Pendiente | Humano valida relaciones y sharing. |
| BNK-003 | Modelo de datos | Configuración de cuentas financieras | Humano con apoyo de IA | Validado en org | Humano valida modelo y fuente maestra. |
| BNK-004 | Modelo de datos | Configuración de productos bancarios | Claude Code (con aprobación) | Validado en org | Humano valida producto y cumplimiento. |
| BNK-005 | Modelo de datos | Configuración de transacciones financieras | Humano | Pendiente | Humano/arquitectura valida fuente e integración. |
| BNK-006 | Modelo de datos | Configuración de sucursales y equipos | Claude Code (con aprobación) | Pendiente | Humano valida jerarquía. |
| BNK-007 | Interfaz | Configuración de resumen financiero del cliente | Humano con apoyo de IA | Pendiente | Humano valida cifras y permisos. |
| BNK-008 | Interfaz | Configuración de Actionable Relationship Center | Humano con apoyo de IA | Pendiente | Humano valida grafo y acceso. |
| BNK-009 | Procesos | Configuración de onboarding y apertura de cuentas | Humano con apoyo de IA | Validado en org | Humano valida compliance e integración. |
| BNK-010 | Sales | Configuración de oportunidades de productos bancarios | Claude Code (con aprobación) | Pendiente | Humano valida reglas comerciales. |
| BNK-011 | Servicio | Configuración de casos y aclaraciones bancarias | Claude Code (con aprobación) | Validado en org | Humano valida taxonomía y SLA. |
| BNK-012 | Servicio | Configuración de enrutamiento por sucursal/producto | Claude Code (con aprobación) | Pendiente | Humano valida operación. |
| BNK-013 | Reportes | Configuración de indicadores comerciales y de servicio | Claude Code (con aprobación) | Pendiente | Humano valida cifras y definiciones. |

## Detalle

### BNK-001 · Configuración de clientes individuales y empresariales

- **Alcance:** Configurar personas, cuentas empresariales y atributos relevantes para Banking.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Modelo de clientes y funcionalidades FSC habilitadas.
- **Qué puede hacer Claude Code:** Puede configurar metadata y páginas; clasificación KYC/legal debe definirse por negocio/compliance.
- **Validación humana:** Humano valida modelo y controles.
- **Componentes:** Pendiente

### BNK-002 · Configuración de hogares y grupos económicos

- **Alcance:** Configurar Household y relaciones entre integrantes/familias o grupos económicos.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Criterios de agrupación y privacidad.
- **Qué puede hacer Claude Code:** Puede configurar metadata y relaciones; reglas de consolidación y acceso requieren aprobación.
- **Validación humana:** Humano valida relaciones y sharing.
- **Componentes:** Pendiente

### BNK-003 · Configuración de cuentas financieras

- **Alcance:** Habilitar/adaptar Financial Accounts y sus atributos bancarios.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** FSC/licencia y definición de cuentas, estados y titulares.
- **Qué puede hacer Claude Code:** Puede configurar extensiones; integración con core y saldos reales no se resuelve solo con metadata.
- **Validación humana:** Humano valida modelo y fuente maestra.
- **Componentes:** `CustomField:FinancialAccount.ETC_CLABE__c`, `CustomField:FinancialAccount.ETC_Moneda__c`, `ValidationRule:FinancialAccount.ETC_CLABE_Formato`, `ValidationRule:FinancialAccount.ETC_Cierre_Requiere_Fecha`, `ValidationRule:FinancialAccount.ETC_Fechas_Validas`

### BNK-004 · Configuración de productos bancarios

- **Alcance:** Configurar catálogo de cuentas, depósitos, tarjetas, créditos u otros productos.
- **Tipo de trabajo:** Configuración declarativa/FSC
- **Prerrequisitos:** Catálogo de productos y modelo comercial.
- **Qué puede hacer Claude Code:** Puede crear catálogo y relaciones; condiciones, tasas y elegibilidad requieren aprobación.
- **Validación humana:** Humano valida producto y cumplimiento.
- **Componentes:** `CustomField:FinancialAccount.ETC_Nivel_Cuenta__c`

### BNK-005 · Configuración de transacciones financieras

- **Alcance:** Definir estructura y visualización de movimientos asociados a cuentas.
- **Tipo de trabajo:** Configuración FSC / integración
- **Prerrequisitos:** Especificación del core, volumen, retención y fuente de datos.
- **Qué puede hacer Claude Code:** Puede preparar objetos/campos y mapping; integración, reconciliación y seguridad transaccional requieren especialistas.
- **Validación humana:** Humano/arquitectura valida fuente e integración.
- **Componentes:** Pendiente

### BNK-006 · Configuración de sucursales y equipos

- **Alcance:** Configurar sucursales, equipos y asignaciones organizacionales.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Estructura de sucursales y usuarios.
- **Qué puede hacer Claude Code:** Metadata y registros pueden prepararse; carga inicial y gobierno de estructura requieren aprobación.
- **Validación humana:** Humano valida jerarquía.
- **Componentes:** Pendiente

### BNK-007 · Configuración de resumen financiero del cliente

- **Alcance:** Mostrar cuentas, relaciones y datos financieros relevantes en la vista del cliente.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Componentes FSC disponibles y fuentes de datos conectadas.
- **Qué puede hacer Claude Code:** Puede configurar páginas/componentes disponibles; exactitud de saldos y consolidación depende de integración.
- **Validación humana:** Humano valida cifras y permisos.
- **Componentes:** Pendiente

### BNK-008 · Configuración de Actionable Relationship Center

- **Alcance:** Configurar visualización de relaciones entre personas, hogares, empresas y cuentas.
- **Tipo de trabajo:** Configuración FSC
- **Prerrequisitos:** Componente/licencia disponible y relaciones modeladas.
- **Qué puede hacer Claude Code:** Puede preparar configuración cuando esté expuesta; pruebas visuales y reglas de acceso requieren humano.
- **Validación humana:** Humano valida grafo y acceso.
- **Componentes:** Pendiente

### BNK-009 · Configuración de onboarding y apertura de cuentas

- **Alcance:** Configurar etapas, checklist, tareas y seguimiento de alta de clientes/cuentas.
- **Tipo de trabajo:** Automatización declarativa
- **Prerrequisitos:** Proceso KYC, documentos, sistemas externos y criterios de aprobación.
- **Qué puede hacer Claude Code:** Puede automatizar tareas y estados; validación de identidad, screening y decisiones de riesgo requieren sistemas/personas autorizadas.
- **Validación humana:** Humano valida compliance e integración.
- **Componentes:** `CustomField:FinancialAccount.ETC_Canal_Apertura__c`

### BNK-010 · Configuración de oportunidades de productos bancarios

- **Alcance:** Configurar oportunidades para venta cruzada, captación y contratación de productos.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Etapas, productos, canales y reglas comerciales.
- **Qué puede hacer Claude Code:** Puede configurar metadata; elegibilidad, pricing y recomendaciones requieren aprobación.
- **Validación humana:** Humano valida reglas comerciales.
- **Componentes:** Pendiente

### BNK-011 · Configuración de casos y aclaraciones bancarias

- **Alcance:** Configurar casos para consultas, aclaraciones, quejas y solicitudes de clientes.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Taxonomía de motivos, estados y SLA.
- **Qué puede hacer Claude Code:** Puede configurar objetos, colas, flows y reportes; cumplimiento regulatorio debe validarse.
- **Validación humana:** Humano valida taxonomía y SLA.
- **Componentes:** `CustomField:Case.ETC_Cuenta_Financiera__c`, `CustomField:Case.ETC_Monto_Reclamado__c`, `ValidationRule:Case.ETC_Monto_Reclamado_No_Negativo`

### BNK-012 · Configuración de enrutamiento por sucursal/producto

- **Alcance:** Asignar solicitudes y casos según sucursal, producto, segmento o especialidad.
- **Tipo de trabajo:** Configuración declarativa
- **Prerrequisitos:** Matriz de asignación y usuarios/equipos.
- **Qué puede hacer Claude Code:** Automatizable con reglas/flows; validar excepciones y balanceo.
- **Validación humana:** Humano valida operación.
- **Componentes:** Pendiente

### BNK-013 · Configuración de indicadores comerciales y de servicio

- **Alcance:** Reportes de captación, productos por cliente, oportunidades, casos y desempeño por sucursal.
- **Tipo de trabajo:** Analítica
- **Prerrequisitos:** Definiciones KPI, acceso y datos consistentes.
- **Qué puede hacer Claude Code:** Puede crear reportes; conciliación con core y métricas regulatorias requieren validación humana.
- **Validación humana:** Humano valida cifras y definiciones.
- **Componentes:** Pendiente
