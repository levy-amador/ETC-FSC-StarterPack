# Ruta de construcción

| # | Paso | Responsable | Salida |
|---|---|---|---|
| 1 | ✔ Org FSC de referencia conectada (2026-11-17) | Equipo ETC (humano) | Alias autenticado |
| 2 | ✔ `npm run assess` en las tres verticales (2026-11-17) | Claude Code | [REFERENCE_ORG](REFERENCE_ORG.md) |
| 2b | Habilitar en Setup: Person Accounts (irreversible), Contacts to Multiple Accounts, Group Membership y Financial Account Management Standard Objects | Humano (decisión + ejecución) | `assess` con todos los módulos en Listo |
| 3 | Aprobar el diccionario de campos y la matriz de acceso de la base común (COM-004..007, COM-010..013) | Humano, con borrador de Claude | Especificación aprobada |
| 4 | Construir la base común: campos ETC_, validaciones (RFC/CURP), matching y duplicates, roles, PS/PSG, app, páginas y reportes | Claude Code (con aprobación) | Metadata en `modules/common` |
| 5 | Diccionario por vertical: Seguros, Banca y Patrimonial | Humano, con borrador de Claude | Especificación aprobada |
| 6 | Construir las verticales | Claude Code (con aprobación) | Metadata en `modules/<vertical>` |
| 7 | Pruebas funcionales por módulo (`tests/<módulo>`) | Claude Code | TEST_RESULTS.md |
| 8 | Despliegue de referencia y reporte por vertical | Claude Code, con autorización | DEPLOYMENT_REPORT.md |
| 9 | Presentación Quick Start con cifras reales (v1.0) | Claude Code | HTML actualizado |
