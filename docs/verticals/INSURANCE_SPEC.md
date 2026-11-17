<!-- Generado por npm run docs desde config/spec/. No editar a mano. -->
# Seguros · Diccionario y accesos

**Estado:** Base ETC predeterminada · pendiente de validación con el cliente.

Complementa los campos estándar de FSC (vigencias, primas, montos, estados), que se reutilizan tal cual. Se usa si el cliente no entrega su definición.

## Campos ETC

| Objeto | Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |
|---|---|---|---|---|---|---|
| InsurancePolicy | Ramo | `ETC_Ramo__c` | Lista | Vida · Gastos médicos mayores · Accidentes personales · Autos · Daños · Responsabilidad civil | Ramo de seguro según la clasificación usada en México. | INS-001 |
| InsurancePolicy | Aseguradora | `ETC_Aseguradora__c` | Texto (100) | - | Compañía que emite la póliza (relevante para agentes y corredurías). | INS-001 |
| InsurancePolicy | Moneda de la póliza | `ETC_Moneda__c` | Lista | MXN · USD · UDI | Moneda en que se pacta la suma asegurada y la prima. | INS-001 |
| InsurancePolicy | Conducto de cobro | `ETC_Conducto_Cobro__c` | Lista | Domiciliación · Tarjeta de crédito · Transferencia · Ventanilla · Descuento por nómina | Medio por el que se cobra la prima. | INS-005 |
| Claim | Número de siniestro (aseguradora) | `ETC_Numero_Siniestro_Aseguradora__c` | Texto (40) | - | Folio que asigna la aseguradora al siniestro. | INS-004 |
| Claim | Deducible aplicado | `ETC_Deducible_Aplicado__c` | Moneda | - | Monto de deducible aplicado al siniestro. | INS-006 |
| Claim | Coaseguro aplicado | `ETC_Coaseguro_Aplicado__c` | Moneda | - | Monto de coaseguro aplicado al siniestro. | INS-006 |
| Case | Póliza | `ETC_Poliza__c` | Búsqueda → InsurancePolicy | - | Póliza relacionada con la solicitud o reclamación. | INS-010 |

## Campos estándar FSC reutilizados

| Objeto | Campos | Uso |
|---|---|---|
| InsurancePolicy | `Status` | Ciclo de vida de la póliza (INS-005) |
| InsurancePolicy | `EffectiveDate / ExpirationDate` | Inicio y fin de vigencia; base de renovaciones (INS-007) |
| InsurancePolicy | `PremiumAmount / PremiumFrequency` | Prima y forma de pago |
| Claim | `Status / LossDate / EstimatedAmount / ApprovedAmount` | Ciclo de vida y montos del siniestro (INS-006) |

## Reglas de validación

| Objeto | Regla | Qué asegura | Mensaje | Catálogo |
|---|---|---|---|---|
| InsurancePolicy | `ETC_Vigencia_Valida` | El fin de vigencia no puede ser anterior al inicio | El fin de vigencia no puede ser anterior al inicio de vigencia. | INS-005 |
| InsurancePolicy | `ETC_Cancelacion_Requiere_Fecha` | Una póliza cancelada requiere fecha de cancelación | Captura la fecha de cancelación. | INS-005 |
| Claim | `ETC_Fecha_Siniestro_No_Futura` | La fecha de ocurrencia no puede ser futura | La fecha de ocurrencia del siniestro no puede ser futura. | INS-006 |
| Claim | `ETC_Montos_No_Negativos` | Montos del siniestro no negativos | Los montos del siniestro no pueden ser negativos. | INS-006 |

## Permission Sets

- Los Permission Sets de la vertical se asignan además del Permission Set Group de la persona (base común).
- Sin eliminar, sin Ver todo / Modificar todo.
- Los objetos FSC requieren además la licencia de conjunto de permisos (PSL) correspondiente.

| Permission Set | Otorga |
|---|---|
| `ETC_FSC_Seguros_Comercial` | Pólizas, coberturas, participantes y bienes asegurados; consulta siniestros |
| `ETC_FSC_Seguros_Siniestros` | Atención de siniestros y casos de pólizas; consulta pólizas |
| `ETC_FSC_Seguros_Administracion` | Lectura y edición de todos los campos ETC de Seguros (administradores) |

## Asignación por persona (además de su Permission Set Group de la base común)

| Persona | Permission Sets de Seguros |
|---|---|
| Asesor / ejecutivo comercial | `ETC_FSC_Seguros_Comercial` |
| Gerente comercial | `ETC_FSC_Seguros_Comercial` |
| Ejecutivo de servicio | `ETC_FSC_Seguros_Siniestros` |
| Supervisor de servicio | `ETC_FSC_Seguros_Siniestros` |
| Administrador | `ETC_FSC_Seguros_Administracion` |

## Preguntas para el cliente

- **Ramo:** ¿Qué ramos manejan?
