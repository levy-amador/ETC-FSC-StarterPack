# Evidencia por instancia

Cada org tiene su carpeta `deployments/<alias>/`, que los scripts generan:

| Archivo | Lo genera |
|---|---|
| `ORG_ASSESSMENT.md` | `npm run assess -- --target-org <alias>` (solo lectura) |
| `DEPLOYMENT_REPORT.md` | `npm run deployment-report -- --target-org <alias>` |
| `TEST_RESULTS.md` | `npm run test -- --target-org <alias> --allow-data` |

Estas carpetas **no se versionan** (`.gitignore`) porque contienen identificadores de la instancia del cliente: Org Id, URL, usuarios e IDs de registros. Para entregarlas, compártelas por un canal privado del proyecto.
