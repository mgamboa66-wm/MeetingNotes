# MeetingNotes — contrato de API

**Estado:** propuesta técnica alineada al alcance de producto aprobado en [MEETINGNOTES_V1_SCOPE.md](../MEETINGNOTES_V1_SCOPE.md). El alcance de producto está aprobado; las rutas, los códigos HTTP y otros detalles de este contrato siguen siendo propuestas hasta que se acuerden para implementación.

## 1. Alcance que condiciona la API

- El backend se ejecuta localmente en cada computadora. La aplicación no tendrá cuentas, inicio de sesión, nube ni sincronización entre equipos.
- Cada instalación guarda su propio historial en SQLite.
- La aplicación estará dirigida a macOS 14.2 o posterior y Windows. Windows 10 versión 1809 es un mínimo técnico para pruebas; para uso oficial se requiere una versión que aún reciba actualizaciones.
- La captura local combina el audio del sistema y el micrófono en una sola pista. La interfaz mostrará un aviso de consentimiento visible y persistente; ese aviso no verifica el consentimiento de las personas participantes.
- El backend envía el audio a OpenAI para transcribirlo y procesa la transcripción con OpenAI para generar el resumen y los pendientes. La persona usuaria elige español o inglés para cada reunión.
- Se guardan la reunión y sus pendientes. No se persiste la transcripción en el historial.
- Si el procesamiento termina correctamente, se guardan los resultados y se borran las copias locales del audio y la transcripción.
- Si el procesamiento falla, se descarta la transcripción y se conserva el audio local sin vencimiento automático, hasta que la persona usuaria reintente o elimine la captura.

El flujo HTTP propuesto conserva las responsabilidades en el backend: la interfaz inicia y detiene la captura mediante la API y luego solicita la creación de la reunión con un identificador de captura. Nunca envía bytes de audio ni una ruta del sistema de archivos.

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
| **meetingDate** | string o null | Campo opcional propuesto, en formato RFC 3339 con zona horaria. El alcance aprobado no exige capturarlo. |

No se necesita una entidad Note separada: el resumen forma parte de Meeting. Tampoco se guarda una entidad Transcript.

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

El audio de capturas fallidas y la información mínima para mostrarlas en la cola deben persistir localmente y sobrevivir al cierre o reinicio de la aplicación. El almacenamiento del archivo y la representación interna de su metadata son decisiones de implementación; no se guarda la transcripción como parte de la captura fallida.

Estados propuestos: **starting**, **capturing**, **stopping**, **ready**, **processing** y **failed**. Una captura fallida puede volver a procesarse con el mismo **captureId**. Al completar el procesamiento y guardar la reunión, se elimina el audio local y la captura deja de estar disponible.

### 2.4 Operation

No se propone un recurso Operation separado: la solicitud de creación de reunión espera el resultado final. Si la implementación requiere procesamiento en segundo plano por límites de tiempo o estabilidad, habrá que revisar este contrato y acordar el flujo con el frontend.

## 3. Endpoints propuestos

Las rutas y los códigos de respuesta de esta sección son propuestas técnicas, no decisiones adicionales de alcance.

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

Devuelve el estado de una captura. Mientras está capturando puede incluir el nivel de audio normalizado entre 0 y 1. No incluye rutas locales ni audio.

Respuesta 200:

    {
      "captureId": "cap_opaque_value",
      "status": "capturing",
      "level": 0.32,
      "updatedAt": "2026-11-24T10:00:03-06:00"
    }

El campo **level** se puede omitir cuando no corresponda.

#### POST /api/captures/{captureId}/stop

Detiene la captura y valida que el archivo combinado esté completo. No transcribe ni genera notas; deja la captura lista para procesar.

Respuesta 200:

    {
      "captureId": "cap_opaque_value",
      "status": "ready",
      "completedAt": "2026-11-24T10:30:00-06:00"
    }

#### GET /api/captures?status=failed

Lista las capturas cuyo procesamiento falló y cuyo audio está disponible para reintentar. La lista no expone rutas ni audio. Los campos de presentación y el formato de paginación quedan por definir.

Respuesta 200 propuesta:

    {
      "items": [
        {
          "captureId": "cap_opaque_value",
          "status": "failed",
          "startedAt": "2026-11-24T10:00:00-06:00",
          "failedAt": "2026-11-24T10:30:00-06:00"
        }
      ]
    }

#### DELETE /api/captures/{captureId}

Elimina manualmente una captura fallida y su audio local. No aplica una fecha de vencimiento automática.

Respuesta 204 propuesta, sin cuerpo.

### 3.3 Crear una reunión y procesar la captura

#### POST /api/meetings

Transcribe la captura, genera el resumen y los pendientes en el idioma solicitado, y guarda Meeting con sus ActionItems en SQLite. La solicitud espera el resultado completo.

Cabecera propuesta:

- **Content-Type: application/json**
- Se recomienda **Idempotency-Key** para distinguir reenvíos de red de nuevos intentos. Su semántica y duración aún deben definirse.

Solicitud:

    {
      "captureId": "cap_opaque_value",
      "outputLanguage": "es",
      "title": "Planificación semanal",
      "meetingDate": "2026-11-24T10:00:00-06:00"
    }

**captureId** y **outputLanguage** son obligatorios. **outputLanguage** acepta **es** o **en**. **title** y **meetingDate** son opcionales; **meetingDate** se mantiene como campo candidato porque no es un requisito explícito del alcance aprobado.

No se aceptan audio, transcripción, resumen ni pendientes en esta solicitud: los genera el backend. Si falla el procesamiento, el backend descarta la transcripción, conserva el audio y deja la captura disponible en la cola de fallidas. La persona usuaria puede repetir la solicitud con el mismo **captureId** o eliminar la captura manualmente.

Respuesta completa propuesta, HTTP 201:

    {
      "id": "meeting_opaque_value",
      "title": "Planificación semanal",
      "meetingDate": "2026-11-24T10:00:00-06:00",
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

El código 201 es una propuesta. La implementación debe proteger contra la creación de reuniones duplicadas si el cliente pierde la respuesta y reenvía la solicitud; el mecanismo concreto de idempotencia y reconciliación aún no está acordado.

### 3.4 Consultar, editar y eliminar reuniones

#### GET /api/meetings?limit=20&cursor=...

Lista el historial local con paginación. El formato del cursor queda por definir.

Respuesta 200:

    {
      "items": [],
      "nextCursor": null
    }

#### GET /api/meetings/{meetingId}

Devuelve una reunión con su resumen y pendientes.

#### PATCH /api/meetings/{meetingId}

Actualiza campos editables como **title** y **summary**. No permite modificar **id**, **createdAt** ni **updatedAt**. **meetingDate**, si se conserva, requerirá definición explícita de si es editable.

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
| 404 | Reunión o captura desconocida. |
| 409 | Captura en estado incompatible o conflicto de idempotencia. |
| 502 | OpenAI devuelve una respuesta fallida o inválida. |
| 503 | OpenAI u otra dependencia temporal no está disponible. |
| 500 | Error local inesperado, por ejemplo al persistir resultados. |

Cuando falla el procesamiento de una captura, la respuesta no debe borrar el audio: debe dejarlo recuperable desde la cola de fallidas. Los mensajes no deben incluir claves, rutas locales, audio, transcripciones ni información sensible de OpenAI. Los códigos y estados son propuestas; deben permanecer estables una vez acordados para que el frontend no dependa de mensajes libres.

## 5. Responsabilidades internas (SOLID)

Sin imponer estructura de carpetas, se recomienda separar estas responsabilidades:

- **Handlers Hono:** traducen HTTP a casos de uso y serializan respuestas; no contienen lógica de captura, IA ni SQL.
- **Casos de uso:** iniciar y detener captura, crear o reintentar una reunión desde una captura, listar y eliminar capturas fallidas, consultar, editar y eliminar reuniones, y editar pendientes.
- **Puertos:** captura local, transcripción, generación de notas y repositorios SQL.
- **Adaptadores:** componentes nativos de macOS y Windows, OpenAI y Drizzle/SQLite. Los casos de uso dependen de interfaces y no directamente de adaptadores.
- **IA y validación:** usar el Vercel AI SDK (ai) y Zod, según el stack aprobado. La integración concreta para transcripción de audio con OpenAI debe confirmarse al implementar; no se presupone una dependencia adicional.
- **Validación de límites:** Zod valida payloads HTTP y las salidas estructuradas antes de persistirlas.

Esto separa responsabilidades y permite cambiar adaptadores sin alterar el contrato HTTP. No fija versiones ni añade dependencias fuera del stack técnico aprobado.

## 6. Relación con los POCs y decisiones técnicas por cerrar

Los POCs actuales usan rutas como GET /api/health, GET /api/session, POST /api/capture/start y POST /api/capture/stop. El POC de OpenAI cubre macOS, no crea reuniones persistentes y no ofrece la cola local de capturas fallidas. El contrato de v1 agrega almacenamiento local con SQLite, selección de idioma por reunión, procesamiento síncrono desde la perspectiva HTTP y reintento o eliminación manual del audio cuando falle el procesamiento.

El alcance de producto, el uso de OpenAI, el almacenamiento local con SQLite, las plataformas y las reglas de retención local descritas en la sección 1 están aprobados. Antes de implementar este contrato aún se deben concretar los detalles técnicos que el alcance no define:

- Si el procesamiento síncrono puede superar los límites prácticos de tiempo de una solicitud y cómo reconciliar un timeout con un reintento sin duplicar reuniones.
- La semántica final de **Idempotency-Key**, los códigos HTTP y el formato de errores.
- Si **meetingDate** se incluye en v1 y si puede editarse; la eliminación individual de pendientes tampoco está definida por el alcance.
- El formato, los campos y la paginación de la lista de capturas fallidas.
- La recuperación ante cierre inesperado durante una captura o un procesamiento, y los permisos y detalles nativos de captura en cada plataforma.
- La ruta local de los archivos, los controles de acceso del sistema operativo y los modelos concretos de OpenAI.
- El host y puerto locales, y los detalles de integración para ejecutar la API junto a la aplicación de escritorio.

La cuenta de OpenAI usará sus controles vigentes. Borrar una copia local no elimina datos que OpenAI pudiera conservar conforme a esos controles. Los costos pueden variar según la duración y los modelos; v1 no tendrá un límite de gasto dentro de la aplicación.
