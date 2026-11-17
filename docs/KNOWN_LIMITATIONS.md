# Limitaciones conocidas y supuestos (v0.1.0)

| Tema | Situación | Etiqueta |
|---|---|---|
| Metadata de módulos | Los módulos están vacíos. Antes hay que aprobar el diccionario de campos por vertical y la matriz de acceso. | Pendiente |
| Org de pruebas FSC | Todavía no hay una org con licencias FSC. `assess`, `build` con org, `validate` contra org y `deploy` no se han ejecutado contra una org real. | Pendiente |
| Nombres API no confirmados | `ActionPlanTemplate`, `ActionPlan` y `ActionPlanItem` (base común) y `SecuritiesHolding` (patrimonial: la doc oficial se contradice). Se verifican con `assess`. | Fuente pendiente |
| Licencias | La doc oficial no publica `PermissionSetLicense.DeveloperName` de FSC. `assess` busca por patrón (FSC, Financial, Insurance, Action Plan) y la validación contractual la hace una persona. | Fuente pendiente |
| Habilitación por metadata | No se confirmaron los flags de `IndustriesSettings` que activan "Group Membership" y "Financial Account Management Standard Objects". Por ahora es un paso manual en Setup. | Fuente pendiente |
| Pestañas estándar FSC | Las pestañas `standard-InsurancePolicy`, `standard-FinancialAccount` y similares de `config/modules.json` se validan con check-only en la primera org. | Supuesto |
| Scratch org | No se confirmaron los features de scratch org para FSC Core. Se recomienda una org de prueba FSC o un sandbox con licencias. | Supuesto |
| Fuera de alcance | Integración con core bancario y saldos reales (BNK-003/005); posiciones, valoración y AUM (WLT-004/010/016); KYC/AML y screening (BNK-009, WLT-011); métricas actuariales (INS-012); migración histórica. | Fase 2 |
