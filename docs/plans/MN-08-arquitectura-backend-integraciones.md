# MN-08 | Implementar el backend local de MeetingNotes v1

**Estado:** Aprobado por Marco el 25 de noviembre de 2026.

**Objetivo:** convertir las decisiones vigentes de producto y tecnología en un plan verificable para implementar el backend local de v1.

**Resultado esperado:** backend integrado Bun + Hono para macOS y Windows, con captura local, procesamiento con OpenAI, persistencia SQLite y API alineada con el alcance aprobado.

**Prioridad solicitada:** completar el trabajo con urgencia; este plan no estima ni garantiza una fecha de entrega.

> Este plan queda aprobado para implementar el backend descrito dentro del alcance vigente. La actualización de MN-08 no implementa ni publica código. La captura, el envío a OpenAI y la retención local de audio siguen estrictamente las reglas del [alcance v1](../decisions/MEETINGNOTES_V1_SCOPE.md).

## Objetivo y resultado

Implementar el backend que soporta el flujo aprobado de v1: iniciar y detener la captura local del sistema y el micrófono en una sola pista, procesar una captura completa con OpenAI, guardar localmente la reunión y sus pendientes, y permitir consultar, editar, eliminar o reintentar según corresponda.

El backend será un proceso local separado con Bun + Hono, accesible solo en `127.0.0.1:4174`. Usará SQLite mediante `bun:sqlite` y Drizzle, helpers nativos de captura para macOS y Windows, Zod y las integraciones OpenAI adoptadas en el registro técnico. No se añade shell de escritorio, nube, cuentas ni sincronización.

## Autoridad, fuentes y discrepancias

| Fuente | Estado | Uso en este plan |
|---|---|---|
| [AGENTS.md](../../AGENTS.md) | Instrucción vigente del repo | Límites, stack base y requisito de aprobar un plan antes de cambios de código. Aún muestra varias decisiones como pendientes. |
| [Alcance de producto v1](../decisions/MEETINGNOTES_V1_SCOPE.md) | Aprobado | Autoridad para funciones, plataformas, datos, retención y límites de producto. |
| [Decisiones técnicas del MVP](../decisions/TECH_DESITIONS_MVP.md) | Registra decisiones adoptadas por la persona usuaria el 25 de noviembre de 2026 | Base técnica concreta para integración local, captura, SQLite, OpenAI, estados y recuperación. Indica que no sustituye la aprobación del plan de implementación. |
| [Contrato API](../api/API_CONTRACT.md) | Propuesta; no contrato final | Punto de partida que debe actualizarse antes de implementar las rutas y payloads. |
| [Guía frontend](../api/FRONTEND_API_GUIDE.md) | Guía basada en la propuesta API | Debe quedar alineada con el flujo asíncrono antes de integrar el cliente. |
| [MN-03](./MN-03-arquitectura-informacion.md) | Aprobado por Marco | Requisitos de consulta, edición, eliminación y lista de capturas fallidas. |
| [MN-04](./MN-04-wireframes.md) | Plan de wireframes aprobado; revisión de wireframes pendiente | Los wireframes no son un contrato técnico. Confirmar que la revisión no cambia el comportamiento de backend. |
| [MN-10](./MN-10-modelo-datos-reuniones-transcripciones-notas.md) | Borrador no aprobado | Evidencia de cuestiones abiertas en esquema, campos, migraciones y límites entre datos transitorios y persistentes. |
| [POC de captura](../../apps/prototypes/poc-record-audio/README.md) y [POC OpenAI](../../apps/prototypes/poc-openai-macos/README.md) | Experimentos separados | Evidencia técnica y de comportamiento; ninguno es una arquitectura de producto aprobada. |

**Discrepancia documental que debe resolverse antes de codificar:** `AGENTS.md` y `README.md` aún indican que el driver de SQLite, los modelos/configuración de OpenAI y varios detalles de operación local están pendientes. `TECH_DESITIONS_MVP.md` registra que esas decisiones fueron adoptadas. Antes del primer cambio de código, actualizar o aclarar esos documentos para que las instrucciones vigentes no contradigan la decisión más reciente. No cambiar el alcance aprobado.

**Estado de privacidad:** `TECH_DESITIONS_MVP.md`, sección 8, registra aprobación de Producto y Privacidad declarada por la persona usuaria, y mantiene pendiente la revisión de Ronald, incluido el tratamiento ante objeción o retiro del consentimiento. No atribuirle aprobación. No usar audio real para verificar el flujo hasta cumplir las aprobaciones y condiciones de privacidad aplicables.

No se encontró una plantilla de planes aprobada. Se conserva este archivo y el formato Markdown existente; eso no establece una plantilla normativa.

## Hechos comprobables

- El alcance exige aplicación local en macOS y Windows, historial SQLite, captura combinada, idioma es/en por reunión, consulta y edición de título/resumen/pendientes, eliminación manual y las reglas de retención de audio y transcripción del scope.
- Las decisiones técnicas adoptan API Bun + Hono en `127.0.0.1:4174`, helper Swift/Core Audio en macOS, helper Python/PyAudioWPatch/WASAPI en Windows, `bun:sqlite` + `drizzle-orm/bun-sqlite`, migraciones SQL versionadas, `gpt-transcribe` por REST con segmentos de 20 MiB y solapamiento breve, y AI SDK + OpenAI para notas estructuradas.
- El procesamiento debe correr en segundo plano con estado durable. El reintento es manual con el mismo `captureId`; no hay reintentos automáticos ni timeout propio por llamada. Al reiniciar, trabajos en `transcribing` o `summarizing` pasan a `failed`; la transcripción transitoria se descarta y el audio queda para reintento.
- Marco confirmó para esta implementación HTTP 202 en `POST /api/meetings`, sondeo por `GET /api/captures/{captureId}`, `meetingId` al completar, unicidad local por `captureId`, respuesta idempotente para solicitudes repetidas, staging temporal de notas nunca expuesto ni transcript y los orígenes exactos de SPA `http://127.0.0.1:5173` y `http://localhost:5173`. Estas aclaraciones están registradas en la sección 9 de `TECH_DESITIONS_MVP.md`.
- Los estados adoptados son `starting → capturing → stopping → ready → transcribing → summarizing → completed`, con `failed` ante error. Las capturas fallidas se listan con `limit=20` por defecto, cursor opaco y `failureCode`; los errores usan `{ error: { code, message } }` sanitizado.
- `meetingDate` y el borrado individual de un pendiente están excluidos por las decisiones técnicas. La transcripción no se persiste ni se expone.
- `apps/api/`, `packages/contracts/` y `tests/` contienen solo `.gitkeep`. No existe backend, esquema Drizzle, migración ni suite integrada de producto.
- Los dos POCs tienen manifiestos y lockfiles propios. El POC de captura persiste y expone WAVs de una manera incompatible con el ciclo de vida del producto; el POC OpenAI es solo macOS, usa estado en memoria y elimina audio ante fallo. Ambos requieren adaptación y no deben copiarse como producto sin aplicar las reglas de v1.
- `MN-03` está aprobado. `MN-04` aprueba preparar wireframes, pero la revisión de Ronald está pendiente. Esto no cambia los requisitos de datos del scope; cualquier cambio de comportamiento surgido de la revisión se debe evaluar antes de alterar el contrato.

## Supuestos de trabajo

| Supuesto | Motivo | Impacto si resulta falso / cómo confirmarlo |
|---|---|---|
| “Backend de v1” incluye los adaptadores de captura de ambas plataformas y todas las operaciones backend necesarias para guardar, editar, borrar y reintentar. | Es el alcance de v1 y las decisiones técnicas adoptadas describen ambos helpers. | Si “listo” significa un incremento menor, se debe recortar y aprobar el alcance del incremento antes de implementarlo. |
| La ubicación inicial del proceso API es `apps/api/`, hoy un espacio reservado. | El mapa del repositorio reserva ese directorio para la API. | Confirmarlo al aprobar el plan; no mover ni integrar los POCs completos. |
| No se crea workspace ni manifiesto raíz; API y web conservan procesos y manifiestos separados. | Decisión técnica del MVP. | Si la operación local requiere otra distribución, necesita decisión y aprobación adicionales. |

## Detalles abiertos antes de cerrar implementación

Las aclaraciones de API, unicidad, reintentos, staging de resultado y origen local ya fueron confirmadas por Marco y están registradas en `TECH_DESITIONS_MVP.md` §9. No se reabren durante la implementación.

1. **Modelo físico:** fijar tipos SQL y nullabilidad de Meeting, ActionItem, Capture y el resultado temporal; incluir la restricción única por `captureId`, sin persistir transcripción ni agregar `meetingDate` u otras categorías.
2. **Paginación y errores:** fijar orden estable del historial, forma opaca de cursor y catálogo estable de `failureCode` y errores por operación antes de cerrar los handlers.
3. **Operación del sistema de archivos:** implementar los resultados ante errores de lectura, creación de directorios, renombrado y permisos, sin exponer rutas ni declarar éxito si no se cumplió el ciclo aprobado.
4. **Validación en Windows:** identificar un equipo Windows para verificar el helper y el ciclo completo. La captura WASAPI no se puede declarar probada con una revisión solo en macOS.

## Alcance

### Incluido

- API local Hono en Bun en el host y puerto adoptados, con validación de entrada/salida Zod y errores sanitizados.
- Adaptación de la captura nativa aprobada para macOS y Windows. Se requieren ambas fuentes; si una falla, no se acepta audio parcial. Solo una captura confirmada completa se procesa.
- Persistencia local SQLite mediante Drizzle y migraciones SQL versionadas aplicadas antes de aceptar solicitudes.
- Integración de transcripción con `gpt-transcribe` por REST y generación estructurada de resumen/pendientes con AI SDK, Zod, idioma de reunión y configuración acordada.
- Estados durables de captura y procesamiento, reintento manual, recuperación al reiniciar, lista paginada de fallidas y eliminación manual del audio fallido.
- Operaciones de consulta, edición y eliminación de reuniones y pendientes dentro de los límites aprobados.
- Aplicar el ciclo de vida del scope: al éxito conservar reunión y pendientes y borrar audio/transcripción locales; ante fallo de procesamiento descartar transcripción y conservar el audio sin vencimiento automático hasta reintento o eliminación manual.
- Alinear `API_CONTRACT.md` y `FRONTEND_API_GUIDE.md` con las decisiones adoptadas antes de integrar clientes.

### Excluido

- Construir o rediseñar la interfaz web completa, un shell de escritorio, instalador o mecanismo empaquetado de arranque.
- Cuentas de MeetingNotes, inicio de sesión, nube, SSO, sincronización entre computadoras o proveedores distintos de OpenAI.
- Guardar/exponer transcripciones, eliminar automáticamente audio fallido o reuniones, guardar audio de éxito, añadir respaldos automáticos o cifrado propio.
- `meetingDate`, eliminación individual de `ActionItem`, marcar pendientes como completados o categorías adicionales de notas.
- Integrar los POCs como aplicaciones completas o copiar su tratamiento de WAVs, estado en memoria o limpieza de error.
- Publicar, crear remoto de GitHub o desplegar el backend.

## Contratos, datos y límites externos

| Elemento | Base adoptada | Trabajo previo a implementación |
|---|---|---|
| `Meeting` y `ActionItem` | Título, idioma, resumen y pendientes editables; borrar una reunión borra sus pendientes. | Cerrar esquema SQL y validaciones sin añadir campos fuera del scope. |
| `Capture` | `captureId` opaco; referencia de archivo solo privada al backend; estados y recuperación durables. | Definir almacenamiento de metadata y transiciones inválidas/concurrentes. |
| Capturas fallidas | `{ items, nextCursor }`, `limit=20` inicial, cursor opaco; elementos con `captureId`, estado, fechas y `failureCode`. | Alinear el contrato y definir catálogo estable de códigos. No incluir ruta, audio, transcripción ni error interno de proveedor. |
| Procesamiento | Segundo plano, idioma es/en, mismo `captureId` en reintento manual, sin timeout ni reintentos automáticos. | Cerrar la forma HTTP de inicio/consulta/resultado y sus respuestas de conflicto. |
| OpenAI | Transcripción por endpoint de audio; notas con generación estructurada y `store: false`; credencial solo en servidor. | Validar esquema Zod; evitar logs de clave, audio, transcripción, prompts y contenido de reunión. |
| Datos locales | Rutas macOS/Windows y directorio `failed-audio/` definidos en decisiones técnicas. | Resolver fallos parciales del sistema de archivos y permisos concretos sin cambiar retención ni crear backups. |

El contrato actual conserva `meetingDate`, usa `processing` y describe procesamiento síncrono. Esos puntos son discrepancias documentales, no decisiones que deban sobrevivir a la implementación. El contrato y la guía frontend deberán cambiar juntos una vez acordada la semántica asíncrona.

## Componentes afectados

| Componente actual | Estado y evidencia | Cambio previsto |
|---|---|---|
| `apps/api/` | Solo `.gitkeep`; reservado para API de producto. | Implementar proceso API, configuración local, casos de uso, adaptadores, persistencia y rutas. La estructura interna se definirá después de aprobar los límites del plan. |
| `packages/contracts/` | Solo `.gitkeep`; no hay decisión de workspace o contrato compartido implementado. | Decidir en la etapa de contrato si se usa para tipos compartidos o se mantienen contratos por proceso; no asumir importaciones/estructura por inferencia. |
| `tests/` | Solo `.gitkeep`; no hay suite integrada. | Añadir la validación aprobada que necesite el backend, sin afirmar que existe infraestructura ni agregar dependencias nuevas sin aprobación. |
| POC de captura | Código Bun/Hono y helpers Swift/Python independientes. | Referencia para el protocolo helper/API; adaptación selectiva de captura al flujo durable y privado de v1. |
| POC OpenAI | Código Bun con flujo macOS, transcripción y notas en memoria. | Referencia para formato de audio/OpenAI; adaptación necesaria para persistencia, estados, retención y AI SDK adoptado. |
| `docs/api/API_CONTRACT.md` y `docs/api/FRONTEND_API_GUIDE.md` | Propuestas desalineadas con el procesamiento asíncrono adoptado. | Alinear contrato, estados, reintentos, respuesta y sondeo antes de implementar clientes. |
| `AGENTS.md` y `README.md` | Aún marcan como pendientes varias decisiones registradas como adoptadas. | Corregir la discrepancia de autoridad y rutas de documentación antes del primer cambio de código; no ampliar el scope. |

## Dependencias

- Tecnologías adoptadas: Bun + Hono; Drizzle + SQL con SQLite local por computadora; `bun:sqlite` y `drizzle-orm/bun-sqlite`; Vercel AI SDK + Zod; OpenAI como proveedor.
- Decisiones técnicas registran `gpt-transcribe` para transcripción, `ai` + `@ai-sdk/openai` y `gpt-6.2-sol` para notas, además de versiones concretas. Se usarán según el registro aprobado, sujeto a resolver la discrepancia documental antes de codificar.
- No se propone tecnología ni dependencia nueva. Los POCs tienen lockfiles independientes y no autorizan crear un workspace raíz.
- La clave OpenAI se configura solo en el servidor por el mecanismo local documentado en las decisiones; no se copia al navegador ni se incluye en el repositorio.

## Alternativas relevantes

| Tema | Evidencia / alternativa | Estado para este plan |
|---|---|---|
| Procesamiento síncrono o asíncrono | `API_CONTRACT.md` propone esperar la respuesta completa; `TECH_DESITIONS_MVP.md` adopta procesamiento en segundo plano durable. | La decisión adoptada es background. Se debe actualizar contrato y guía; la semántica HTTP precisa queda abierta en la pregunta 1. |
| Estado de trabajo | Sondeo de la captura existente frente a un recurso de operación separado. | La decisión técnica requiere que la interfaz consulte estado; la forma del recurso no está adoptada. Comparar y acordar antes de implementar. |
| POCs | Mantenerlos aislados frente a adaptar su captura y flujo OpenAI al producto. | El plan permite adaptación selectiva bajo las decisiones adoptadas; no convierte ninguno en arquitectura completa ni cambia sus directorios. |
| Base de datos/proveedor | SQLite local y OpenAI frente a otros destinos. | SQLite y OpenAI están adoptados para v1; no se reabren ni se comparan alternativas fuera del alcance. |

## Secuencia de implementación propuesta

1. **Aprobar este plan** y registrar cualquier recorte del objetivo “backend v1”. No tocar código antes de esa aprobación.
2. **Alinear autoridad y documentos:** reconciliar `AGENTS.md`/`README.md` con las decisiones adoptadas y corregir enlaces a `MEETINGNOTES_V1_SCOPE.md`; las revisiones UX/privacidad no cambian el alcance de backend.
3. **Aplicar el contrato ya acordado:** reflejar en API y guía el 202, sondeo por `captureId`, `meetingId`, idempotencia, orígenes permitidos y staging. Cerrar los detalles físicos del esquema, cursores y errores antes de rutas y migraciones; no añadir campos excluidos.
4. **Preparar la aplicación API:** crear manifiesto/lockfile propios de `apps/api/` según el patrón aprobado, inicializar Hono y validar el host/puerto local, configuración de OpenAI y el límite de origen local.
5. **Crear persistencia durable:** definir esquema Drizzle y migraciones SQL; preparar rutas locales por sistema operativo; aplicar migraciones antes de escuchar y fallar el arranque si una migración no puede aplicarse.
6. **Integrar la captura:** implementar estados y protocolo con helper por plataforma; manejar permisos, salida inesperada, audio incompleto y errores sin aceptar mezcla parcial. Confirmar `ready` solo tras validar el WAV completo.
7. **Implementar procesamiento durable:** orquestar la transcripción en segmentos de 20 MiB con solapamiento breve, generación estructurada, validación Zod, creación de reunión única por captura, limpieza al éxito y conservación de audio al fallo.
8. **Completar operaciones API:** salud, captura/status/stop, proceso y consulta de estado, lista paginada/borrado de fallidas, historial/detalle/edición/eliminación de reuniones y edición de pendientes, todos alineados al contrato aprobado.
9. **Validar recuperación y ambas plataformas:** revisar transiciones, cierre/reinicio, reintento, no duplicación local, eliminación, sanitización, rutas/permisos y flujo completo en macOS y Windows. Registrar cualquier cobertura no verificable por falta de equipo.
10. **Entregar para revisión:** documentar qué criterios se verificaron, limitaciones por plataforma y pasos locales confirmados. No publicar ni desplegar.

## Criterios de aceptación verificables

1. El backend escucha solo en `127.0.0.1:4174`; la protección por origen local acordada evita solicitudes de páginas no autorizadas según el diseño aprobado.
2. Una migración válida se aplica antes de aceptar solicitudes; un fallo de migración impide iniciar la API sin modificar datos de manera silenciosa.
3. El inicio, estado y detención de captura funcionan con ambos helpers; si falta una fuente, el helper falla o el archivo WAV no está completo, no se procesa una captura parcial.
4. El procesamiento usa el idioma de la reunión, valida la salida estructurada y crea como máximo una reunión local por `captureId`, incluso ante reenvíos concurrentes según la semántica acordada.
5. La consulta muestra estados durables hasta `completed` o `failed`; después de reiniciar, un trabajo interrumpido sigue la recuperación adoptada y permite reintento manual con el mismo audio.
6. En éxito se conservan reunión y pendientes y se borran las copias locales de audio y transcripción. En fallo se descarta la transcripción y se conserva el audio sin vencimiento automático hasta reintento o borrado manual.
7. La lista de capturas fallidas es paginada y solo entrega los campos adoptados; respuestas y logs no exponen claves, audio, transcripciones, prompts, rutas ni mensajes internos de OpenAI.
8. Consulta, edición y eliminación de reuniones cumplen el alcance; eliminar una reunión elimina sus pendientes; no existe borrado individual de pendiente ni `meetingDate` en el contrato.
9. El contrato API y la guía frontend describen el mismo flujo asíncrono, estados, respuestas y recuperación.
10. La validación documenta resultados por macOS y Windows. No se declara probado un sistema operativo que no se haya verificado en un equipo de esa plataforma.

## Validación

El repo no tiene comandos ni suite de producto consolidados en la raíz. Cada POC documenta sus propios comandos y lockfile; esos comandos no validan por sí solos la aplicación integrada. La validación de implementación deberá usar los scripts que se documenten en el manifiesto propio de `apps/api/` una vez aprobado y creado, más comprobaciones manuales de permisos/helpers en macOS y Windows. No se inventan ni se ejecutan comandos como parte de este plan.

La matriz de verificación debe cubrir entradas inválidas, límites del estado de captura, WAV incompleto, estados durable/reinicio, salida de IA inválida, idempotencia local, caída entre etapas, limpieza/retención, eliminación, cursores y filtrado de errores/logs. Las pruebas de integración con OpenAI no usarán reuniones reales ni enviarán datos distintos al flujo aprobado.

## Riesgos y mitigaciones

- **Contrato contradictorio:** bloquear implementación de handlers hasta acordar y reflejar el flujo asíncrono en contrato y guía.
- **Pérdida o retención incorrecta de audio:** probar rutas de éxito, fallo, reinicio y borrado; no usar limpieza de los POCs como referencia normativa.
- **Duplicados o costos repetidos:** impedir reuniones duplicadas localmente por captura; informar que una caída tras una solicitud aceptada por OpenAI puede requerir otro procesamiento/costo.
- **Exposición desde localhost:** definir orígenes permitidos y validar peticiones; no exponer API en interfaces de red externas.
- **Fugas de datos:** evitar contenido sensible, claves, rutas y transcripciones en logs y respuestas; no persistir transcripciones ni crear vencimientos/backups no aprobados.
- **Migración destructiva:** revisar cambios de esquema antes de aplicarlos; no prometer rollback, backup o recuperación de datos que el producto no tiene definidos.
- **Diferencias de plataforma:** captura Windows requiere verificación real en Windows; revisión en macOS no acredita el comportamiento WASAPI.
- **Suposición de código reutilizable:** los POCs tienen tratamientos incompatibles con v1. Adaptar solo el comportamiento acordado y mantener separados sus manifiestos y lockfiles.

## Reversión

La reversión de este documento es restaurar una versión previa de MN-08. Para la implementación, el plan de migración de datos debe describir compatibilidad y riesgos antes de ejecutarse. No hay política aprobada de backup ni se promete rollback que restaure datos locales. Ante una migración o fallo de archivos, la implementación debe fallar de forma visible y conservar los datos que no estén autorizados a borrarse; el comportamiento exacto de recuperación se debe concretar en los pasos de esquema y sistema de archivos.

## Aprobación registrada y puertas previas a implementación

Marco indicó explícitamente que el resultado deseado era dejar aprobado el plan y no iniciar la implementación en este encargo. Se registra esa instrucción como aprobación de MN-08 el 25 de noviembre de 2026. La aprobación cubre este plan dentro del alcance vigente; no amplía v1, no autoriza publicación/despliegue y no declara cumplidos los criterios de aceptación.

Antes de implementar las áreas afectadas, se deben completar y registrar estas puertas:

1. Alinear `AGENTS.md` y `README.md` con las decisiones registradas en `TECH_DESITIONS_MVP.md`; actualizar contrato y guía, preservando el flujo ya confirmado.
2. Cerrar tipos físicos, orden/cursor de historial y códigos estables antes de aplicar migraciones y completar handlers.
3. Implementar la recuperación temporal acordada: nunca publicar Meeting antes de borrar el WAV; recuperar con staging si la API cae en finalización.
4. Registrar si la revisión de Ronald pendiente en privacidad debe completarse antes de pruebas que envíen audio a OpenAI; no usar grabaciones reales hasta cumplir las aprobaciones y condiciones aplicables.
5. Verificar captura y flujo completo en macOS y Windows; no declarar probada una plataforma sin evidencia de ejecución en ella.

La aprobación del plan no significa que el trabajo se haya implementado: esta actualización modifica únicamente el documento MN-08.
