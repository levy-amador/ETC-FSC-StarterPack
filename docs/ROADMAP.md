# Ruta de construcción

| # | Paso | Responsable | Salida |
|---|---|---|---|
| 1 | ✔ Org FSC de referencia conectada (2026-11-17) | Equipo ETC (humano) | Alias autenticado |
| 2 | ✔ `npm run assess` en las tres verticales (2026-11-17) | Claude Code | [REFERENCE_ORG](REFERENCE_ORG.md) |
| 2b | ✔ (2026-11-17) Habilitar en Setup: Person Accounts (irreversible), Contacts to Multiple Accounts, Group Membership y Financial Account Management Standard Objects | Humano (decisión + ejecución) | `assess` con todos los módulos en Listo |
| 3 | ◐ Borrador de la base ETC listo (`config/spec/common-*.json`). Falta que el cliente lo apruebe o lo ajuste (COM-004..007, COM-010..013) | Humano, con borrador de Claude | Especificación aprobada |
| 3b | ✔ Generador de metadata desde `config/spec/` (`scripts/generate/gen-module.js`) | Claude Code | Metadata de los 4 módulos |
| 3c | ✔ Prueba real: base común + Banca desplegadas, 13/13 pruebas; Seguros y Patrimonial con check-only | Claude Code | [LESSONS_REFERENCE_ORG](LESSONS_REFERENCE_ORG.md) |
| 3d | ✔ Layouts, Lightning pages, list views, flows (KYC, fecha compromiso, renovaciones, cierre de cuenta, revisiones de cartera) y reportes | Claude Code (con aprobación) | Etapas 09–15 |
| 3e | ✔ Path (Lead/Opportunity), colas y reglas de asignación (COM-024, BNK-012, INS-008), Action Plans (COM-022) | Claude Code (con aprobación) | Etapas 08, 08b, 10, 12 |
| 4 | Construir la base común: campos ETC_, validaciones (RFC/CURP), matching y duplicates, roles, PS/PSG, app, páginas y reportes | Claude Code (con aprobación) | Metadata en `modules/common` |
| 5 | Diccionario por vertical: Seguros, Banca y Patrimonial | Humano, con borrador de Claude | Especificación aprobada |
| 6 | Construir las verticales | Claude Code (con aprobación) | Metadata en `modules/<vertical>` |
| 7 | Pruebas funcionales por módulo (`tests/<módulo>`) | Claude Code | TEST_RESULTS.md |
| 8 | Despliegue de referencia y reporte por vertical | Claude Code, con autorización | DEPLOYMENT_REPORT.md |
| 9 | Presentación Quick Start con cifras reales (v1.0) | Claude Code | HTML actualizado |
