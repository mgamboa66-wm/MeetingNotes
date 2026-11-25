# MeetingNotes — contrato de API

**Estado:** contrato técnico del backend v1 actualizado según las decisiones adoptadas y las aclaraciones aprobadas por Marco el 25 de noviembre de 2026. Los detalles expresamente señalados como pendientes siguen abiertos.

## 1. Alcance que condiciona la API

- El backend se ejecuta localmente en cada computadora. La aplicación no tendrá cuentas, inicio de sesión, nube ni sincronización entre equipos.
- Cada instalación guarda su propio historial en SQLite.
- La aplicación estará dirigida a macOS 14.2 o posterior y Windows. Windows 10 versión 1809 es un mínimo técnico para pruebas; para uso oficial se requiere una versión que aún reciba actualizaciones.
- La captura local combina el audio del sistema y el micrófono en una sola pista. La interfaz mostrará un aviso de consentimiento visible y persistente; ese aviso no verifica el consentimiento de las personas participantes.
- El backend envía el audio a OpenAI para transcribirlo y procesa la transcripción con OpenAI para generar el resumen y los pendientes. La persona usuaria elige español o inglés para cada reunión.
- Se guardan la reunión y sus pendientes. No se persiste la transcripción en el historial.
- Si el procesamiento termina correctamente, se guardan los resultados y se borran las copias locales del audio y la transcripción.
- Si el procesamiento falla, se descarta la transcripción y se conserva el audio local sin vencimiento automático, hasta que la persona usuaria reintente o elimine la captura.

La interfaz inicia y detiene la captura mediante la API y luego solicita el procesamiento con un identificador de captura. El trabajo corre en segundo plano; el cliente consulta el estado durable de la captura. Nunca envía bytes de audio ni una ruta del sistema de archivos.

## 2. Recursos y modelos

### 2.1 Meeting (persistente)

Se crea solo cuando la transcripción, la generación y el guardado local terminan correctamente.

| Campo | Tipo | Reglas |
|---|---|---|
| **id** | string | Identificador generado por el servidor. |
| **title** | string o null | Título editable. Puede omitirse al crear la reunión. |
| **outputLanguage** | enum: es, en | Idioma elegido para el resumen y los pendientes. |
| **summary** | string | Resumen generado y validado por el backend; la persona usuaria puede editarlo. |
| **actionItems** | ActionItem[] | Pendientes asociados a la reunión. |
| **createdAt** | string | Fecha y hora RFC 3339 generada por el servidor. |
| **updatedAt** | string | Fecha y hora RFC 3339 generada por el servidor. |

No se necesita una entidad Note separada: el resumen forma parte de Meeting. Tampoco se guarda una entidad Transcript.

La base relaciona cada reunión con su `captureId`, con una restricción que impide crear más de una reunión por captura. `captureId` no necesita exponerse como campo de Meeting: el estado de captura completada devuelve su `meetingId`.

### 2.2 ActionItem (persistente)

| Campo | Tipo | Reglas |
|---|---|---|
| **id** | string | Identificador generado por el servidor. |
| **meetingId** | string | Relación obligatoria con Meeting. |
| **task** | string | Compromiso explícito. No se deben presentar ideas tentativas como tareas ni inventar compromisos. |
| **assignee** | string o null | Responsable solo si se menciona; null si no se especifica. |
| **dueDateText** | string o null | Fecha como se dijo, incluso si es relativa; null si no se indicó. |

No se define un estado de completado para los pendientes en v1. La fecha se conserva como texto; no se convierte una fecha relativa a una fecha calendario.

### 2.3 Capture (registro local)

La API asigna un identificador opaco **captureId** a cada captura. El backend mantiene la referencia privada al archivo; nunca devuelve su ruta.

El audio fallido y la metadata mínima para mostrar la cola persisten localmente y sobreviven al cierre o reinicio de la aplicación. La referencia al archivo permanece privada al backend. La metadata de estado puede conservarse tras completar para permitir consultar `meetingId`; el archivo de audio se elimina al completar.

Estados: **starting**, **capturing**, **stopping**, **ready**, **transcribing**, **summarizing**, **completed** y **failed**. Una captura fallida puede volver a procesarse manualmente con el mismo **captureId**. Una captura completada conserva su metadata y `meetingId`, pero no su audio.

### 2.4 Operation

No se crea un recurso Operation separado. `Capture` identifica el trabajo durable: `POST /api/meetings` lo inicia y `GET /api/captures/{captureId}` devuelve su estado y, al completar, `meetingId`.

## 3. Endpoints propuestos

Las rutas y respuestas descritas incorporan las decisiones de backend adoptadas. Los códigos y errores que no se especifican aquí se mantienen sujetos al catálogo de errores estable de la implementación.

### 3.1 Salud

#### GET /api/health

Comprueba que la API local está disponible. No debe incluir secretos.

Respuesta 200:

    {
      "ok": true,
      "service": "meetingnotes-api"
    }

### 3.2 Capturas locales

#### POST /api/captures

Inicia la captura local mediante el componente nativo de la plataforma. No recibe audio ni una ruta de archivo. El audio del sistema y el micrófono se combinan en una sola pista.

Respuesta 201:

    {
      "captureId": "cap_opaque_value",
      "status": "capturing",
      "startedAt": "2026-11-24T10:00:00-06:00"
    }

#### GET /api/captures/{captureId}

Devuelve el estado durable de una captura. Mientras está capturando puede incluir el nivel de audio normalizado entre 0 y 1. En `completed` incluye `meetingId`. No incluye rutas locales ni audio.

Respuesta 200:

    {
      "captureId": "cap_opaque_value",
      "status": "capturing",
      "level": 0.32,
      "updatedAt": "2026-11-24T10:00:03-06:00"
    }

El campo **level** se puede omitir cuando no corresponda. En estado `completed`, la respuesta incluye `meetingId`; en los otros estados se omite.

#### POST /api/captures/{captureId}/stop

Detiene la captura y valida que el archivo combinado esté completo. No transcribe ni genera notas; deja la captura lista para procesar.

Respuesta 200:

    {
      "captureId": "cap_opaque_value",
      "status": "ready",
      "completedAt": "2026-11-24T10:30:00-06:00"
    }

#### GET /api/captures?status=failed&limit=20&cursor=...

Lista capturas fallidas cuyo audio está disponible para reintentar. Usa `limit=20` por defecto y cursor opaco. La lista no expone rutas ni audio.

Respuesta 200 propuesta:

    {
      "items": [
        {
          "captureId": "cap_opaque_value",
          "status": "failed",
          "startedAt": "2026-11-24T10:00:00-06:00",
          "failedAt": "2026-11-24T10:30:00-06:00",
          "failureCode": "OPENAI_UNAVAILABLE"
        }
      ],
      "nextCursor": null
    }

#### DELETE /api/captures/{captureId}

Elimina manualmente una captura fallida y su audio local. No aplica una fecha de vencimiento automática.

Respuesta 204 propuesta, sin cuerpo.

### 3.3 Crear una reunión y procesar la captura

#### POST /api/meetings

Inicia en segundo plano la transcripción y generación de notas de una captura lista o fallida. El estado se persiste y se consulta mediante `GET /api/captures/{captureId}`.

Cabecera propuesta:

- **Content-Type: application/json**

`captureId` es la clave local de idempotencia. No se requiere `Idempotency-Key`.

Solicitud:

    {
      "captureId": "cap_opaque_value",
      "outputLanguage": "es",
      "title": "Planificación semanal"
    }

**captureId** y **outputLanguage** son obligatorios. **outputLanguage** acepta **es** o **en**. **title** es opcional. `meetingDate` no forma parte de v1.

No se aceptan audio, transcripción, resumen ni pendientes en esta solicitud: los genera el backend. Un inicio nuevo responde HTTP 202 con el `captureId` y el estado actual. Si ya hay un trabajo activo, una solicitud repetida devuelve el estado actual sin iniciar otro trabajo. Si ya completó, una solicitud repetida devuelve la reunión existente. Si falló, un nuevo POST explícito inicia el reintento manual con el mismo audio y `captureId`.

Respuesta de aceptación, HTTP 202:

    {
      "captureId": "cap_opaque_value",
      "status": "transcribing"
    }

Al consultar `GET /api/captures/{captureId}`, el estado progresa a `completed` o `failed`. En `completed`, el backend incluye el `meetingId` para cargar el resultado. Las solicitudes repetidas tras completar devuelven la misma reunión con HTTP 200.

Respuesta de la reunión completada:

    {
      "id": "meeting_opaque_value",
      "title": "Planificación semanal",
      "outputLanguage": "es",
      "summary": "Se revisó el avance del proyecto.",
      "actionItems": [
        {
          "id": "action_opaque_value",
          "meetingId": "meeting_opaque_value",
          "task": "Compartir la propuesta",
          "assignee": null,
          "dueDateText": "el viernes"
        }
      ],
      "createdAt": "2026-11-24T10:32:00-06:00",
      "updatedAt": "2026-11-24T10:32:00-06:00"
    }

La escritura final de Meeting, ActionItems y el estado `completed` se protege en una transacción SQLite y mediante unicidad local de `captureId`. Una caída después de que OpenAI recibe una solicitud puede causar un costo repetido; no se promete exactamente una vez en el proveedor.

### 3.4 Consultar, editar y eliminar reuniones

#### GET /api/meetings?limit=20&cursor=...

Lista el historial local con paginación. `limit` es 20 por defecto y el cursor es opaco.

Respuesta 200:

    {
      "items": [],
      "nextCursor": null
    }

#### GET /api/meetings/{meetingId}

Devuelve una reunión con su resumen y pendientes.

#### PATCH /api/meetings/{meetingId}

Actualiza campos editables como **title** y **summary**. No permite modificar **id**, **captureId**, **createdAt** ni **updatedAt**.

#### POST /api/meetings/{meetingId}/action-items

Agrega un pendiente manualmente, sujeto a las mismas reglas de no inventar compromisos, responsables ni fechas.

Solicitud:

    {
      "task": "Enviar la propuesta",
      "assignee": null,
      "dueDateText": null
    }

#### PATCH /api/meetings/{meetingId}/action-items/{actionItemId}

Edita **task**, **assignee** o **dueDateText**.

El alcance aprobado contempla eliminar una reunión junto con todos sus pendientes, pero no especifica la eliminación individual de un ActionItem. No se incluye esa ruta en esta propuesta.

#### DELETE /api/meetings/{meetingId}

Elimina manualmente la reunión y todos sus ActionItems asociados. El historial guardado no vence automáticamente.

Respuesta 204 propuesta, sin cuerpo.

## 4. Errores

Formato común propuesto:

    {
      "error": {
        "code": "CAPTURE_NOT_READY",
        "message": "La captura aún no está lista para procesar."
      }
    }

Códigos HTTP candidatos:

| Código | Uso |
|---|---|
| 400 | Solicitud mal formada o validación fallida. |
| 403 | `Origin` ausente o no permitido. |
| 404 | Reunión o captura desconocida. |
| 409 | Captura en estado incompatible o la misma captura se reenvía con parámetros incompatibles. |
| 502 | OpenAI devuelve una respuesta fallida o inválida. |
| 503 | OpenAI u otra dependencia temporal no está disponible. |
| 500 | Error local inesperado, por ejemplo al persistir resultados. |

Cuando falla el procesamiento de una captura, la respuesta no debe borrar el audio: debe dejarlo recuperable desde la cola de fallidas. Si falla el borrado del audio durante la finalización, no se expone la reunión; se descarta el resultado estructurado temporal, se marca la captura como `failed` y se conserva el audio. Los mensajes no deben incluir claves, rutas locales, audio, transcripciones ni información sensible de OpenAI. Los códigos deben permanecer estables para que el frontend no dependa de mensajes libres.

## 5. Responsabilidades internas (SOLID)

Sin imponer estructura de carpetas, se recomienda separar estas responsabilidades:

- **Handlers Hono:** traducen HTTP a casos de uso y serializan respuestas; no contienen lógica de captura, IA ni SQL.
- **Casos de uso:** iniciar y detener captura, crear o reintentar una reunión desde una captura, listar y eliminar capturas fallidas, consultar, editar y eliminar reuniones, y editar pendientes.
- **Puertos:** captura local, transcripción, generación de notas y repositorios SQL.
- **Adaptadores:** componentes nativos de macOS y Windows, OpenAI y Drizzle/SQLite. Los casos de uso dependen de interfaces y no directamente de adaptadores.
- **IA y validación:** usar el Vercel AI SDK (ai) y Zod, según el stack aprobado. La integración concreta para transcripción de audio con OpenAI debe confirmarse al implementar; no se presupone una dependencia adicional.
- **Validación de límites:** Zod valida payloads HTTP y las salidas estructuradas antes de persistirlas.
- **Finalización durable:** el resumen y los pendientes pueden mantenerse temporalmente en SQLite mientras se confirma el borrado del WAV. Este resultado no se expone por API y no incluye transcripción. Si la API reinicia y el WAV ya no existe, finaliza la reunión desde ese resultado; si el WAV existe, descarta el resultado temporal y marca la captura `failed`.
- **Origen del navegador:** solo se aceptan `Origin` exactos `http://127.0.0.1:5173` y `http://localhost:5173`. Se rechaza `Origin` ausente o distinto. El frontend usa el proxy local de Vite para las rutas `/api`; la API no expone CORS abierto.

Esto separa responsabilidades y permite cambiar adaptadores sin alterar el contrato HTTP. No fija versiones ni añade dependencias fuera del stack técnico aprobado.

## 6. Relación con los POCs y decisiones técnicas por cerrar

Los POCs actuales usan rutas como GET /api/health, GET /api/session, POST /api/capture/start y POST /api/capture/stop. El POC de OpenAI cubre macOS, no crea reuniones persistentes y no ofrece la cola local de capturas fallidas. El backend de v1 agrega SQLite, idioma por reunión, procesamiento durable en segundo plano y reintento o eliminación manual del audio fallido.

El alcance y las decisiones técnicas descritas arriba están aprobados. El contrato aún debe fijar el orden estable del historial de reuniones y el catálogo completo de `failureCode` y errores de cada operación antes de cerrar su implementación. No se reabren la exclusión de `meetingDate`, la eliminación conjunta de pendientes, el procesamiento asíncrono, la paginación de capturas fallidas ni los orígenes locales aprobados.

La cuenta de OpenAI usará sus controles vigentes. Borrar una copia local no elimina datos que OpenAI pudiera conservar conforme a esos controles. Los costos pueden variar según la duración y los modelos; v1 no tendrá un límite de gasto dentro de la aplicación.
