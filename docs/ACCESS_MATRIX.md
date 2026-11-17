<!-- Generado por npm run docs desde config/spec/. No editar a mano. -->
# Matriz de acceso · Base común FSC

**Estado:** Base ETC predeterminada · requiere revisión de seguridad y aprobación del cliente (COM-004, COM-006, COM-007).

## Principios

- Privado por defecto: cada quien ve lo suyo y lo de su equipo por jerarquía.
- Permission Set First: permisos por Permission Set Groups; perfiles solo para lo que Metadata API exige.
- Sin Ver todo / Modificar todo ni permisos administrativos en conjuntos operativos.
- Sin permiso de eliminar en usuarios operativos.
- Los datos sensibles (KYC, riesgo PLD, estado civil) se restringen por seguridad de campo.

## Personas

| Persona | Qué hace | Rol | Permission Set Group | Licencia |
|---|---|---|---|---|
| Asesor / ejecutivo comercial | Atiende su cartera: prospectos, clientes, oportunidades y solicitudes. | `ETC_Asesor` | `ETC_PSG_Asesor` | FSC Sales |
| Gerente comercial | Supervisa a su equipo de asesores; ve y edita la cartera del equipo; reportes. | `ETC_Gerente_Comercial` | `ETC_PSG_Gerente` | FSC Sales |
| Ejecutivo de servicio | Atiende casos: consultas, aclaraciones y quejas. Consulta clientes sin modificarlos. | `ETC_Ejecutivo_Servicio` | `ETC_PSG_Ejecutivo_Servicio` | FSC Service |
| Supervisor de servicio | Supervisa la operación de casos, reasigna y da seguimiento a SLA. | `ETC_Supervisor_Servicio` | `ETC_PSG_Supervisor_Servicio` | FSC Service |
| Oficial de cumplimiento | Revisa expedientes KYC y clasifica el riesgo PLD. Única persona que edita esos campos. | `ETC_Cumplimiento` | `ETC_PSG_Cumplimiento` | FSC Service |
| Dirección | Visibilidad de toda la operación por jerarquía y dashboards; no captura. | `ETC_Direccion` | `ETC_PSG_Direccion` | FSC Sales |
| Administrador | Configuración de la plataforma. Usa el perfil Administrador del sistema; no recibe Permission Set Groups operativos. | - | Perfil Administrador del sistema | Salesforce |

## Jerarquía de roles

```
Dirección (ETC_Direccion)
    └─ Gerente comercial (ETC_Gerente_Comercial)
        └─ Asesor (ETC_Asesor)
    └─ Supervisor de servicio (ETC_Supervisor_Servicio)
        └─ Ejecutivo de servicio (ETC_Ejecutivo_Servicio)
    └─ Cumplimiento (ETC_Cumplimiento)
```

## Valores predeterminados de toda la organización (OWD)

| Objeto | Acceso |
|---|---|
| Account | Privado |
| Contact | Controlado por el principal |
| Opportunity | Privado |
| Case | Privado |
| Lead | Privado |

## Reglas de colaboración

| Objeto | Regla | Registros | Se comparten con | Acceso | Por qué |
|---|---|---|---|---|---|
| Account | `ETC_Clientes_Lectura_Servicio` | Cuentas propiedad de la jerarquía comercial (rol ETC_Direccion y subordinados) | Rol ETC_Supervisor_Servicio y subordinados | Lectura | Servicio necesita consultar al cliente para atender casos. |
| Account | `ETC_Clientes_Edicion_Cumplimiento` | Cuentas propiedad de la jerarquía comercial (rol ETC_Direccion y subordinados) | Rol ETC_Cumplimiento | Lectura y edición | Cumplimiento actualiza KYC y riesgo; la seguridad de campo limita qué puede editar. |
| Case | `ETC_Casos_Lectura_Comercial` | Casos propiedad de la jerarquía de servicio (rol ETC_Supervisor_Servicio y subordinados) | Rol ETC_Gerente_Comercial y subordinados | Lectura | El asesor da seguimiento a las solicitudes de sus clientes. |

## Permisos por objeto

C = crear · R = leer · E = editar · D = eliminar (nadie tiene D) · — = sin acceso

| | Asesor / ejecutivo comercial | Gerente comercial | Ejecutivo de servicio | Supervisor de servicio | Oficial de cumplimiento | Dirección |
|---|---|---|---|---|---|---|
| **Lead** | CRE | CRE | — | — | — | R |
| **Account** | CRE | CRE | R | R | RE | R |
| **Contact** | CRE | CRE | R | R | RE | R |
| **Opportunity** | CRE | CRE | — | — | — | R |
| **Case** | CR | CR | CRE | CRE | R | R |
| *Alcance* | Sus registros | Su equipo (jerarquía) | Clientes: lectura (sharing); casos: los suyos y su cola | Casos de su equipo (jerarquía) y clientes en lectura | Todos los clientes (sharing de edición) | Todo (jerarquía) |

## Seguridad de campo (datos sensibles)

E = edita · R = lee · — = sin acceso. Campos ETC no listados: asesor y gerente editan; el resto lee.

| | Asesor / ejecutivo comercial | Gerente comercial | Ejecutivo de servicio | Supervisor de servicio | Oficial de cumplimiento | Dirección |
|---|---|---|---|---|---|---|
| `Account.ETC_RFC__c` | E | E | R | R | E | R |
| `Contact.ETC_CURP__c` | E | E | R | R | E | R |
| `Account.ETC_Estatus_KYC__c` | R | R | R | R | E | R |
| `Account.ETC_Fecha_Revision_KYC__c` | R | R | R | R | E | R |
| `Account.ETC_Nivel_Riesgo__c` | — | R | — | — | E | R |
| `Contact.ETC_Estado_Civil__c` | E | E | — | — | R | — |
| `Case.ETC_Dictamen__c` | R | R | E | E | R | R |
| `Case.ETC_Resolucion__c` | R | R | E | E | R | R |

## Permission Sets y grupos

| Permission Set | Otorga |
|---|---|
| `ETC_FSC_Base_Access` | App del Starter Pack, pestañas y lectura de campos ETC no sensibles |
| `ETC_FSC_Comercial` | Crear/leer/editar Lead, Account, Contact, Opportunity; crear casos; editar campos comerciales |
| `ETC_FSC_Servicio` | Crear/leer/editar Case; leer Account y Contact; editar dictamen y resolución |
| `ETC_FSC_Cumplimiento` | Editar RFC, CURP, estatus KYC, fecha de revisión y nivel de riesgo |
| `ETC_FSC_Supervision` | Ver nivel de riesgo, reportes y dashboards de equipo |

| Permission Set Group | Incluye |
|---|---|
| `ETC_PSG_Asesor` | `ETC_FSC_Base_Access` + `ETC_FSC_Comercial` |
| `ETC_PSG_Gerente` | `ETC_FSC_Base_Access` + `ETC_FSC_Comercial` + `ETC_FSC_Supervision` |
| `ETC_PSG_Ejecutivo_Servicio` | `ETC_FSC_Base_Access` + `ETC_FSC_Servicio` |
| `ETC_PSG_Supervisor_Servicio` | `ETC_FSC_Base_Access` + `ETC_FSC_Servicio` + `ETC_FSC_Supervision` |
| `ETC_PSG_Cumplimiento` | `ETC_FSC_Base_Access` + `ETC_FSC_Cumplimiento` |
| `ETC_PSG_Direccion` | `ETC_FSC_Base_Access` + `ETC_FSC_Supervision` |

## Preguntas para el cliente

- Organigrama real: ¿cuántos niveles entre asesor y dirección? ¿Hay regiones o sucursales?
- ¿Servicio y comercial son equipos distintos o la misma persona atiende ambos?
- ¿Quién puede ver el nivel de riesgo PLD?
- ¿Licencias contratadas por persona (FSC Sales / FSC Service)?
- ¿Hay usuarios externos (portal, brokers, aliados)?
- ¿Qué licencia tendrá Cumplimiento? ¿Es un área interna o un proveedor?
- ¿El asesor debe ver todos los casos o solo los de sus clientes?
