# ETC · Financial Services Cloud Starter Pack

Acelerador de Salesforce **Financial Services Cloud con modelo FSC Core** (objetos estándar). Lo construye y opera **ETC · Especialistas en Transformación Cloud**. Patrón heredado del `ETC-SalesCloud-StarterPack`.

## Regla 1 · Vertical por cliente (obligatoria)
El paquete trae la **base común** y las **tres verticales**: Seguros (`insurance`), Banca (`banking`) y Patrimonial (`wealth`). A cada cliente se le despliega la base común **+ la vertical que confirme**.
- Antes de `npm run build` o `npm run deploy`, Claude **pregunta al usuario qué vertical se implementa con este cliente**, aunque `config/implementation.json` ya tenga una. Muestra la que está guardada y pide confirmarla o cambiarla.
- Nunca elijas la vertical por tu cuenta ni la deduzcas del nombre del cliente.
- `deploy` exige escribir el id de la vertical. En modo no interactivo exige `--yes --confirm-vertical <id>`, y Claude solo lo usa con la confirmación explícita del usuario en este mismo turno.

## Regla 2 · Seguridad de la org
- Antes de cualquier despliegue: `npm run assess -- --target-org <alias>` (solo lectura). Si la base o la vertical salen "No listo", no se despliega; se reporta al usuario lo que falta.
- Claude no escribe usuario ni contraseña: el login lo hace la persona con `sf org login web --alias <alias>`.
- Prohibido `sf org display` (expone el access token). Para identificar la org se usa `orgIdentity()` de `scripts/lib/common.js`.
- Despliegues solo con autorización explícita del usuario, por etapas y con check-only previo (`npm run deploy`). Nunca `destructiveChanges`. En producción se necesita además un plan de reversa aprobado (COM-030).
- No se versionan identificadores de clientes: `deployments/<alias>/` y `build/` están en `.gitignore`.

## Regla 3 · Modelo de datos
- **FSC Core**: objetos estándar (FinancialAccount, FinancialAccountParty, InsurancePolicy, PartyRelationshipGroup…). Prohibido referenciar el paquete gestionado `FinServ__` (`npm run validate` lo bloquea).
- Prefijo `ETC_` en todo componente propio. Solo funcionalidad estándar y declarativa: sin Apex ni LWC salvo decisión documentada.
- Los objetos requeridos por módulo y sus prerrequisitos de Setup están en `config/modules.json`. Los nombres marcados como no confirmados se verifican en la org antes de usarlos.

## Regla 4 · El catálogo es la fuente del alcance
- `config/catalog/fsc-catalog.json` tiene las 71 configuraciones (COM, INS, BNK y WLT) con ejecutor, prerrequisitos y validación humana.
- Al construir un ítem: agrega sus componentes en `componentes` (formato `Tipo:Miembro`), cambia `estado` y corre `npm run docs`.
- Los ítems con ejecutor "Humano" o "Humano con apoyo de IA" no se dan por terminados sin la aprobación humana que indica `validacionHumana`. Las decisiones de negocio son del usuario o del cliente: privilegios, SLA, KYC/AML, cifras financieras, elegibilidad y pricing.

## Comandos
`npm run configure` · `assess` · `build` · `validate` · `deploy` · `test` · `deployment-report` · `docs`. Más detalle en `docs/DEPLOYMENT.md`.

## Contenido y estilo
Español de México. No inventes avances, cifras, licencias ni resultados: usa las etiquetas **Supuesto · Estimación · Placeholder · Recomendación · Fuente pendiente**.

## Regla 5 · Especificación antes de metadata
- `config/spec/<módulo>-data-dictionary.json` y `config/spec/<módulo>-access-matrix.json` son la fuente de los campos, las validaciones, los duplicados, los roles, los permisos y la seguridad de campo.
- Si el cliente entrega su definición, ajusta la especificación y deja el origen documentado. Si no la entrega, se usa la base ETC predeterminada.
- La metadata se genera desde la especificación; no se escribe a mano por separado. `npm run validate` revisa la consistencia entre diccionario, matriz y catálogo.
