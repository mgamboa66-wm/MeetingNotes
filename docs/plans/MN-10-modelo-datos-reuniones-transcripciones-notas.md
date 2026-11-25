# MN-10 | Revisar el modelo de datos de reuniones, transcripciones y notas

**Estado:** Borrador para revisión humana; no aprobado. Este documento revisa el modelo ya implementado y no modifica código, el contrato vigente ni las decisiones aprobadas de v1.

**Objetivo:** describir cómo el esquema y la API del backend MN-08 representan los datos aprobados de reuniones; distinguir datos persistentes, datos transitorios y elementos que no forman parte de v1; registrar los pendientes técnicos que sí siguen abiertos.

**Resultado esperado:** una revisión documental del esquema, la API y el ciclo de vida de los datos, alineada con el alcance v1 y con la implementación actual. El plan no autoriza persistir transcripciones, añadir categorías de notas, adoptar PostgreSQL ni ampliar el alcance.

## Estado de autoridad e implementación

El alcance de producto v1 está aprobado y MN-01 registra que la discrepancia inicial de autoridad quedó resuelta. MN-05 está aprobado como plan documental por Marco; las aprobaciones de Producto y Privacidad constan en la sección 8 de las decisiones técnicas. La revisión de Ronald sobre el tratamiento ante objeción o retiro del consentimiento sigue pendiente. MN-08 está aprobado para implementar el backend local y su código ya está en `apps/api/`; la validación nativa de captura por plataforma aún no está completa. ([MN-01](./MN-01-alcance-mvp.md:31), [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md:3), [decisiones técnicas](../decisions/TECH_DESITIONS_MVP.md:139), [MN-08](./MN-08-arquitectura-backend-integraciones.md:133), [README de la API](../../apps/api/README.md:27))

| Tema | Decisión o estado vigente | Estado para esta revisión |
|---|---|---|
| Alcance de producto | Aprobado; la fuente vigente es el [alcance v1](../decisions/MEETINGNOTES_V1_SCOPE.md). | Base del modelo; no se reabre. |
| Datos de reuniones y tareas | El alcance aprueba historial local, título, idioma, resumen, pendientes, edición y eliminación manual. | Implementados en el esquema y el contrato del backend. |
| Audio y transcripciones | Se elimina audio y transcripción local tras éxito; ante fallo se descarta la transcripción y se conserva el audio hasta reintento o eliminación manual. | Se mantienen esas reglas; no se propone una entidad persistente de transcripción. |
| SQLite y migraciones | SQLite local, `bun:sqlite`, Drizzle con `drizzle-orm/bun-sqlite`, rutas por sistema operativo y migraciones SQL versionadas se adoptaron para MN-08. | Implementados; la aplicación de la migración en una base de usuario y la validación multiplataforma no se han completado. |
| Revisión de privacidad | Producto y Privacidad están aprobados según el registro técnico. Ronald sigue pendiente para objeción o retiro del consentimiento. | Registrar el pendiente sin presentarlo como bloqueo general de autoridad del modelo/API. |

## Fuentes y autoridad

- [AGENTS.md](../../AGENTS.md): confirma el alcance aprobado, el backend MN-08 y el stack SQLite/Drizzle; también enumera permisos de archivos y algunos fallos de filesystem como decisiones abiertas.
- [Alcance v1](../decisions/MEETINGNOTES_V1_SCOPE.md): fuente normativa para los datos que se guardan, el acceso local y la retención de audio y transcripciones.
- [MN-01](./MN-01-alcance-mvp.md): registra resuelta la discrepancia inicial de autoridad.
- [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md) y [decisiones técnicas, sección 8](../decisions/TECH_DESITIONS_MVP.md:139): aprobación documental de MN-05, aprobaciones de Producto y Privacidad y revisión de Ronald aún pendiente.
- [MN-08](./MN-08-arquitectura-backend-integraciones.md): plan aprobado de implementación del backend; distingue código implementado de validación pendiente.
- [Contrato de API](../api/API_CONTRACT.md): contrato técnico del backend v1, aplicado por MN-08. Sus recursos, rutas y respuestas sirven de referencia para esta revisión.
- [README de la API](../../apps/api/README.md): estado actual de configuración, persistencia, tratamiento de audio y validación por plataforma.
- La [guía frontend](../api/FRONTEND_API_GUIDE.md) se basa en el contrato actual. `apps/web/`, `packages/contracts/` y `tests/` siguen reservados; eso no significa que el backend `apps/api/` esté vacío. ([AGENTS.md](../../AGENTS.md:11))

## Hechos comprobados

- Cada instalación mantiene un historial local en SQLite, sin cuentas de MeetingNotes ni sincronización. El acceso depende de la cuenta del sistema operativo. ([alcance v1](../decisions/MEETINGNOTES_V1_SCOPE.md:12))
- El historial aprobado contiene título, idioma elegido, resumen y pendientes. Se pueden editar título, resumen y pendientes; eliminar una reunión elimina todos sus pendientes. El historial no vence automáticamente. ([alcance v1](../decisions/MEETINGNOTES_V1_SCOPE.md:16))
- Los pendientes representan acciones explícitas. No se inventan responsables ni fechas; las fechas se conservan como se expresaron. ([alcance v1](../decisions/MEETINGNOTES_V1_SCOPE.md:21))
- El esquema SQL implementado define `captures`, `meetings`, `action_items` y `processing_staging`. `meetings.captureId` es único; no existe tabla `Transcript`. ([schema.ts](../../apps/api/src/db/schema.ts:7))
- `Meeting` guarda id, `captureId`, título, idioma, resumen y marcas de creación/actualización. `ActionItem` guarda tarea, responsable opcional y fecha textual opcional. `meetingDate` no forma parte del esquema ni del contrato vigente. ([schema.ts](../../apps/api/src/db/schema.ts:24), [contrato API](../api/API_CONTRACT.md:20))
- El backend mantiene la transcripción en memoria durante el procesamiento y no la persiste ni la expone. Puede guardar temporalmente en `processing_staging` el resumen y los pendientes generados para recuperación; ese resultado es interno y no incluye transcripción. ([service.ts](../../apps/api/src/service.ts:320), [repository.ts](../../apps/api/src/db/repository.ts:149), [decisiones técnicas, sección 9](../decisions/TECH_DESITIONS_MVP.md:166))
- Para archivos WAV mayores al límite por solicitud, el backend divide el audio en segmentos, transcribe cada segmento y concatena el texto. Esto no crea segmentos de transcripción con marcas de tiempo, una entidad de datos ni un recurso de API. ([wav.ts](../../apps/api/src/captures/wav.ts:41), [cliente OpenAI](../../apps/api/src/openai/openai-client.ts:19))
- Tras éxito se elimina el WAV y se publica la reunión; ante fallo del procesamiento se descarta el staging y se conserva el audio local para reintento o eliminación manual, sin vencimiento automático. ([service.ts](../../apps/api/src/service.ts:320), [README de la API](../../apps/api/README.md:23))
- El backend ya contiene configuración Drizzle/SQLite, migración SQL versionada y aplicación automática de migraciones al iniciar. Si una migración falla, la API no inicia. ([README de la API](../../apps/api/README.md:17), [migración](../../apps/api/drizzle/0000_initial_meetingnotes_schema.sql))
- El helper de macOS no se compiló ni ejecutó en el entorno documentado por incompatibilidad entre toolchain y SDK; la captura Windows requiere validación real en un equipo Windows. La ejecución de una migración en una base de usuario tampoco está registrada. ([README de la API](../../apps/api/README.md:27), [MN-08](./MN-08-arquitectura-backend-integraciones.md:137))

## Datos persistentes y transitorios en v1

| Recurso | Estado en la implementación | Contenido y límite aprobado |
|---|---|---|
| `Capture` | Persistente local | Estado, identificador, marcas de tiempo, idioma/título de solicitud, código de fallo y referencia privada al audio fallido. La ruta del archivo no se expone por API. |
| `Meeting` | Persistente local | Título, idioma elegido, resumen y marcas de tiempo; una reunión como máximo por `captureId`. No incluye transcripción ni `meetingDate`. |
| `ActionItem` | Persistente local | Tarea, responsable opcional y fecha textual opcional; se elimina junto con la reunión. |
| `processing_staging` | Temporal, interno | Resumen y pendientes estructurados mientras se confirma el borrado del audio y se finaliza la transacción. No incluye transcripción, prompt ni respuesta cruda de OpenAI. |
| Transcripción | Transitoria en memoria | Se usa para generar notas; no se guarda en SQLite, no se expone por API y se descarta al terminar o fallar. |
| WAV | Archivo local | Se borra al completar con éxito; si falla el procesamiento, permanece hasta reintento exitoso o eliminación manual. |
| Segmentos de audio para transcribir | Transitorios | Se crean cuando el tamaño del WAV requiere dividir la solicitud. No son segmentos temporizados de transcripción ni datos del historial. |

## Decisiones aprobadas que este borrador no reabre

- **SQLite:** es el destino local aprobado para cada computadora. MN-08 adopta `bun:sqlite`, `drizzle-orm/bun-sqlite`, rutas de datos por sistema operativo y migraciones SQL versionadas aplicadas antes de aceptar solicitudes. No se compara como si el motor siguiera sin decidirse. ([AGENTS.md](../../AGENTS.md:27), [decisiones técnicas, sección 3](../decisions/TECH_DESITIONS_MVP.md:42))
- **PostgreSQL:** no es una opción de selección para v1. No se despliega PostgreSQL ni se cambia el destino local aprobado mediante MN-10; una revisión futura requeriría alcance y plan técnico separados.
- **Transcripciones:** no se guardan ni se exponen en v1. No se propone tabla, endpoint, caché durable ni copia en logs.
- **`meetingDate`:** está excluido del contrato de v1. ([decisiones técnicas, sección 7](../decisions/TECH_DESITIONS_MVP.md:131))
- **`keyPoints`, `decisions` y `followUp`:** no son categorías aprobadas de v1; el modelo actual se limita a resumen y pendientes. Añadirlas requeriría aprobación de una ampliación del alcance.
- **Capturas y procesamiento:** `POST /api/meetings` inicia el proceso asíncrono con HTTP 202; el estado se consulta por `captureId`, la unicidad local depende de ese id y el resultado temporal de notas permanece oculto a la API. ([decisiones técnicas, sección 9](../decisions/TECH_DESITIONS_MVP.md:161))

## Pendientes reales

### Revisión y validación

1. **Ronald:** registrar su revisión del tratamiento ante objeción o retiro del consentimiento. No atribuirle aprobación mientras siga pendiente. ([decisiones técnicas, sección 8](../decisions/TECH_DESITIONS_MVP.md:157))
2. **macOS:** completar compilación y ejecución del helper con permisos de captura en un equipo compatible.
3. **Windows:** verificar el helper WASAPI en un equipo Windows; una revisión en macOS no acredita su funcionamiento.
4. **Migración:** verificar su aplicación en una base de usuario o instalación de prueba antes de declarar validada esa ruta operativa.

### Detalles técnicos aún abiertos

- Permisos concretos y protección de los archivos de base de datos, audio fallido y credenciales por sistema operativo.
- Tratamiento de fallos de filesystem fuera del caso de borrado del audio después de generar las notas.
- Comportamiento operativo de logs y copias, sin crear transcripciones, respaldos ni retención adicional.

Estos pendientes no reabren el alcance de producto, el motor SQLite ni el contrato ya aplicado. Los pendientes de revisión y validación tampoco convierten `apps/api/` en una propuesta no implementada.

## Elementos fuera del contrato vigente

- Los segmentos de transcripción con marcas de tiempo, etiquetas de hablante, acceso posterior a la transcripción o persistencia de esta no forman parte del modelo ni de la API de v1. Una propuesta futura requeriría revisar el tratamiento y obtener aprobación antes de implementar o retener esos datos.
- Las categorías adicionales de notas (`keyPoints`, `decisions`, `followUp`) y `meetingDate` no se deben incorporar por inferencia.
- No se incorpora PostgreSQL, nube, cuentas, sincronización, cifrado propio ni respaldos automáticos.

## Alcance de esta revisión

**Incluye:** contrastar el esquema y el contrato API implementados con el alcance; describir datos persistentes y transitorios; verificar conceptualmente ciclo de vida, edición y eliminación; identificar pendientes reales; y separar futuras propuestas de v1.

**Excluye:** cambiar el esquema, crear migraciones o endpoints, ejecutar pruebas o migraciones, guardar o mostrar transcripciones, cambiar proveedores, añadir campos no aprobados o seleccionar un motor distinto de SQLite.

## Criterios de aceptación verificables

1. El documento distingue el esquema realmente implementado de los datos aprobados que no se implementan como entidades independientes.
2. El modelo vigente cubre reuniones, pendientes, capturas y staging temporal de notas, sin tabla ni endpoint de transcripción.
3. Se mantienen las reglas aprobadas de borrado y conservación de audio y la ausencia de vencimiento automático.
4. `meetingDate` y las categorías adicionales de notas se identifican como excluidos de v1; PostgreSQL queda fuera de la selección vigente.
5. Se reflejan las decisiones SQLite/Drizzle/migraciones ya adoptadas sin presentarlas como pendientes de diseño.
6. Se registran como pendientes la revisión de Ronald, la validación de helpers macOS/Windows, la aplicación de migración en una base de usuario y los detalles de permisos/filesystem que siguen abiertos.
7. La revisión es documental y no modifica API, datos, dependencias ni código.

## Secuencia de trabajo

1. Contrastar el alcance y las decisiones técnicas vigentes con el contrato API, el esquema SQL y el repositorio de datos actuales.
2. Registrar cualquier diferencia entre el contrato documental y el código sin tratar como pendiente una decisión ya adoptada.
3. Mantener fuera de v1 las transcripciones persistentes, los segmentos temporizados, las categorías adicionales, `meetingDate` y PostgreSQL.
4. Registrar el estado de revisión de Ronald y de validación por plataforma y migración.
5. Someter este borrador a revisión humana; cualquier cambio funcional o de tratamiento requiere una revisión de alcance separada.

## Validación

La validación de MN-10 es documental: comprobar que los recursos descritos coinciden con el esquema, contrato, migración y servicio actuales; confirmar las reglas de retención; y verificar que los pendientes no reabren decisiones ya aprobadas. No se ejecutan pruebas, migraciones ni comandos de producto como parte de esta revisión, conforme a las instrucciones del repositorio.

## Reversión

Este borrador no cambia software ni datos, por lo que no requiere reversión técnica. Cualquier futura modificación de esquema o migración necesitará un plan separado que considere compatibilidad, fallos de filesystem y el historial local, sin prometer copias o recuperación no aprobadas.

## Decisiones para revisión humana

- Revisar este resumen del modelo implementado y confirmar que las referencias documentales están correctas.
- Registrar la disposición de Ronald sobre objeción o retiro del consentimiento.
- Completar la validación real de los helpers de macOS y Windows y la verificación de migración en una base de usuario.
- Resolver los detalles aún abiertos de permisos, protección de archivos y fallos de filesystem conforme al plan técnico correspondiente.
- Aprobar por separado cualquier cambio futuro que incorpore transcripciones, categorías adicionales, otro motor, almacenamiento remoto o mayor retención.
