# MeetingNotes - contexto técnico y decisiones de negocio de v1

**Tipo:** borrador temporal de traspaso  
**Fecha de consolidación:** 24 de noviembre de 2026  
**Estado:** refleja decisiones expresadas por la persona usuaria; el equipo todavía debe aprobar el alcance. No es un plan de implementación aprobado.

> Propósito: conservar el contexto de la conversación para retomarlo en otro chat o compartirlo con quien implemente el proyecto. No se generó código de producto en esta conversación.

## 1. Estado y autoridad de las decisiones

La persona usuaria considera que este alcance probablemente será v1 y pidió un PDF sencillo para que el resto del equipo lo apruebe. Las respuestas de la persona usuaria definen una propuesta de alcance; **no demuestran que el equipo ya la haya aprobado**.

El AGENTS.md vigente indica que todavía no hay un plan de implementación aprobado en el repositorio y pide aprobación explícita del alcance y tratamiento de datos antes de implementar captura, transmisión o persistencia de audio. El stack base está aprobado; esa aprobación no reemplaza la aprobación del producto.

La persona usuaria indicó que creó el branch MN-08_backend. No se verificó el estado actual de Git ni el nombre exacto del branch.

Hay POCs aislados con código y manifiestos en `apps/prototypes/poc-record-audio/` y `apps/prototypes/poc-openai-macos/`. No hay un backend integrado de producto ni un manifiesto/configuración de producto en la raíz.

## 2. Propuesta de alcance de v1

Las decisiones de esta tabla fueron elegidas por la persona usuaria durante la conversación. El equipo aún debe aprobar la propuesta.

| Tema | Alcance propuesto |
|---|---|
| Forma del producto | Aplicación local para computadoras macOS y Windows. Cada computadora mantiene su propio historial. |
| Versiones | macOS 14.2 o posterior. Windows 10 versión 1809 es el mínimo técnico para pruebas; para uso oficial se requiere una versión de Windows que siga recibiendo actualizaciones. |
| Captura | Capturar el audio del sistema y el micrófono y mezclarlos en una sola pista mono, siguiendo los POCs. |
| Aviso de consentimiento | Mostrar un aviso visible y persistente. El aviso no bloquea el inicio de la captura ni solicita confirmación cada vez. |
| Procesamiento | El backend local envía el audio a OpenAI para transcribirlo y generar resumen y pendientes. Las reuniones reales se procesan con los controles actuales de la cuenta de OpenAI. |
| Modelos | Reutilizar la configuración del POC: gpt-transcribe para transcripción y OPENAI_TEXT_MODEL configurable para generar la salida estructurada. La disponibilidad actual del identificador y las opciones de la cuenta deben verificarse antes de implementar. |
| Idioma de salida | La persona usuaria elige español o inglés para cada reunión. No se decide automáticamente que el idioma de salida tenga que coincidir con el idioma hablado. El idioma elegido se propone como outputLanguage en la solicitud y como dato de Meeting. |
| Historial | Guardar, consultar y editar título, resumen y pendientes. La persona usuaria eligió poder borrar una reunión con todos sus pendientes. No habrá borrado automático del historial. |
| Base de datos | SQLite local en cada computadora. El historial de una computadora no se comparte automáticamente con otras. |
| Acceso | Sin cuentas, perfiles ni inicio de sesión dentro de MeetingNotes. El acceso local depende de la cuenta del sistema operativo. |
| Despliegue | Local, sin nube ni SSO en v1. Si una versión futura se despliega en la nube, el AGENTS.md exige el gateway SSO compartido. |
| Costos | Se aceptan costos variables de OpenAI según duración y modelos. No se eligió un tope de gasto dentro de la aplicación. |
| Retención tras éxito | Al terminar correctamente, borrar las copias locales del audio y la transcripción. Guardar el resumen, los pendientes y los metadatos de la reunión. |
| Retención tras fallo | Si falla el procesamiento con OpenAI, no conservar la transcripción, pero sí el audio local sin vencimiento automático. Mostrar la captura fallida para reintentar o eliminarla manualmente. Al reintentar se vuelve a transcribir; después de un procesamiento exitoso se elimina el audio. |
| Reuniones y pendientes | No se eligió un estado de pendiente como “completado”. Sí se eligieron consulta, edición y eliminación de una reunión junto con sus pendientes. No se decidió expresamente borrar un pendiente individual de forma independiente. |

### Condiciones de privacidad y costos que deben quedar visibles al equipo

- El audio se envía a OpenAI para transcripción; la transcripción también se procesa con OpenAI para generar las notas.
- Eliminar una copia local no elimina datos que OpenAI pudiera conservar según los controles de la cuenta. La configuración del endpoint de resumen en el POC incluye store: false, pero eso no define por sí solo la retención de todos los endpoints de OpenAI.
- La retención local indefinida de audio fallido es una excepción al comportamiento del POC OpenAI, que borra audio ante errores y exige volver a grabar.
- El aviso de consentimiento no bloquea la grabación. El aviso no equivale a verificar el consentimiento de las personas participantes.
- Los costos variables y el uso de los controles actuales de la cuenta fueron aceptados por la persona usuaria; la aprobación del equipo sigue pendiente.

## 3. Flujo de usuario y procesamiento propuesto

1. El frontend solicita iniciar una captura local. El backend o helper captura el audio y devuelve un captureId opaco.
2. El frontend consulta el estado/nivel de captura mientras sea necesario.
3. El frontend solicita detener la captura. El backend verifica que el WAV esté completo y listo.
4. El frontend llama una vez a POST /api/meetings, enviando el captureId, metadatos y el idioma elegido. No envía los bytes de audio ni una ruta local.
5. Esa solicitud es síncrona según la decisión más reciente: el backend transcribe, genera las notas y guarda la reunión y sus pendientes; al terminar devuelve la reunión completa.
6. Si OpenAI falla, el backend elimina la transcripción temporal, conserva el audio y ofrece la captura en una lista de reintento/eliminación. El mismo captureId debe poder usarse de nuevo mientras el audio fallido exista.
7. Si el procesamiento termina correctamente, el backend elimina el audio y la transcripción locales y deja persistidos los resultados en SQLite.

El frontend nunca debe recibir ni enviar una ruta del sistema de archivos. captureId es una referencia manejada por el backend. El modelo exacto de metadatos necesarios para una captura fallida todavía es una decisión técnica.

### Payload candidato

Los nombres de rutas y algunos campos son propuestas a revisar en el contrato, no una especificación final aprobada.

    {
      "captureId": "cap_opaque_value",
      "title": "Planificación semanal",
      "meetingDate": "2026-11-23T10:00:00-06:00",
      "outputLanguage": "es"
    }

- outputLanguage representa la elección por reunión; códigos candidatos: es y en.
- title y meetingDate aparecieron como campos opcionales en el contrato previo, pero su obligatoriedad no se confirmó expresamente.
- El payload no incluye audio, transcripción, resumen ni pendientes: estos se procesan/generan en backend.
- La persona usuaria eligió esperar a que termine el procesamiento en POST /api/meetings. La respuesta HTTP final y el comportamiento ante timeout aún deben definirse; 201 con Meeting completo es una propuesta razonable, no una decisión textual de la persona usuaria.

### Rutas candidatas que deben actualizarse en los documentos

- GET /api/health
- POST /api/captures para iniciar captura y crear captureId
- GET /api/captures/{captureId} para estado y nivel de audio
- POST /api/captures/{captureId}/stop para detener y confirmar captura completa
- POST /api/meetings para procesar de forma síncrona y guardar la reunión
- GET /api/captures?status=failed (o ruta equivalente) para la lista local de capturas fallidas
- DELETE /api/captures/{captureId} para eliminar manualmente el audio fallido
- GET /api/meetings y GET /api/meetings/{meetingId} para historial y detalle
- PATCH /api/meetings/{meetingId} para editar los campos acordados
- POST/PATCH en pendientes para crear/editar ActionItem
- DELETE /api/meetings/{meetingId} para borrar una reunión con sus pendientes

Los nombres finales, respuestas HTTP, códigos de error, paginación, reintentos e idempotencia aún requieren definición. **No se eligió un flujo asíncrono con 202, operationId ni sondeo de operaciones**; ese diseño apareció en la primera versión del contrato, pero la persona usuaria eligió procesamiento síncrono.

## 4. Modelos de dominio propuestos

### Meeting - persistente en SQLite

Campos candidatos:

- id
- title (posiblemente nullable)
- meetingDate (posiblemente nullable)
- outputLanguage (es o en)
- summary
- createdAt
- updatedAt

La decisión de producto fue guardar un resumen por reunión; no hace falta un modelo Note separado para el alcance descrito.

### ActionItem - persistente y asociado a Meeting

Campos candidatos:

- id
- meetingId (relación obligatoria)
- task
- assignee nullable
- dueDateText nullable
- createdAt/updatedAt si se necesitan para edición

El POC solo debe incluir acciones explícitamente acordadas, no ideas tentativas. Responsable y fecha son null/no especificados si no aparecen en la reunión. Las fechas relativas, por ejemplo “el viernes”, se conservan como texto; no se convierten a fecha calendario sin contexto aprobado. No se eligió un estado “completado”.

### Captura y audio fallido

- Mientras se graba, una CaptureSession puede representar estado, nivel y referencia local al WAV.
- Para conservar una captura fallida indefinidamente, disponible después de reiniciar la aplicación y visible para reintentar/eliminar, se necesita persistir localmente suficiente metadato de la captura y mantener el archivo de audio en disco. Esto contradice la primera versión del contrato, donde CaptureSession era siempre temporal/no persistente.
- Una entidad/registro PendingCapture es una propuesta técnica para la cola de fallidas. El archivo debe permanecer privado al backend; la API nunca devuelve la ruta. El audio no se guardaría dentro de SQLite.
- La ubicación exacta, permisos del archivo, metadatos almacenados, protección local, recuperación tras cierres inesperados y manejo de archivos huérfanos siguen sin especificarse.
- No se necesita una tabla persistente Transcript; la transcripción vive solo durante un intento y se descarta tanto después del éxito como del fallo.

## 5. Principios de arquitectura y stack

### Stack aprobado en el repositorio

- Frontend: React + TypeScript estricto. Vike (vike-react) está recomendado, pero no se eligió modo SSR/SPA/SSG.
- Backend: Bun + Hono.
- Datos: Drizzle + SQL. La persona usuaria eligió SQLite local para la propuesta de v1; sigue pendiente escoger entre la integración SQLite de Bun y better-sqlite3.
- IA y validación: Vercel AI SDK (ai) + Zod forman parte del stack aprobado.
- UI/estado remoto: Tailwind CSS y TanStack Query con fetch nativo. Zustand solo si React Context no basta.
- No se definieron versiones, carpetas, workspaces, CI, empaquetado, publicación ni despliegue.

El POC OpenAI actual usa llamadas fetch directas a OpenAI. Hay que decidir cómo se integra el proveedor en el producto con el stack aprobado, especialmente el endpoint de transcripción. No agregar dependencias no aprobadas por inferencia.

### Aplicación de SOLID propuesta

- Handlers Hono delgados: validan/serializan HTTP y delegan casos de uso.
- Separar casos de uso de iniciar/detener captura, crear una reunión desde captura, reintentar, borrar una captura fallida, consultar/editar reuniones y borrar reunión.
- Abstraer captura local, transcripción, generación de notas y persistencia mediante interfaces pequeñas.
- Adaptadores concretos para helpers nativos, OpenAI y Drizzle/SQLite.
- Validar entrada de API y salida estructurada del modelo con Zod.
- No imponer estructura de carpetas antes de aprobarla.

### Credenciales

En el POC, OPENAI_API_KEY se queda en el servidor y no llega al navegador; el modelo de texto se configura mediante OPENAI_TEXT_MODEL. La forma de guardar/provisionar la clave en la aplicación instalada para cada computadora todavía debe definirse.

## 6. Hechos técnicos de los POCs

### apps/prototypes/poc-record-audio/

- UI React/TypeScript y API local Bun + Hono.
- macOS: helper Swift con Core Audio taps; requiere macOS 14.2 o posterior.
- Windows: helper Python de 64 bits con PyAudioWPatch y WASAPI loopback; la guía del POC pide Python 3.11 y Windows 10 versión 1809 como mínimo técnico.
- Captura micrófono predeterminado y salida predeterminada; los mezcla a mono, 48 kHz, WAV PCM de 16 bits.
- El helper escribe el WAV localmente; Bun recibe eventos/estado/nivel/nombre de archivo, no los bytes de audio.
- La API local se enlaza a 127.0.0.1, lista y descarga recordings. No hay IA ni base de datos.
- Rutas actuales: GET /api/health, GET /api/capture/status, POST /api/capture/start, POST /api/capture/stop, GET /api/recordings y GET /api/recordings/{fileName}.
- El loopback de Windows no incorpora automáticamente otras salidas independientes; si cambia el dispositivo, puede ser necesario detener e iniciar de nuevo.
- El README advierte que Windows 10 1809 es mínimo técnico, que las ediciones comunes dejaron de recibir servicio en 2021 y recomienda Windows con actualizaciones vigentes.
- La captura y sincronización del helper Windows deben verificarse en un equipo Windows real; el POC no demuestra que funcione igual en todas las máquinas.

### apps/prototypes/poc-openai-macos/

- Solo macOS, reutiliza el helper Swift y backend local. No integra la ruta Windows.
- Al detener la captura, el servidor inicia transcripción y resumen. El frontend consulta el estado (GET /api/session) aproximadamente cada segundo mientras captura/procesa.
- Endpoints actuales: GET /api/health, GET /api/session, POST /api/capture/start, POST /api/capture/stop, POST /api/session/clear.
- La API local escucha en 127.0.0.1:4174 y la interfaz Vite se sirve en 127.0.0.1:5173. La interfaz consulta GET /api/session aproximadamente cada segundo durante estados activos.
- Estados de sesión observados en el POC: idle, starting, capturing, stopping, transcribing, summarizing, completed y error. El helper también comunica eventos ready, meter, error y stopped.
- El WAV se guarda temporalmente en una carpeta de sesión local. Si supera 20 MiB se divide en segmentos con solapamiento; el README explica que esto mantiene margen bajo el límite de 25 MB documentado para el endpoint de transcripción en ese POC.
- Transcribe con gpt-transcribe; concatena el texto temporalmente en memoria.
- Envía la transcripción a la Responses API con el modelo de OPENAI_TEXT_MODEL, salida JSON estructurada y store: false.
- El esquema del POC produce resumen y todos; cada TODO tiene tarea, responsable y fecha. Responsable/fecha son null si no aparecen y el prompt indica no inventar compromisos.
- El prompt actual redacta en español; v1 debe ajustarlo para obedecer el idioma elegido por reunión.
- Audio/chunks se eliminan en finally tanto si hay éxito como si falla. Si falla, hay que grabar nuevamente. V1 cambia este comportamiento al retener solo el audio de las capturas fallidas.
- La transcripción vive en memoria; resumen/TODOs también quedan en memoria y desaparecen al cerrar la API o limpiar. No hay SQLite ni reuniones persistentes en los POCs.
- El POC envía audio y transcripción a OpenAI. La retención del proveedor es independiente de la eliminación local; store: false en el resumen no debe interpretarse como política global de no retención.

## 7. Cambios de decisión durante la conversación

Esta secuencia evita recuperar como vigente una propuesta que luego cambió:

1. Se consideró un modelo Note; luego se decidió que para un resumen por reunión el resumen puede vivir en Meeting, sin tabla Note separada. Transcript tampoco es una tabla persistente en v1.
2. Se prefirió inicialmente PostgreSQL “si es viable”; después se eligió SQLite local en cada computadora por simplicidad de operación.
3. Primero se sugirió salida en el idioma de la reunión; la persona usuaria corrigió esa decisión: el usuario elige español o inglés para cada reunión.
4. Primero se propuso 202 Accepted con operationId y polling; luego se eligió una llamada síncrona que espera hasta devolver la reunión completa.
5. Inicialmente se planteó borrar temporales ante cualquier fallo como en el POC. Después se eligió conservar el audio fallido localmente sin vencimiento hasta reintento o eliminación manual. La transcripción no se conserva.
6. Se eligió referenciar la captura con captureId en vez de enviar el archivo desde el frontend. El POC actual mantiene una ruta interna y no expone captureId; esta capacidad debe añadirse.
7. La lista visible de capturas fallidas con acciones de reintento y eliminación fue aprobada como alcance propuesto.
8. El usuario pidió que solo se revisaran `docs/API_CONTRACT.md` y `docs/FRONTEND_API_GUIDE.md`; ambos se revisaron y se identificaron cambios necesarios, pero aún no se editaron.

## 8. Estado de documentación y artefactos

- `docs/API_CONTRACT.md` y `docs/FRONTEND_API_GUIDE.md` son propuestas previas y ahora están desactualizados. Todavía describen 202/operationId, polling de operaciones, proveedor/datos pendientes, captura siempre no persistente y no incluyen idioma por reunión ni la cola de audio fallido.
- Si se actualizan, deben reflejar la respuesta síncrona, outputLanguage, SQLite local, OpenAI, el borrado tras éxito, retención local de audio al fallar, listado/reintento/borrado de capturas fallidas y borrado manual de reuniones.
- output/pdf/meetingnotes-v1-alcance-aprobación.pdf es un documento sencillo de dos páginas para aprobación no técnica del equipo. Es una propuesta, no evidencia de aprobación firmada.
- Las instrucciones vigentes de AGENTS.md no se han cambiado. No crear remoto GitHub ni publicar; la persona usuaria indicó que lo hará desde su cuenta.

## 9. Decisiones y riesgos aún por cerrar antes de implementar

Estas son preguntas técnicas o de alcance; no deben completarse por inferencia:

1. Aprobación del equipo del alcance y tratamiento de datos del PDF, más ubicación del plan aprobado o aprobación explícita en el repositorio.
2. Timeout, cancelación, respuesta perdida o retry de la llamada síncrona POST /api/meetings; prevenir reuniones duplicadas y definir idempotencia/reconciliación.
3. Semántica exacta de error si OpenAI falla: código de respuesta, cómo mostrar captureId, cómo reintentar repetidamente y cómo manejar claves faltantes/cuotas.
4. Qué ocurre si la app/API se cierra durante captura o procesamiento, si la escritura a SQLite falla después de generar notas, o si falla el borrado local del audio.
5. Cómo persistir metadatos de PendingCapture y proteger el WAV fallido local; ubicación, permisos, limpieza manual y recuperación entre reinicios.
6. Las decisiones de retención aplican a errores de OpenAI. Capturas abandonadas, incompletas u otros fallos de disco aún no tienen política definida.
7. Reintentar con idioma igual o distinto al intento fallido; conservar título/fecha/idioma entre reinicios o permitir editarlos al reintentar.
8. Determinar si título/fecha son opcionales y qué formatos se usan; definir outputLanguage como requerido (es/en) o establecer otro contrato.
9. Si se permite borrar un ActionItem individual; solo se decidió editar pendientes y borrar una reunión junto con todos sus pendientes.
10. Cómo provisionar y proteger OPENAI_API_KEY en cada instalación, dónde configurar OPENAI_TEXT_MODEL y cómo integrarlo con Vercel AI SDK sin dependencias no aprobadas.
11. Elegir el driver SQLite aprobado (integración Bun o better-sqlite3), ruta local de DB, migraciones, respaldos y comportamiento al borrar datos.
12. Confirmar permisos, texto/ubicación del aviso de consentimiento y la configuración local/orígenes del servidor HTTP.
13. Integrar el helper Windows con el procesamiento OpenAI y validar captura, sincronización y manejo de dispositivos en hardware real.
14. Revisar tamaños, duración máxima, segmentación, límites vigentes del proveedor y gasto esperado, aunque se aceptaron costos variables sin límite en la aplicación.
15. Fijar paginación, códigos de error, reintentos, estados visibles de captura e identificadores. No se seleccionaron versiones, estructura de carpetas, modo de renderizado, empaquetado, CI ni comandos de validación.

## 10. Restricciones de trabajo vigentes

- Este archivo es contexto temporal; no sustituye AGENTS.md ni constituye aprobación del equipo.
- No implementar captura, envío a OpenAI ni retención de audio hasta que el alcance y el tratamiento obtengan aprobación humana requerida.
- No inventar comandos de Bun/npm ni añadir dependencias, estructura de workspaces o versiones no aprobadas.
- Aplicar SOLID en el diseño cuando corresponda.
- No crear remoto GitHub ni publicar cambios.
