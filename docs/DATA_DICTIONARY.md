<!-- Generado por npm run docs desde config/spec/. No editar a mano. -->
# Diccionario de datos · Base común FSC

**Estado:** Base ETC predeterminada · pendiente de validación con el cliente.

Se usa tal cual cuando el cliente aún no entrega su definición. Si el cliente la entrega, se ajusta este archivo (origen: Cliente) antes de generar metadata.

## Convenciones

- Prefijo `ETC_` en todo campo propio.
- Antes de crear un campo ETC_ se reutiliza el estándar equivalente.
- Los campos de Contact aparecen en cuentas personales con sufijo __pc (p. ej. ETC_CURP__pc).
- 🔒 = dato sensible (acceso restringido, ver [ACCESS_MATRIX](ACCESS_MATRIX.md)).

## Resumen

| Objeto | Campos ETC | Validaciones | Reglas de duplicados |
|---|---|---|---|
| Account | 9 | 4 | 1 |
| Contact | 8 | 2 | 1 |
| Case | 4 | 2 | 0 |
| Opportunity | 2 | 1 | 0 |
| Lead | 4 | 2 | 1 |
| **Total** | **27** | **11** | **5** |

## Account

| Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |
|---|---|---|---|---|---|
| 🔒 RFC | `ETC_RFC__c` | Texto (13) | - | Identificador fiscal (12 caracteres persona moral, 13 persona física). Base de la detección de duplicados. | COM-010 |
| Régimen fiscal | `ETC_Regimen_Fiscal__c` | Lista | 601 General de Ley Personas Morales · 603 Personas Morales con Fines no Lucrativos · 605 Sueldos y Salarios · 606 Arrendamiento · 612 Personas Físicas con Actividades Empresariales y Profesionales · 616 Sin obligaciones fiscales · 626 Régimen Simplificado de Confianza | Régimen fiscal SAT para facturación y segmentación. | COM-010 |
| Segmento | `ETC_Segmento__c` | Lista | Masivo · Preferente · Patrimonial · PyME · Empresarial · Corporativo | Segmento comercial del cliente; define atención y reportes. | COM-013 |
| Tipo de cliente | `ETC_Tipo_Cliente__c` | Lista | Prospecto · Cliente activo · Cliente inactivo · Ex cliente | Etapa de la relación con el cliente. | COM-013 |
| Cliente desde | `ETC_Cliente_Desde__c` | Fecha | - | Fecha de inicio de la relación comercial. | COM-010 |
| 🔒 Estatus KYC | `ETC_Estatus_KYC__c` | Lista | Pendiente · En revisión · Aprobado · Rechazado · Vencido | Estado del expediente de identificación del cliente. Solo registra el estado: la decisión KYC la toma una persona o un sistema autorizado. | COM-010 |
| 🔒 Fecha de revisión KYC | `ETC_Fecha_Revision_KYC__c` | Fecha | - | Fecha de la última revisión del expediente; base para alertas de vencimiento. | COM-010 |
| 🔒 Nivel de riesgo PLD | `ETC_Nivel_Riesgo__c` | Lista | Bajo · Medio · Alto | Clasificación de riesgo de prevención de lavado de dinero. Solo la edita Cumplimiento. | COM-010 |
| Observaciones | `ETC_Observaciones__c` | Texto largo (4000) | - | Notas generales del cliente. | COM-010 |

## Contact

| Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |
|---|---|---|---|---|---|
| 🔒 CURP | `ETC_CURP__c` | Texto (18) | - | Clave Única de Registro de Población (18 caracteres). En cuentas personales aparece como ETC_CURP__pc. | COM-010 |
| 🔒 Estado civil | `ETC_Estado_Civil__c` | Lista | Soltero(a) · Casado(a) · Unión libre · Divorciado(a) · Viudo(a) | Dato de perfil para hogares y productos. | COM-010 |
| Ocupación | `ETC_Ocupacion__c` | Texto (100) | - | Actividad u ocupación de la persona; insumo de perfil y de riesgo. | COM-010 |
| Nacionalidad | `ETC_Nacionalidad__c` | Lista | Mexicana · Extranjera | Nacionalidad de la persona. | COM-010 |
| Rol en la empresa | `ETC_Rol_Contacto__c` | Lista | Representante legal · Apoderado · Contacto financiero · Contacto operativo · Otro | Función del contacto dentro de una cuenta de empresa. | COM-010 |
| Canal preferido | `ETC_Canal_Preferido__c` | Lista | Correo electrónico · Teléfono · WhatsApp · Sucursal · App o banca digital | Canal por el que el cliente prefiere ser contactado. | COM-010 |
| Autoriza comunicaciones comerciales | `ETC_Autoriza_Comunicaciones__c` | Casilla | Predeterminado: false | Consentimiento para recibir comunicaciones comerciales. | COM-010 |
| Aceptación del aviso de privacidad | `ETC_Fecha_Aviso_Privacidad__c` | Fecha | - | Evidencia de aceptación del aviso de privacidad (LFPDPPP). | COM-010 |

## Case

| Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |
|---|---|---|---|---|---|
| Folio externo | `ETC_Folio_Externo__c` | Texto (30) | - | Folio de la autoridad o de la Unidad Especializada (p. ej. CONDUSEF/UNE) cuando aplique. | COM-023 |
| Dictamen | `ETC_Dictamen__c` | Lista | Procedente · Parcialmente procedente · Improcedente | Resultado de la aclaración o queja. | COM-023 |
| Fecha compromiso | `ETC_Fecha_Compromiso__c` | Fecha | - | Fecha comprometida de respuesta al cliente. | COM-025 |
| Resolución | `ETC_Resolucion__c` | Texto largo (4000) | - | Respuesta dada al cliente; obligatoria para cerrar. | COM-023 |

## Opportunity

| Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |
|---|---|---|---|---|---|
| Producto de interés | `ETC_Producto_Interes__c` | Texto (100) | - | Producto o servicio financiero que se ofrece. Las verticales lo sustituyen por su catálogo. | COM-010 |
| Motivo de pérdida | `ETC_Motivo_Perdida__c` | Lista | Precio o tasa · Competencia · No calificó · Sin interés · Sin respuesta · Otro | Por qué no se concretó la oportunidad. | COM-010 |

## Lead

| Campo | API Name | Tipo | Valores | Para qué sirve | Catálogo |
|---|---|---|---|---|---|
| 🔒 RFC | `ETC_RFC__c` | Texto (13) | - | Identificador fiscal del prospecto; pasa a la cuenta al convertir. | COM-010 |
| Segmento | `ETC_Segmento__c` | Lista | Masivo · Preferente · Patrimonial · PyME · Empresarial · Corporativo | Segmento estimado; pasa a la cuenta al convertir. | COM-013 |
| Producto de interés | `ETC_Producto_Interes__c` | Texto (100) | - | Producto que le interesa al prospecto; pasa a la oportunidad. | COM-010 |
| Motivo de descalificación | `ETC_Motivo_Descalificacion__c` | Lista | No cumple perfil · Sin interés · Sin respuesta · Duplicado · Otro | Por qué se descartó el prospecto. | COM-010 |

## Campos estándar reutilizados

| Objeto | Campo | Uso | Valores propuestos |
|---|---|---|---|
| Account | `AccountSource` (Origen de la cuenta) | Canal de origen | Sucursal · Referido · Digital · Ejecutivo · Alianza · Otro |
| Account | `Industry` (Sector) | Actividad económica de empresas | Sin cambios |
| Account | `AnnualRevenue` (Ingresos anuales) | Tamaño de empresas | Sin cambios |
| Account | `PersonBirthdate` (Fecha de nacimiento) | Personas físicas | Sin cambios |
| Account | `PersonEmail` (Correo electrónico) | Personas físicas; base de duplicados | Sin cambios |
| Case | `Type` (Tipo de solicitud) | Clasificación de casos | Consulta · Aclaración · Queja · Solicitud de servicio · Actualización de datos |
| Case | `Origin` (Canal de atención) | Canal de entrada (se usan los valores estándar: Email-to-Case y escalamientos dependen de ellos) | Sin cambios |
| Case | `Priority` (Prioridad) | Atención y escalamiento (se usan los valores estándar: Email-to-Case y escalamientos dependen de ellos) | Sin cambios |
| Opportunity | `Type` (Tipo de oportunidad) | Origen del negocio | Nuevo cliente · Venta cruzada · Incremento · Renovación |
| Lead | `LeadSource` (Origen del prospecto) | Canal de captación | Sucursal · Referido · Digital · Ejecutivo · Alianza · Otro |

## Reglas de validación

| Objeto | Regla | Qué asegura | Mensaje | Catálogo |
|---|---|---|---|---|
| Account | `ETC_RFC_Formato` | RFC de 12 caracteres (persona moral) o 13 (persona física), en mayúsculas | El RFC no tiene un formato válido: 12 caracteres para persona moral, 13 para persona física, en mayúsculas y sin guiones. | COM-028 |
| Contact | `ETC_CURP_Formato` | CURP de 18 caracteres con estructura oficial | La CURP no tiene un formato válido (18 caracteres en mayúsculas). | COM-028 |
| Account | `ETC_CURP_Formato_Persona` | CURP de 18 caracteres en cuentas personales | La CURP no tiene un formato válido (18 caracteres en mayúsculas). | COM-028 |
| Account | `ETC_KYC_Fecha_Revision` | Un expediente Aprobado debe tener fecha de revisión | Captura la fecha de revisión KYC para marcar el expediente como Aprobado. | COM-028 |
| Account | `ETC_Cliente_Activo_Requiere_KYC` | Un cliente pasa a activo solo con KYC aprobado (al crear o al cambiar el tipo de cliente) | Un cliente activo requiere estatus KYC Aprobado. | COM-028 |
| Contact | `ETC_Consentimiento_Fecha` | Si autoriza comunicaciones debe existir aceptación del aviso de privacidad | Registra la fecha de aceptación del aviso de privacidad antes de autorizar comunicaciones. | COM-028 |
| Case | `ETC_Resolucion_Al_Cerrar` | No se cierra un caso sin resolución | Captura la resolución antes de cerrar el caso. | COM-019 |
| Case | `ETC_Dictamen_Aclaracion` | Aclaraciones y quejas cerradas requieren dictamen | Las aclaraciones y quejas requieren dictamen al cerrarse. | COM-019 |
| Opportunity | `ETC_Motivo_Perdida` | Oportunidad perdida requiere motivo | Indica el motivo de pérdida. | COM-019 |
| Lead | `ETC_RFC_Formato` | RFC de prospecto con formato válido (12 o 13 caracteres) | El RFC no tiene un formato válido. | COM-028 |
| Lead | `ETC_Motivo_Descalificacion` | Prospecto descalificado requiere motivo | Indica el motivo de descalificación. | COM-019 |

## Detección de duplicados

Todas las reglas **alertan sin bloquear**; el bloqueo se decide con el cliente después de calibrar con datos reales (COM-027).

| Objeto | Regla | Coincidencia | Campos |
|---|---|---|---|
| Account | `ETC_Cuenta_RFC` | RFC exacto | `ETC_RFC__c` |
| PersonAccount | `ETC_Persona_CURP` | CURP exacta (cuentas personales) | `ETC_CURP__pc` |
| PersonAccount | `ETC_Persona_Correo_Nombre` | Correo exacto o nombre + celular (cuentas personales) | `PersonEmail`, `FirstName`, `LastName`, `PersonMobilePhone` |
| Contact | `ETC_Contacto_Correo` | Correo exacto | `Email` |
| Lead | `ETC_Prospecto_RFC_Correo` | RFC o correo exacto contra prospectos y cuentas | `ETC_RFC__c`, `Email` |

## Preguntas para el cliente

Si el cliente no responde antes del despliegue, se usa la base de este documento.

- **RFC:** ¿El RFC es obligatorio al crear al cliente o solo al formalizar?
- **Régimen fiscal:** ¿Qué regímenes atienden? (catálogo c_RegimenFiscal del SAT)
- **Segmento:** ¿Cuáles son sus segmentos y con qué criterio se asignan?
- **Estatus KYC:** ¿Quién actualiza el estatus KYC y cada cuánto se revisa el expediente?
- **Nivel de riesgo PLD:** ¿Usan esta clasificación o una propia? ¿Debe verla el asesor?
- **CURP:** ¿La CURP es obligatoria para personas físicas?
- **Aceptación del aviso de privacidad:** ¿Dónde se registra hoy la aceptación del aviso de privacidad?
- **Fecha compromiso:** ¿Qué plazos de respuesta (SLA) aplican por tipo de solicitud?
- **ETC_Cliente_Activo_Requiere_KYC:** ¿Se puede operar con un cliente cuyo KYC está en revisión?
