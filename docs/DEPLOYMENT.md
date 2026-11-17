# Despliegue

## Flujo

| Paso | Comando | Toca la org | Control |
|---|---|---|---|
| 1 | `npm run configure` | No | Pregunta cliente, **vertical** y branding; guarda `config/implementation.json` |
| 2 | `npm run assess -- --target-org X` | Solo lectura | Veredicto Listo / No listo por módulo; `deployments/X/ORG_ASSESSMENT.md` |
| 3 | `npm run build -- --target-org X` | Solo lectura (retrieve) | Exige vertical; construye base + vertical; instantánea en `build/org-snapshot` |
| 4 | `npm run validate -- --target-org X` | Check-only | Validaciones locales + validación real sin cambios |
| 5 | `npm run deploy -- --target-org X` | **Sí** | Escribir el id de la vertical + diagnóstico "Listo" + confirmación; check-only antes de cada etapa |
| 6 | `npm run test -- --target-org X --allow-data --cleanup` | Crea y borra datos de prueba | Solo con `--allow-data` |
| 7 | `npm run deployment-report -- --target-org X` | Solo lectura | Repo contra org por tipo de componente |

## Opciones de deploy

- `--from <etapa>`, `--to <etapa>` y `--only <etapa>`: despliegue parcial.
- `--yes --confirm-vertical <id>`: modo no interactivo. Requiere los dos.
- `--skip-assess`: omite el diagnóstico; queda registrado en el log. Usarlo solo con justificación.

## Cambiar de vertical

`npm run configure` (o `npm run build -- --vertical banking --change-vertical`) y después `build` de nuevo. Un build hecho para otra vertical o para otra org no se puede desplegar.
