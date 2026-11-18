# Lecciones de la prueba real (org de referencia, 2026-11-17)

Hallazgos del primer ciclo completo `configure → assess → build → validate → deploy → test → deployment-report`. Todos están corregidos en el repo.

| # | Hallazgo | Dónde apareció | Corrección |
|---|---|---|---|
| 1 | `AccountSettings.enableRelateContactToMultipleAccounts` por metadata deja la casilla marcada pero no habilita `AccountContactRelation` | assess | Se activa desde Setup (paso manual) |
| 2 | Person Accounts necesita al menos un record type de Account | Setup | Record type `Account.ETC_Empresa` en la base común |
| 3 | Los roles se validan contra el OWD vigente; en una validación combinada el OWD nuevo todavía no está aplicado | validate | `validate` deja roles, colaboración y OWD como pendientes cuando el build trae un cambio de OWD; `deploy` los valida en su etapa |
| 4 | `AccountSource` no admite despliegue como Standard Value Set | validate | Sus valores se administran en Setup |
| 5 | En un Permission Set, leer Account exige leer Contact | validate | Se agrega lectura de Contact |
| 6 | Las matching rules de cuentas personales viven en el objeto `PersonAccount`, no en `Account` | validate | Reglas de personas en `PersonAccount` |
| 7 | Las matching rules no aceptan campos de fecha (`PersonBirthdate`) | validate | Se usa el celular |
| 8 | El orden de las Duplicate Rules continúa después de las reglas existentes, y solo el retrieve distingue Account de PersonAccount | validate | `build` calcula el orden con un retrieve de la org |
| 9 | Las validaciones de Contact **no se ejecutan** al crear cuentas personales | test COM-T03 | Regla equivalente en Account sobre `ETC_CURP__pc` |
| 10 | `IsClosed` no está calculado al validar un caso que se crea ya cerrado | test COM-T07/T08 | Las reglas evalúan también `Status = Closed` |
| 11 | El administrador no ve los campos de una vertical si no tiene su Permission Set de administración | test BNK-T03 | Paso posterior al despliegue: asignar `ETC_FSC_<Vertical>_Administracion` |
| 12 | `FinancialAccountNumber` y `Type` son obligatorios en FinancialAccount | test BNK-T03 | Documentado en la especificación de Banca |
| 13 | Una prueba de rechazo puede pasar en falso si el error es de acceso y no de validación | test BNK-T01 | Las pruebas comparan contra el mensaje exacto y fallan con errores de columna o permiso |
| 14 | Un Custom Report Type no acepta `OwnerId` como columna | validate (UI) | Se retiró de los tipos de reporte |
| 15 | El layout de Case exige `SuppliedEmail` (correo del remitente web o por email) | validate (UI) | Sección "Remitente (web o correo)" en el layout de casos |
| 16 | Los nombres de listas relacionadas cambian por objeto: `RelatedAccountContactRelationList` existe en Account pero no en Contact; Case no tiene `RelatedNoteList` | validate (UI) | Listas relacionadas ajustadas por objeto (en los objetos FSC se usan los nombres de la org: `FinancialAccountParties`, `InsurancePolicyCoverages`, `ClaimItems`…) |
| 17 | La validación "cliente activo requiere KYC" impediría que el flow marque como Vencido el KYC de un cliente activo | diseño de flows | La regla solo aplica al crear o al cambiar el tipo de cliente |
| 18 | Al automatizar la fecha de cierre de una cuenta, la validación correspondiente ya no se dispara al guardar | test BNK-T02 | La prueba verifica que el flow registre la fecha |
| 19 | Con el repo en el Escritorio sincronizado con iCloud, al reescribir archivos aparecieron 326 copias " 2" y el despliegue falló ("Not in package.xml") | deploy (01-data-model) | Repo movido a `~/Proyectos`; `validate` y `build` fallan si detectan copias " 2" |
| 20 | La normalización del RFC (flow) solo aplica si el texto cabe en el campo de 13 caracteres: un RFC con dos guiones se rechaza por longitud antes de que corra el flow | test COM-T11 | Documentado; si el cliente captura con guiones, ampliar la longitud o normalizar en la captura |
| 21 | Por API, una Duplicate Rule configurada para alertar (Allow + Alert) **rechaza** el registro, salvo que la carga envíe `allowSave` en el encabezado de duplicados | test COM-T11 / COM-T13 | Documentado para integraciones y migraciones (Data Loader y APIs deben habilitar «permitir duplicados» de forma explícita) |
| 22 | `FinancialGoal` no admite Custom Report Types y su layout exige como obligatorios `Priority`, `StartDate`, `TargetDate`, `TargetAmount` y `OwnerId` (se tomaron del layout estándar de la org); además no admite la sección de sistema ni listas relacionadas | validate (Patrimonial) | Sin reporte de objetivos (se usa la vista de lista); `Priority` obligatorio en el layout |
