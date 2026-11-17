<!-- Generado por npm run docs desde config/spec/. No editar a mano. -->
# Patrimonial · Diccionario y accesos

**Estado:** Base ETC predeterminada · pendiente de validación con el cliente.

Complementa los campos estándar de FSC (vigencias, primas, montos, estados), que se reutilizan tal cual. Se usa si el cliente no entrega su definición.

## Campos ETC

| Objeto | Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |
|---|---|---|---|---|---|---|
| Account | 🔒 Perfil de inversionista | `ETC_Perfil_Inversionista__c` | Lista | Conservador · Moderado · Balanceado · Agresivo | Resultado del perfilamiento del cliente. Lo determina el proceso de perfilamiento aprobado, no el asesor por su cuenta. | WLT-014 |
| Account | Fecha de perfilamiento | `ETC_Fecha_Perfilamiento__c` | Fecha | - | Fecha del último perfilamiento; base para su actualización. | WLT-014 |
| Account | Frecuencia de revisión | `ETC_Frecuencia_Revision__c` | Lista | Trimestral · Semestral · Anual | Cada cuánto se revisa la cartera con el cliente. | WLT-012 |
| Account | Próxima revisión de cartera | `ETC_Proxima_Revision__c` | Fecha | - | Fecha de la siguiente revisión programada. | WLT-012 |
| FinancialGoal | Horizonte | `ETC_Horizonte__c` | Lista | Corto plazo (menos de 1 año) · Mediano plazo (1 a 5 años) · Largo plazo (más de 5 años) | Plazo del objetivo financiero. | WLT-006 |

## Campos estándar FSC reutilizados

| Objeto | Campos | Uso |
|---|---|---|
| FinancialGoal | `Type / TargetAmount / TargetDate / Status` | Meta, monto, fecha y avance (WLT-006) |
| FinancialAccount | `Type / Status / IsManaged` | Cuentas de inversión y custodia (WLT-003) |
| SecuritiesHolding | `Shares / MarketValue / AssetClass` | Se cargan por integración con custodios (WLT-004, fuera de alcance) |

## Reglas de validación

| Objeto | Regla | Qué asegura | Mensaje | Catálogo |
|---|---|---|---|---|
| Account | `ETC_Perfil_Requiere_Fecha` | Un perfil de inversionista requiere fecha de perfilamiento | Captura la fecha de perfilamiento. | WLT-014 |
| FinancialGoal | `ETC_Fecha_Meta_Valida` | La fecha meta debe ser posterior al inicio | La fecha meta debe ser posterior a la fecha de inicio. | WLT-006 |
| FinancialGoal | `ETC_Monto_Meta_Positivo` | El monto meta debe ser mayor a cero | El monto meta debe ser mayor a cero. | WLT-006 |

## Permission Sets

- Los Permission Sets de la vertical se asignan además del Permission Set Group de la persona (base común).
- Sin eliminar, sin Ver todo / Modificar todo.
- Los objetos FSC requieren además la licencia de conjunto de permisos (PSL) correspondiente.

| Permission Set | Otorga |
|---|---|
| `ETC_FSC_Patrimonial_Asesor` | Cuentas de inversión, objetivos, activos y pasivos; perfil y revisiones; consulta instrumentos y tenencias |
| `ETC_FSC_Patrimonial_Lectura` | Consulta de la información patrimonial (servicio, cumplimiento, dirección) |
| `ETC_FSC_Patrimonial_Administracion` | Lectura y edición de todos los campos ETC de Patrimonial (administradores) |

## Asignación por persona (además de su Permission Set Group de la base común)

| Persona | Permission Sets de Patrimonial |
|---|---|
| Asesor / ejecutivo comercial | `ETC_FSC_Patrimonial_Asesor` |
| Gerente comercial | `ETC_FSC_Patrimonial_Asesor` |
| Ejecutivo de servicio | `ETC_FSC_Patrimonial_Lectura` |
| Supervisor de servicio | `ETC_FSC_Patrimonial_Lectura` |
| Oficial de cumplimiento | `ETC_FSC_Patrimonial_Lectura` |
| Dirección | `ETC_FSC_Patrimonial_Lectura` |
| Administrador | `ETC_FSC_Patrimonial_Administracion` |

## Preguntas para el cliente

- **Perfil de inversionista:** ¿Qué perfiles usan y con qué cuestionario se determinan?
