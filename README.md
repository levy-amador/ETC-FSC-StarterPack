# ETC-FSC-StarterPack

Acelerador de implementación de **Salesforce Financial Services Cloud** de **Especialistas en Transformación Cloud (ETC)**. Usa el modelo **FSC Core**, es decir, los objetos estándar de la plataforma y no el paquete gestionado `FinServ__`.

A cada cliente se le despliega una **base común** más **una vertical**, que se elige y se confirma con el cliente:

| Módulo | Carpeta | Ítems del catálogo | Contenido |
|---|---|---|---|
| Base común FSC | `modules/common` | 30 (COM) | Clientes, relaciones y hogares, seguridad, app, casos, calidad de datos y reportes |
| Seguros | `modules/insurance` | 12 (INS) | Pólizas, coberturas, participantes, siniestros, renovaciones y productores |
| Banca | `modules/banking` | 13 (BNK) | Cuentas financieras, titulares, movimientos, sucursales, onboarding y aclaraciones |
| Patrimonial | `modules/wealth` | 16 (WLT) | Cuentas de inversión, instrumentos, objetivos, revisiones de cartera y eventos de vida |

## Estado actual · v0.1.0 (2026-11-17)

- ✔ Arquitectura modular y scripts operativos: configure, assess, build, validate, deploy, test y deployment-report.
- ✔ Catálogo de 71 configuraciones importado como fuente única ([docs/CATALOG.md](docs/CATALOG.md)).
- ✔ Objetos FSC Core por módulo, tomados de la documentación oficial ([config/modules.json](config/modules.json)).
- ◐ Base común: diccionario de datos y matriz de acceso en borrador (base ETC predeterminada) en `config/spec/`. Falta aprobarlos o ajustarlos con el cliente y generar la metadata.
- ○ Diccionario y matriz de cada vertical: pendientes.
- ✔ Org FSC de referencia habilitada: base común y las 3 verticales en **Listo** (`npm run assess`, 2026-11-17 · [docs/REFERENCE_ORG.md](docs/REFERENCE_ORG.md)).

## Uso rápido

```bash
sf org login web --alias ETC_FSC                      # login manual (la persona, no Claude)
npm run configure                                     # cliente, vertical, nombre de app, logo y colores
npm run assess   -- --target-org ETC_FSC              # diagnóstico de licencias y objetos FSC (solo lectura)
npm run build    -- --target-org ETC_FSC              # base común + vertical seleccionada
npm run validate -- --target-org ETC_FSC              # validaciones locales + check-only
npm run deploy   -- --target-org ETC_FSC              # confirma vertical y despliegue
npm run test     -- --target-org ETC_FSC --allow-data --cleanup
npm run deployment-report -- --target-org ETC_FSC
npm run docs                                          # regenera docs del catálogo
```

Requisitos: Salesforce CLI 2.x y Node.js 18 o superior. No hay dependencias npm y el proyecto no guarda credenciales.

## Estructura

```
modules/<módulo>/main/default/  Metadatos por módulo (common, insurance, banking, wealth)
config/modules.json             Módulos, objetos FSC requeridos, prerrequisitos y pestañas de la app
config/implementation.json      Cliente y vertical seleccionada (npm run configure)
config/catalog/fsc-catalog.json Catálogo de 71 configuraciones: alcance, ejecutor y estado
config/sharing-model.json       OWD objetivo por módulo
config/spec/                    Diccionario de datos y matriz de acceso por módulo (fuente de la metadata)
scripts/                        configure · assess · deploy (build, stages, deploy, report) · validate · test · generate
docs/                           Arquitectura, despliegue, catálogo y un documento por módulo
presentation/                   Generador de la presentación Quick Start
deployments/<alias>/            Evidencia por instancia (no versionada)
```

## Documentación

| Documento | Contenido |
|---|---|
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Principios, módulos y decisiones |
| [DEPLOYMENT](docs/DEPLOYMENT.md) | Flujo de despliegue y controles |
| [DATA_DICTIONARY](docs/DATA_DICTIONARY.md) · [ACCESS_MATRIX](docs/ACCESS_MATRIX.md) | Campos, validaciones, duplicados y seguridad de la base común (generado desde `config/spec/`) |
| [CATALOG](docs/CATALOG.md) · [modules/](docs/modules/) | Alcance por módulo (generado) |
| [ROADMAP](docs/ROADMAP.md) | Siguientes pasos de construcción |
| [REFERENCE_ORG](docs/REFERENCE_ORG.md) | Diagnóstico de la org de referencia y pasos de Setup |
| [KNOWN_LIMITATIONS](docs/KNOWN_LIMITATIONS.md) | Limitaciones, supuestos y pasos manuales |
