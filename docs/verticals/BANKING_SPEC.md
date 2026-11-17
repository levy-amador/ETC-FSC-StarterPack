<!-- Generado por npm run docs desde config/spec/. No editar a mano. -->
# Banca · Diccionario y accesos

**Estado:** Base ETC predeterminada · pendiente de validación con el cliente.

Complementa los campos estándar de FSC (vigencias, primas, montos, estados), que se reutilizan tal cual. Se usa si el cliente no entrega su definición.

## Campos ETC

| Objeto | Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |
|---|---|---|---|---|---|---|
| FinancialAccount | 🔒 CLABE | `ETC_CLABE__c` | Texto (18) | - | Clave Bancaria Estandarizada de 18 dígitos. | BNK-003 |
| FinancialAccount | Moneda | `ETC_Moneda__c` | Lista | MXN · USD · EUR · UDI | Moneda de la cuenta. | BNK-003 |
| FinancialAccount | Nivel de cuenta | `ETC_Nivel_Cuenta__c` | Lista | Nivel 1 · Nivel 2 · Nivel 3 · Nivel 4 | Nivel de cuenta de depósito (niveles 1 a 4 de la regulación bancaria mexicana). | BNK-004 |
| FinancialAccount | Canal de apertura | `ETC_Canal_Apertura__c` | Lista | Sucursal · Digital · Ejecutivo · Alianza | Canal por el que se abrió la cuenta. | BNK-009 |
| Case | Cuenta financiera | `ETC_Cuenta_Financiera__c` | Búsqueda → FinancialAccount | - | Cuenta relacionada con la consulta, aclaración o queja. | BNK-011 |
| Case | Monto reclamado | `ETC_Monto_Reclamado__c` | Moneda | - | Monto en disputa en una aclaración. | BNK-011 |

## Campos estándar FSC reutilizados

| Objeto | Campos | Uso |
|---|---|---|
| FinancialAccount | `Type / Status` | Ahorro, cheques, tarjeta, crédito…; activa, cerrada, morosa (BNK-003) · FinancialAccountNumber y Type son obligatorios en FSC Core (validado en la org de referencia). |
| FinancialAccount | `OpeningDate / ClosingDate / BranchUnitId` | Ciclo de vida y sucursal (BNK-006) |
| FinancialAccountTransaction | `Amount / TransactionDate / DebitCreditIndicator` | Se cargan por integración con el core (BNK-005, fuera de alcance) |

## Reglas de validación

| Objeto | Regla | Qué asegura | Mensaje | Catálogo |
|---|---|---|---|---|
| FinancialAccount | `ETC_CLABE_Formato` | CLABE de 18 dígitos | La CLABE debe tener 18 dígitos. | BNK-003 |
| FinancialAccount | `ETC_Cierre_Requiere_Fecha` | Una cuenta cerrada requiere fecha de cierre | Captura la fecha de cierre de la cuenta. | BNK-003 |
| FinancialAccount | `ETC_Fechas_Validas` | La fecha de cierre no puede ser anterior a la apertura | La fecha de cierre no puede ser anterior a la de apertura. | BNK-003 |
| Case | `ETC_Monto_Reclamado_No_Negativo` | El monto reclamado no puede ser negativo | El monto reclamado no puede ser negativo. | BNK-011 |

## Permission Sets

- Los Permission Sets de la vertical se asignan además del Permission Set Group de la persona (base común).
- Sin eliminar, sin Ver todo / Modificar todo.
- Los objetos FSC requieren además la licencia de conjunto de permisos (PSL) correspondiente.

| Permission Set | Otorga |
|---|---|
| `ETC_FSC_Banca_Comercial` | Cuentas financieras y titulares; consulta movimientos y sucursales |
| `ETC_FSC_Banca_Servicio` | Aclaraciones y casos sobre cuentas; consulta cuentas y movimientos |
| `ETC_FSC_Banca_Administracion` | Lectura y edición de todos los campos ETC de Banca (administradores) |

## Asignación por persona (además de su Permission Set Group de la base común)

| Persona | Permission Sets de Banca |
|---|---|
| Asesor / ejecutivo comercial | `ETC_FSC_Banca_Comercial` |
| Gerente comercial | `ETC_FSC_Banca_Comercial` |
| Ejecutivo de servicio | `ETC_FSC_Banca_Servicio` |
| Supervisor de servicio | `ETC_FSC_Banca_Servicio` |
| Administrador | `ETC_FSC_Banca_Administracion` |

## Preguntas para el cliente

- **Nivel de cuenta:** ¿Manejan cuentas por niveles? ¿Qué productos corresponden a cada uno?
