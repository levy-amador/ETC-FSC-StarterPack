# Limitaciones conocidas y supuestos (v0.1.0)

| Tema | Situación | Etiqueta |
|---|---|---|
| Metadata de módulos | Los módulos están vacíos. Antes hay que aprobar el diccionario de campos por vertical y la matriz de acceso. | Pendiente |
| Org de pruebas FSC | Ya hay org de referencia y `assess` corrió el 2026-11-17 ([REFERENCE_ORG](REFERENCE_ORG.md)). Faltan los pasos de Setup de la base, Banca y Patrimonial. `build`, `validate` y `deploy` contra la org todavía no se han ejecutado. | En curso |
| Nombres API | Todos los objetos de `config/modules.json` están confirmados con doc oficial o con la org de referencia. Falta validar si `SecuritiesHolding` sirve para tenencias. | Confirmado |
| Licencias | En la org de referencia aparecen los DeveloperName reales (p. ej. `FSCInsurancePsl`, `FSCComprehensivePsl`, `ActionPlansPsl`). `assess` sigue buscando por patrón y la validación contractual la hace una persona. | Confirmado en org |
| Habilitación por metadata | Confirmado en la org de referencia: `IndustriesSettings.enableGroupMembershipPref` y `enableFinancialAccountMgmt` funcionan por metadata. `AccountSettings.enableRelateContactToMultipleAccounts` guarda la bandera, pero no expuso `AccountContactRelation`. Person Accounts solo se activa en Setup. | Confirmado / en revisión |
| Pestañas estándar FSC | Las pestañas `standard-InsurancePolicy`, `standard-FinancialAccount` y similares de `config/modules.json` se validan con check-only en la primera org. | Supuesto |
| Scratch org | No se confirmaron los features de scratch org para FSC Core. Se recomienda una org de prueba FSC o un sandbox con licencias. | Supuesto |
| Fuera de alcance | Integración con core bancario y saldos reales (BNK-003/005); posiciones, valoración y AUM (WLT-004/010/016); KYC/AML y screening (BNK-009, WLT-011); métricas actuariales (INS-012); migración histórica. | Fase 2 |
