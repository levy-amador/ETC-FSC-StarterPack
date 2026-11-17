# Arquitectura

## Objetivo

Acelerador para implementar Financial Services Cloud (modelo FSC Core) con una base común reutilizable y un módulo por industria. La vertical se elige y se confirma por cliente.

## Principios

| Principio | Cómo se aplica |
|---|---|
| FSC Core | Solo objetos estándar (FinancialAccount, FinancialAccountParty, InsurancePolicy, PartyRelationshipGroup…). `validate` bloquea cualquier referencia a `FinServ__`. |
| Modular | Base común + una vertical. Un componente vive en un solo módulo; `build` y `validate` detectan duplicados. |
| Vertical confirmada | `configure` la guarda; `build` la exige; `deploy` la vuelve a confirmar (se escribe su id). |
| Diagnóstico antes de desplegar | `assess` (COM-001) revisa en solo lectura objetos, Person Accounts, licencias y si existe el paquete FinServ. `deploy` no corre si la base o la vertical salen "No listo". |
| Estándar y declarativo | Sin Apex ni LWC salvo decisión documentada. |
| Prefijo único | `ETC_` en todo componente propio, para auditar y retirar. |
| Permission Set First | Perfiles solo donde Metadata API no da otra opción (asignación de layouts). |
| No destructivo | Sin `destructiveChanges`. Los valores estándar reemplazados quedan inactivos. |
| Catálogo como fuente | `config/catalog/fsc-catalog.json` define el alcance, el ejecutor y el estado de cada ítem. Los docs se generan desde ahí. |
| Humano en las decisiones | Las licencias, los privilegios, KYC/AML, los SLA, las cifras financieras y la elegibilidad los aprueba una persona (columna `validacionHumana`). |

## Módulos y dependencias

```
                ┌─────────────── Base común (COM, 30) ───────────────┐
                │ Account/Person Account · Contact · Case · relaciones │
                │ y hogares (PartyRelationshipGroup) · seguridad · app │
                └───────────────┬───────────────┬────────────────────┘
                                │               │
        ┌───────────────────────┼───────────────┼───────────────────────┐
   Seguros (INS, 12)        Banca (BNK, 13)            Patrimonial (WLT, 16)
   InsurancePolicy…         FinancialAccount…          FinancialAccount, FinancialGoal…
```

Las verticales dependen de la base común. Entre verticales no hay dependencias.

## Etapas de despliegue

Las 16 etapas de `scripts/deploy/stages.js` agrupan los componentes de **todos los módulos activos**, porque las dependencias cruzan módulos:

`00-settings → 01-data-model → 02-picklists-processes → 03-validation-rules → 04-matching-rules → 05-duplicate-rules → 06-sharing-model → 07-roles → 08-queues-routing → 09-layouts-actions → 10-lightning-pages → 11-flows → 12-action-plans → 13-app-branding → 14-permissions → 15-reports-dashboards`

El orden hereda lo aprendido en Sales Cloud: los roles van después del OWD, y los reportes después de los permisos.

## Decisiones

1. **FSC Core en lugar del paquete gestionado**, porque es la recomendación de Salesforce para orgs nuevas. Si la org ya tiene FinServ, `assess` lo advierte, ya que Salesforce pide no mezclar ambos modelos.
2. **Una sola carpeta por módulo como packageDirectory** (`sfdx-project.json`). Así cada vertical se puede revisar y versionar por separado.
3. **OWD por módulo** (`config/sharing-model.json`). Los OWD de los objetos de cada vertical quedan pendientes de la matriz de acceso (COM-007).
4. **Pestañas de la app por módulo** (`appTabs` en `config/modules.json`). `configure` arma la app con las pestañas de la base y de la vertical elegida.
