# MN-10 | Definir el modelo de datos de reuniones, transcripciones y notas

**Estado:** Borrador para revisión humana; no aprobado.  
**Objetivo:** proponer el contrato de datos de v1 para reuniones, segmentos de transcripción y notas estructuradas, además de comparar las consecuencias de SQLite y PostgreSQL dentro de la base Drizzle + SQL.  
**Resultado esperado:** esquema conceptual y contrato de API propuestos, con acceso, ciclo de vida, eliminación, migraciones y decisiones pendientes claramente separados de las reglas aprobadas.

> Este borrador es documental. No implementa esquemas ni API, no modifica la política aprobada de datos y no autoriza persistir transcripciones, adoptar PostgreSQL ni ampliar el alcance de v1.

## Condición de inicio y autoridad

La condición del ticket se considera satisfecha para preparar esta propuesta documental: el alcance aprobado incluye el método de audio y transcripción y especifica el tratamiento local de resultados. Esto no afirma que se hayan realizado revisiones adicionales ni autoriza cambios respecto de ese alcance.

| Requisito previo | Evidencia actual | Estado para MN-10 |
|---|---|---|
| Alcance de producto aprobado | El scope se identifica como aprobado el 24 de noviembre de 2026 ([scope, líneas 1–4](../MEETINGNOTES_V1_SCOPE.md)). | Satisfecho. |
| Método de audio y transcripción aprobado | El scope define captura combinada y envío a OpenAI para transcribir y preparar notas ([scope, líneas 10–16 y 32–36](../MEETINGNOTES_V1_SCOPE.md)). | Satisfecho como regla de producto; modelos e integración concreta siguen pendientes ([AGENTS.md, líneas 26–27 y 50–51](../../AGENTS.md)). |
| Requisitos de retención aprobados | El scope especifica qué ocurre con audio y transcripción tras éxito o fallo, y excluye retención del historial de reuniones ([scope, líneas 23–30 y 45–51](../MEETINGNOTES_V1_SCOPE.md)). | Satisfecho para las reglas descritas; no se propondrá otra retención. |

MN-05, MN-08 y MN-09 todavía aparecen como borradores no aprobados. MN-05 solicita registrar revisiones y aprobaciones adicionales, y el repositorio no acredita que se hayan realizado ([MN-05, líneas 3, 63–67](./MN-05-privacidad-seguridad-ciclo-vida-datos.md)). Esto se registra como una brecha de evidencia de esas revisiones, no como una revocación del estado vigente del scope ni como aprobación implícita de cambios al tratamiento.

## Fuentes y autoridad

- [AGENTS.md](../../AGENTS.md): instrucciones vigentes. Declara aprobado el comportamiento de v1, limita cualquier ampliación y aprueba Drizzle + SQL con SQLite local por computadora; la integración concreta de SQLite permanece abierta ([líneas 5–7, 22–31 y 48–58](../../AGENTS.md)).
- [Scope de v1](../MEETINGNOTES_V1_SCOPE.md): alcance de producto aprobado. Es la fuente normativa para los datos que se guardan y el ciclo de vida descrito en este plan.
- [Contrato de API](../api/API_CONTRACT.md): propuesta técnica, no implementada ni aprobada como contrato final. Propone `Meeting`, `ActionItem`, un registro local de `Capture` y rutas para consulta, edición y eliminación ([secciones 1–4](../api/API_CONTRACT.md)).
- [Guía frontend](../FRONTEND_API_GUIDE.md): guía basada en la propuesta de API; sus tipos y rutas siguen sujetos a coordinación con backend.
- [README](../../README.md): confirma que no hay aplicación integrada, manifiesto raíz ni suite de pruebas de producto ([líneas 5–9, 23–46 y 71–73](../../README.md)).
- [MN-05](./MN-05-privacidad-seguridad-ciclo-vida-datos.md), [MN-08](./MN-08-arquitectura-backend-integraciones.md) y [MN-09](./MN-09-evaluacion-captura-audio-transcripcion.md): borradores, útiles para localizar preguntas y discrepancias, pero no decisiones aprobadas. Por ejemplo, MN-08 aún describe SQLite y el proveedor como pendientes ([líneas 27–42](./MN-08-arquitectura-backend-integraciones.md)) y propone comparar SQLite con PostgreSQL sin seleccionar ([línea 75](./MN-08-arquitectura-backend-integraciones.md)); esa descripción no reemplaza el estado vigente de `AGENTS.md`.
- MN-05 indica que no se encontró una plantilla aprobada para planes ([MN-05, línea 18](./MN-05-privacidad-seguridad-ciclo-vida-datos.md)). Se sigue el destino y formato de los planes existentes sin declararlos plantilla normativa.

## Hechos comprobados

- Cada instalación tendrá historial local en SQLite, sin cuentas ni sincronización; el acceso depende de la cuenta del sistema operativo ([scope, líneas 12 y 17–19](../MEETINGNOTES_V1_SCOPE.md)).
- El scope permite guardar título, idioma elegido, resumen y pendientes. Se pueden editar título, resumen y pendientes, y eliminar una reunión junto con sus pendientes. El historial no vence automáticamente ([scope, líneas 16–21 y 45–51](../MEETINGNOTES_V1_SCOPE.md)).
- Las tareas deben representar compromisos explícitos. Responsables y fechas solo se incluyen si se mencionan; no se deben inventar compromisos ni asignaciones ([scope, línea 21](../MEETINGNOTES_V1_SCOPE.md)).
- Al terminar correctamente, se guardan los resultados y se eliminan las copias locales de audio y transcripción. Si falla el procesamiento, se descarta la transcripción y el audio permanece local hasta reintento o eliminación manual, sin vencimiento automático ([scope, líneas 23–30](../MEETINGNOTES_V1_SCOPE.md)).
- No se conserva la transcripción en el historial y no se contempla guardar transcripciones como resultado persistente ([scope, líneas 30 y 49](../MEETINGNOTES_V1_SCOPE.md)).
- El stack aprobado es Drizzle + SQL con SQLite local; la integración concreta de SQLite está pendiente. OpenAI está aprobado como proveedor, pero los modelos y la integración concreta siguen pendientes ([AGENTS.md, líneas 26–27 y 50–52](../../AGENTS.md)).
- El contrato actual propone una entidad persistente `Meeting` con resumen y `ActionItem[]`, sin entidad `Transcript`; sus rutas, campos opcionales y semántica siguen siendo propuestas ([API_CONTRACT.md, líneas 20–57 y 144–230](../api/API_CONTRACT.md)).
- `apps/api/`, `packages/contracts/` y `tests/` son espacios reservados, sin implementación integrada. Los POCs tienen configuraciones independientes y no son la arquitectura aprobada ([AGENTS.md, líneas 11–15](../../AGENTS.md); [README, líneas 23–46](../../README.md)).

## Supuestos de trabajo

- Los segmentos con marcas de tiempo se analizarán como una estructura transitoria del procesamiento, sin tabla, endpoint de lectura ni conservación en el historial. Motivo: el ticket pide modelar segmentos, mientras el scope excluye la retención de transcripciones. Si se requiere almacenamiento o consulta posterior, cambiaría el tratamiento aprobado y debe solicitarse aprobación antes de incorporarlo.
- “Puntos clave”, “decisiones” y “seguimiento” son campos candidatos solicitados por MN-10, no requisitos ya aprobados de v1. El scope aprobado solo exige resumen y pendientes. Si se quieren persistir o mostrar estas categorías, se debe aprobar la ampliación del alcance.
- El contrato de API final puede conservar la forma de recursos existente o cambiarla tras revisión; la existencia de `API_CONTRACT.md` no la convierte en un contrato de implementación.

## Preguntas abiertas

### Antes de cerrar el contrato propuesto

1. ¿“Puntos clave”, “decisiones” y “seguimiento” se solicitan como ampliación funcional de v1 o solo como categorías para evaluar? El scope no los incluye; depende de aprobación de producto antes de añadirlos a una respuesta o persistencia.
2. ¿Los segmentos y sus marcas de tiempo solo deben existir durante el procesamiento? Si se solicita acceso después de procesar o guardado local, se necesita aprobar expresamente ese tratamiento y actualizar el scope.
3. ¿Qué unidad, precisión y convención de límites deben usar las marcas de tiempo (por ejemplo, inicio y fin relativos a la grabación)? El repositorio no lo define; el tipo del contrato depende de esa decisión.
4. ¿Se necesitan etiquetas de hablante? No aparecen en el scope ni en la propuesta API y no deben añadirse por inferencia.
5. ¿Se conserva `meetingDate`, que aparece como campo candidato en la propuesta API pero no es requisito del scope? ¿Qué semántica de edición tendría?

### Decisiones técnicas pendientes

6. ¿Cómo se concreta el adaptador de SQLite dentro de Drizzle + SQL y dónde se ubica/protege el archivo local? SQLite es el destino de producto aprobado; su integración y detalles de protección siguen abiertos ([AGENTS.md, línea 26 y 52](../../AGENTS.md)).
7. ¿Qué consecuencias operativas y de despliegue se aceptan al comparar PostgreSQL con el modelo local por computadora? PostgreSQL no está aprobado para v1; adoptarlo requeriría aprobación y revisión de alcance/topología. No se decidirá aquí.
8. ¿Qué controles concretos del sistema operativo se requieren para el acceso a base de datos y archivos de audio fallidos? El requisito de acceso por cuenta del sistema operativo está aprobado; permisos y protección concreta no están especificados.
9. ¿Qué estrategia de migración, compatibilidad y recuperación se requiere para bases ya existentes? No hay migraciones ni un producto integrado en el árbol actual; tampoco hay permiso para asumir respaldos o retención adicionales.
10. ¿La revisión de privacidad pendiente que MN-05 solicita es un requisito adicional antes de implementar cambios en este contrato? Su estado no está acreditado; la respuesta no cambia el contenido ya aprobado del scope y debe distinguirse de una aprobación de implementación.

## Alcance

**Incluye:** proponer un esquema conceptual para los datos persistentes aprobados; especificar por separado el contrato transitorio candidato para segmentos; identificar las ampliaciones de notas que requieren aprobación; revisar rutas de lectura, edición y eliminación en la propuesta de API; comparar SQLite con PostgreSQL sin seleccionar un nuevo motor; y documentar acceso, retención, borrado y migraciones como reglas o decisiones pendientes.

**Excluye:** implementar tablas, migraciones, validación o endpoints; persistir o exponer transcripciones; aumentar retención; agregar cuentas, nube o sincronización; cambiar la captura o los proveedores; integrar los POCs; o declarar aprobado el contrato de API.

## Criterios de aceptación verificables

1. El borrador distingue cada campo persistente aprobado de los campos propuestos y de los que requieren ampliar el alcance.
2. El esquema describe metadatos de reunión, la relación con tareas y un contrato candidato de segmentos con marcas de tiempo, dejando explícitos unidad y semántica si aún no se acuerdan.
3. El contrato API propuesto identifica operaciones de consulta, edición y eliminación; no devuelve ni persiste transcripciones bajo las reglas vigentes del scope.
4. La comparación SQLite/PostgreSQL expone ajuste al producto local, consecuencias operativas y aprobaciones necesarias sin declarar adoptado un motor nuevo. Reconoce que SQLite ya figura como destino de producto aprobado y que su integración concreta sigue pendiente.
5. Acceso, retención y eliminación se trazan al scope; cualquier control operativo no definido queda como pregunta y no se introduce una retención nueva.
6. La estrategia de migración enumera compatibilidad y riesgos de datos sin prometer reversión, copias o recuperación que el repositorio no haya definido.
7. Las afirmaciones de aprobación se vinculan a fuentes vigentes; los planes no aprobados y los POCs no se presentan como autoridad.

Estos criterios describen el resultado esperado del trabajo MN-10; no se consideran satisfechos por la creación de este plan.

## Estado y patrones actuales

- No hay modelo de datos, API ni migraciones de producto implementadas. Los directorios de producto están reservados ([AGENTS.md, líneas 11–15](../../AGENTS.md)).
- La propuesta de API ya aporta un punto de partida para `Meeting` y `ActionItem`, además del flujo de capturas fallidas; la guía frontend reproduce esos tipos como propuestas ([API_CONTRACT.md, secciones 2–3](../api/API_CONTRACT.md); [guía frontend, “Payloads y tipos propuestos”](../FRONTEND_API_GUIDE.md)).
- El contrato actual expresa marcas de tiempo RFC 3339 para creación/actualización y una fecha de reunión opcional, pero no define segmentos temporizados de transcripción ([API_CONTRACT.md, sección 2.1](../api/API_CONTRACT.md)).
- No se observaron archivos de migración, configuración de Drizzle o esquema SQL del producto en los directorios reservados. Los manifiestos de los POCs no constituyen configuración de producto.

## Impacto por componente

| Componente existente | Responsabilidad / estado | Cambio previsto si se aprueba el contrato |
|---|---|---|
| `docs/MEETINGNOTES_V1_SCOPE.md` | Fuente de reglas de producto aprobadas. | Sin cambio por este plan. Solo se actualizaría si se aprueba una ampliación como persistir nuevas categorías de notas o transcripciones. |
| `docs/api/API_CONTRACT.md` | Propuesta técnica de API. | Candidato a documentar el esquema, el payload y la eliminación tras revisión humana; no editar como consecuencia automática de este borrador. |
| `docs/FRONTEND_API_GUIDE.md` | Guía de trabajo basada en la API propuesta. | Alinear tipos y operaciones únicamente después de acordar el contrato. |
| `apps/api/`, `packages/contracts/`, `tests/` | Espacios reservados sin producto integrado. | Posibles ubicaciones futuras, sujetas al plan técnico aprobado; este plan no inventa archivos ni estructura. |
| POCs en `apps/prototypes/` | Experimentos con manifiestos y lockfiles separados. | Sin integración ni cambios previstos. |

## Contratos y datos propuestos

### Persistencia aprobada como base

La siguiente forma conserva el mínimo expresamente requerido por el scope y reutiliza, como propuesta, los nombres del contrato API actual. No fija tipos SQL, índices, restricciones, claves físicas ni reglas de migración.

| Recurso/campo | Propuesta conceptual | Estado / notas |
|---|---|---|
| `Meeting` | `id`, `title`, `outputLanguage`, `summary`, `createdAt`, `updatedAt` | Persistencia de título, idioma, resumen y pendientes se deriva del scope. Las marcas de tiempo y el formato de ID son detalles de contrato por revisar. |
| `Meeting.actionItems` | Colección de tareas vinculadas a la reunión | El scope exige pendientes editables y borrado junto con la reunión. |
| `ActionItem` | `id`, `meetingId`, `task`, `assignee`, `dueDateText` | Coincide con la propuesta API; tarea explícita, responsable/fecha opcionales y fecha conservada como se dijo ([API_CONTRACT.md, sección 2.2](../api/API_CONTRACT.md)). |
| `meetingDate` | Campo opcional candidato | No requerido en el scope; mantener fuera del contrato final hasta resolver la pregunta 5. |

### Categorías de nota solicitadas, pendientes de aprobación

El ticket menciona `keyPoints`, `decisions` y `followUp`. Se pueden representar como colecciones asociadas a la reunión en una alternativa de contrato, pero el tipo, cardinalidad, edición y generación no se fijan en este borrador. No deben persistirse ni añadirse al alcance de v1 hasta resolver la pregunta 1. `summary` y `actionItems` sí corresponden a las reglas aprobadas existentes.

### Segmentos y marcas de tiempo de transcripción

Contrato interno transitorio candidato, pendiente de decidir unidad y límites:

| Elemento | Contenido candidato | Restricción |
|---|---|---|
| Segmento | texto reconocido, tiempo inicial y tiempo final relativos al audio | No persistir en el historial ni exponer en la API de reuniones bajo el scope vigente. Unidad, precisión y reglas para segmentos vacíos o superpuestos quedan abiertas. |

No se propone tabla `Transcript`, endpoint de consulta de transcripción, caché durable ni inclusión en registros. El scope dispone que la copia local de transcripción se borre tras éxito y se descarte si falla el procesamiento. Cualquier retención adicional requiere aprobación antes de cambiar el contrato.

### API candidata

Partir de las operaciones ya propuestas en `API_CONTRACT.md`: crear/procesar reunión, listar y consultar reuniones, editar título/resumen y tareas, y eliminar una reunión con sus tareas. Mantener el borrado manual de audio fallido mediante la operación de captura existente. El contrato final debe hacer explícito que borrar una reunión elimina sus tareas y que no hay vencimiento automático. No agregar una operación de transcripción. Las rutas, códigos, paginación, idempotencia y errores siguen sin aprobación ([API_CONTRACT.md, secciones 3–4](../api/API_CONTRACT.md)).

### SQLite y PostgreSQL

| Opción | Evidencia y ajuste al alcance | Consecuencia que debe documentarse | Estado |
|---|---|---|---|
| SQLite | El scope y `AGENTS.md` fijan historial local en SQLite por computadora. | Concretar integración de Drizzle, ubicación/protección del archivo, acceso y ciclo de migración. No hay configuración de producto observada. | Destino de producto aprobado; integración técnica abierta. |
| PostgreSQL | La base autorizada es Drizzle + SQL, pero PostgreSQL no aparece como destino aprobado de v1. El producto excluye nube y sincronización. | Evaluar cómo cambiarían distribución, ejecución del servicio, conexiones, acceso local y migraciones; no asumir que mejora rendimiento sin carga medida. Su adopción alteraría decisiones técnicas y posiblemente el alcance operativo. | Alternativa de comparación; no seleccionada ni aprobada. |

La comparación debe considerar la aplicación local por computadora, operación sin cuentas de MeetingNotes, migración y costo de soporte. Este borrador no elige ni cambia el destino aprobado por el scope.

### Acceso, retención y eliminación

- **Acceso aprobado:** depende de la cuenta del sistema operativo; no habrá login de MeetingNotes ([scope, líneas 17–19](../MEETINGNOTES_V1_SCOPE.md)). Los permisos concretos del archivo de base de datos y los archivos de audio fallidos siguen abiertos.
- **Retención aprobada:** reuniones no vencen automáticamente; las transcripciones no forman parte del historial; audio fallido se mantiene hasta reintento o eliminación manual ([scope, líneas 27–30 y 45–50](../MEETINGNOTES_V1_SCOPE.md)).
- **Eliminación aprobada:** eliminar reunión elimina pendientes; al completar procesamiento se borra el audio y la transcripción local; eliminar una captura fallida elimina audio local. La propuesta API refleja reuniones y pendientes, y capturas fallidas como operaciones separadas ([API_CONTRACT.md, líneas 136–141 y 228–232](../api/API_CONTRACT.md)).
- **Detalles pendientes:** tratamiento de temporales, logs, copias, cachés y fallos de borrado. No se debe introducir respaldo, exportación, retención o vencimiento automáticos por inferencia.

### Migraciones

No hay migraciones de producto ni un flujo Drizzle configurado en el árbol revisado. El plan de implementación posterior deberá definir versionado de esquema, momento de aplicación, compatibilidad entre versiones, transacciones según el motor elegido y respuesta ante migración fallida. También deberá tratar cambios destructivos como riesgo de pérdida de historial y decidir una estrategia compatible con la retención aprobada. No se define un comando, tabla de migraciones, política de copias ni mecanismo de rollback en este borrador.

## Dependencias

Drizzle + SQL y Zod están en el stack aprobado ([AGENTS.md, líneas 22–28](../../AGENTS.md)). No se propone añadir dependencias. El driver/adaptador de SQLite, las versiones de Drizzle y cualquier integración para PostgreSQL quedan sujetos al plan técnico y aprobaciones correspondientes; no se agregan al repositorio.

## Riesgos y alternativas

- **Persistencia accidental de transcripción:** una tabla, log o respuesta de API podría prolongar retención. Mitigación por evaluar: limitar el contrato persistente a reunión y pendientes y excluir texto de transcripción de respuestas/registros.
- **Ampliación funcional implícita:** puntos clave, decisiones y seguimiento añaden categorías que el scope no nombra. Mitigación: mantenerlas como alternativa hasta aprobación del alcance.
- **Ambigüedad temporal:** timestamps sin unidad, origen o límites generan resultados incompatibles. Mitigación: fijar convenciones antes de tipar el contrato final.
- **Alternativa de motor confundida con decisión aprobada:** PostgreSQL cambiaría necesidades de ejecución y acceso. Mitigación: reportarlo como comparación, sin seleccionar ni integrar.
- **Pérdida o exposición durante migraciones/eliminación:** no hay procedimiento existente para recuperar un historial local ni evidencia sobre logs/copias. Mitigación: definir esos límites antes de implementar cambios destructivos, sin suponer retención auxiliar.

Alternativas que puede revisar la persona aprobadora:

1. Mantener el esquema mínimo del scope: `Meeting` con resumen y `ActionItem`; segmentos solo durante el procesamiento y sin persistencia.
2. Añadir categorías estructuradas de puntos clave, decisiones y seguimiento tras aprobar una ampliación funcional.
3. Evaluar PostgreSQL frente al destino SQLite aprobado como cambio de arquitectura; no adoptarlo en este plan.
4. No modificar el contrato API hasta que se resuelvan las preguntas de persistencia, marcas de tiempo y motor.

## Secuencia de trabajo

1. Confirmar que el alcance, el método de procesamiento y las reglas de retención citadas representan la base de v1; resolver la discrepancia de revisiones MN-05 sin reabrir decisiones ya aprobadas por el scope.
2. Aprobar si las categorías adicionales de notas forman parte de v1.
3. Definir el contrato transitorio de segmentos y sus marcas de tiempo, conservando la regla actual de no persistir transcripciones.
4. Revisar el modelo conceptual de reuniones y tareas frente al contrato API y decidir los campos candidatos pendientes, incluido `meetingDate`.
5. Completar la matriz SQLite/PostgreSQL con consecuencias verificables para la aplicación local y solicitar aprobación si se propone cambiar el motor.
6. Documentar acceso, borrado, migraciones y errores de forma coherente con la retención vigente.
7. Someter el contrato y las decisiones pendientes a revisión humana. La actualización de `API_CONTRACT.md` y la implementación deben tratarse como pasos posteriores autorizados por separado.

## Validación

La validación de MN-10 será documental: comprobar cada campo contra el scope, clasificar persistencia/transitoriedad, recorrer operaciones de API y ciclo de vida, revisar que no se añada tratamiento y confirmar que SQLite/PostgreSQL se comparan sin atribuir aprobación no documentada. No se ejecutan comandos ni pruebas: no hay configuración de producto ni suite consolidada en la raíz ([AGENTS.md, líneas 33–35](../../AGENTS.md)).

## Reversión

Este borrador no cambia software ni datos, por lo que no requiere reversión técnica. Si una futura implementación introduce migraciones, el plan de implementación deberá describir compatibilidad, pérdida potencial de datos y respuesta ante fallos antes de aplicarlas. No se promete rollback seguro ni recuperación de bases locales sin definir y aprobar ese mecanismo.

## Decisiones para revisión humana

- Confirmar el alcance de categorías estructuradas: resumen y pendientes ya están aprobados; puntos clave, decisiones y seguimiento requieren decisión de producto.
- Confirmar que los segmentos temporizados solo se usan durante procesamiento y no se persisten ni exponen en v1; fijar unidad y semántica temporal.
- Mantener SQLite como destino de producto vigente y acordar la integración concreta, o aprobar expresamente cualquier cambio a PostgreSQL.
- Acordar cómo el acceso por cuenta del sistema operativo se aplica a la base de datos y a los archivos locales de fallos.
- Definir estrategia de migraciones y límites operativos de eliminación sin añadir retención no aprobada.
- Determinar si las revisiones adicionales documentadas por MN-05 son un requisito para la implementación técnica y registrar evidencia si se realizan.
- Aprobar el contrato API antes de actualizar su propuesta o iniciar implementación.
