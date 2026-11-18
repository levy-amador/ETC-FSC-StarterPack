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

## Pasos posteriores al despliegue (manuales)

1. Crear los usuarios y asignarles su **rol** y su **Permission Set Group** de la base común (ver [ACCESS_MATRIX](ACCESS_MATRIX.md)).
2. Asignar los **Permission Sets de la vertical** según la tabla de asignación de `docs/verticals/<VERTICAL>_SPEC.md`.
3. Asignar a los administradores `ETC_FSC_<Vertical>_Administracion`: el perfil Administrador solo da acceso de campo a la base común.
4. Asignar las **licencias FSC** (PSL) correspondientes: FSC Sales, FSC Service, FSC Insurance, etc.
5. Cargar o integrar los datos maestros (sucursales, productos) que correspondan a la vertical.

## Experiencia por vertical

Los layouts de la base común reciben secciones de la vertical activa (por ejemplo, Banca agrega "Cuenta financiera" al layout de casos). También dependen de la vertical la asignación de layouts en los perfiles y las páginas en la app. `npm run configure` regenera todo (`npm run generate`) y deja la marca en `config/generated-ui.json`; `npm run build` se detiene si la marca no coincide con la vertical del build.

## Umbrales de los flows

Los días de vigencia KYC, la fecha compromiso de casos y los avisos de renovación y revisión están en Custom Metadata `ETC_Configuracion_FSC__mdt` (registro `Default`). Los valores iniciales están en `config/spec/common-settings.json` (Supuesto: se confirman con el cliente y no son plazos regulatorios).

## Verificación manual de flows programados

Los flows programados corren a diario (07:00 UTC). Para verificarlos sin esperar: Setup › Flows › abrir el flow › Depurar, con un registro que cumpla la condición.
- `ETC_Cuenta_KYC_Vencimiento`: cuenta con KYC Aprobado y fecha de revisión anterior a la vigencia.
- `ETC_Poliza_Aviso_Renovacion` (Seguros): póliza que vence en los días de aviso.
- `ETC_Revision_Cartera_Aviso` (Patrimonial): cuenta con próxima revisión en los días de aviso.

## Integraciones y cargas de datos

Las reglas de duplicados alertan en pantalla, pero por API **rechazan** el registro duplicado. Las integraciones, migraciones y cargas con Data Loader deben decidir explícitamente si permiten duplicados (`DuplicateRuleHeader.allowSave = true`) o limpiarlos antes.

## Configuración de casos y asignación

La regla de asignación `ETC_Asignacion_Casos` reparte los casos entre colas: Aclaraciones y quejas, Servicio general y, según la vertical, Siniestros (Seguros) o Servicio a cuentas (Banca). Las colas tienen como miembros al rol Supervisor de servicio y sus subordinados.

Salesforce exige definir antes el **propietario predeterminado** y el **usuario automatizado** de casos. Si la org no los tiene, `npm run build` los agrega con la cola ETC Servicio general y el usuario que despliega; se pueden cambiar en Setup › Configuración de casos.

## Etapas, Path y Action Plans

- Las etapas de oportunidad y los estados de prospecto de la base ETC reemplazan a los estándar. Los anteriores quedan inactivos, no se borran.
- Path guía cada etapa con los campos clave.
- Las plantillas de Action Plans (onboarding de cliente y, según la vertical, apertura de cuenta, atención de siniestro o revisión de cartera) requieren que los usuarios tengan la licencia Action Plans.
