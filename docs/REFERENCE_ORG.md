# Org de referencia FSC

Org de pruebas de ETC para construir y validar el Starter Pack. Los identificadores (Org Id, usuario, URL) **no se versionan**: están en `deployments/<alias>/ORG_ASSESSMENT.md`, que se regenera con `npm run assess`.

## Diagnóstico inicial · 2026-11-17

| Dato | Resultado |
|---|---|
| Edición | Enterprise Edition |
| Paquete gestionado FinServ | No instalado (compatible con FSC Core) |
| Person Accounts | No habilitadas |
| Licencias FSC | Presentes: FSC Comprehensive, FSC Sales, FSC Service, FSC Insurance, Action Plans, Insurance Policy Administration, Insurance Claim Management, entre otras |

| Módulo | Veredicto | Causa |
|---|---|---|
| Base común | ✖ No listo | Faltan Person Accounts, Contacts to Multiple Accounts (`AccountContactRelation`) y Group Membership (`AccountAccountRelation`, `ContactContactRelation`, `PartyRelationshipGroup`) |
| Seguros | ✔ Listo | Pólizas, coberturas, participantes, bienes, siniestros y productores disponibles |
| Banca | ✖ No listo | "Financial Account Management Standard Objects" apagado (`FinancialAccount` y relacionados) |
| Patrimonial | ✖ No listo | Mismo ajuste que Banca (`FinancialAccount`, `FinancialSecurity`). `FinancialGoal` ya disponible |

El usuario del diagnóstico ya tiene asignadas las licencias FSC. Los objetos faltantes se deben a funcionalidad no habilitada en Setup, no a permisos sin asignar.

## Confirmado en la org (antes no confirmado en la documentación)

- `ActionPlanTemplate`, `ActionPlan` y `ActionPlanItem` existen.
- `SecuritiesHolding` existe. Falta validar si sirve para tenencias de Patrimonial.

## Pasos de Setup pendientes (los hace o aprueba una persona)

| # | Ajuste | Habilita | Reversible |
|---|---|---|---|
| 1 | Person Accounts | Clientes persona física | **No**. Requiere decisión explícita |
| 2 | Contacts to Multiple Accounts | `AccountContactRelation` | Sí |
| 3 | Group Membership + permiso Group Membership | Hogares y relaciones | Por confirmar |
| 4 | Financial Account Management Standard Objects | Banca y Patrimonial | Por confirmar |
