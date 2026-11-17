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
