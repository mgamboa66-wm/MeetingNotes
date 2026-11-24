# MeetingNotes — contrato de API

**Estado:** propuesta para revisión. Este documento describe un contrato; no autoriza por sí solo la captura, el envío de audio a servicios externos, la retención de datos ni la implementación.

## 1. Alcance y decisiones

El backend local usa Bun + Hono. La API conserva el prefijo `/api`, como los POCs. El host y el puerto definitivos siguen pendientes.

El flujo propuesto:

1. El backend inicia una captura local y devuelve un identificador opaco `captureId`.
2. El backend finaliza la captura y la deja lista para procesar.
3. El frontend envía `captureId` a `POST /api/meetings`.
4. El backend transcribe y resume. Guarda solo la reunión, el resumen y los pendientes.
5. El backend elimina los archivos temporales de audio y descarta la transcripción después del procesamiento.

El frontend nunca envía bytes de audio ni una ruta del sistema de archivos. El `captureId` es una referencia temporal que el backend asocia con su archivo interno.

La generación se ejecuta en el backend. El contrato no expone OpenAI ni fija un proveedor de IA. La decisión de proveedor y el procesamiento externo siguen pendientes de aprobación.

## 2. Recursos y modelos

### 2.1 Meeting (persistente)

Una reunión se guarda una vez que el procesamiento termina correctamente.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Identificador generado por el servidor. |
| `title` | string o null | Título proporcionado por el usuario; no se inventa a partir de la transcripción. |
| `meetingDate` | string o null | Fecha y hora RFC 3339 con zona horaria, si se conoce. |
| `summary` | string | Resumen generado y validado por el backend. |
| `actionItems` | ActionItem[] | Pendientes asociados a la reunión. |
| `createdAt` | string | Fecha y hora RFC 3339 generada por el servidor. |
| `updatedAt` | string | Fecha y hora RFC 3339 generada por el servidor. |

No se propone una entidad `Note` separada: el resumen vive en `Meeting`.

### 2.2 ActionItem (persistente)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Identificador generado por el servidor. |
| `meetingId` | string | Relación obligatoria con `Meeting`. |
| `task` | string | Acción acordada; no se deben inventar compromisos. |
| `assignee` | string o null | Responsable mencionado; null si no se especificó. |
| `dueDateText` | string o null | Fecha tal como se dijo, incluso si es relativa; null si no se indicó. |

Se conserva la fecha como texto porque el POC no convierte fechas relativas a fechas calendario.

### 2.3 CaptureSession (temporal, no persistente)

Representa una captura activa o lista para procesar. Su ID público es `captureId`. El backend mantiene la asociación con la ruta del WAV de forma privada; nunca devuelve esa ruta.

Estados propuestos: `starting`, `capturing`, `stopping`, `ready`, `processing`, `consumed`, `failed`, `expired`.

La expiración y la limpieza de capturas abandonadas requieren una política aprobada; este contrato no fija una duración.

### 2.4 Operation (temporal)

Representa el procesamiento iniciado por `POST /api/meetings`. No es una entidad de producto persistente.

Estados: `queued`, `transcribing`, `summarizing`, `completed`, `failed`.

## 3. Endpoints

### 3.1 Salud

#### `GET /api/health`

Comprueba que la API está disponible. No debe incluir secretos.

Respuesta `200`:

```json
{
  "ok": true,
  "service": "meetingnotes-api"
}
```

### 3.2 Capturas locales

#### `POST /api/captures`

Inicia la captura local mediante el helper nativo. No recibe audio ni una ruta de archivo.

Respuesta `201`:

```json
{
  "captureId": "cap_opaque_value",
  "status": "capturing",
  "startedAt": "2026-11-23T10:00:00-06:00"
}
```

#### `GET /api/captures/{captureId}`

Devuelve el estado de la captura y, mientras captura, el nivel de audio normalizado de 0 a 1.

Respuesta `200`:

```json
{
  "captureId": "cap_opaque_value",
  "status": "capturing",
  "level": 0.32,
  "updatedAt": "2026-11-23T10:00:03-06:00"
}
```

El nivel se puede omitir cuando no corresponde.

#### `POST /api/captures/{captureId}/stop`

Detiene el helper y valida que el WAV temporal quedó completo. No transcribe ni genera notas. El audio queda listo para que el siguiente endpoint lo consuma.

Respuesta `200`:

```json
{
  "captureId": "cap_opaque_value",
  "status": "ready",
  "completedAt": "2026-11-23T10:30:00-06:00"
}
```

### 3.3 Crear reunión y procesar la captura

#### `POST /api/meetings`

Consume una captura lista, ejecuta la transcripción y la generación de notas, y guarda `Meeting` con sus `ActionItem` en una transacción.

Cabeceras:

- `Content-Type: application/json`
- Se recomienda `Idempotency-Key` para que un reintento de red no vuelva a procesar la misma captura. La vigencia de la clave debe acordarse.

Solicitud:

```json
{
  "captureId": "cap_opaque_value",
  "title": "Planificación semanal",
  "meetingDate": "2026-11-23T10:00:00-06:00"
}
```

`title` y `meetingDate` son opcionales y pueden ser null. No se aceptan audio, transcripción, resumen ni pendientes en esta solicitud: estos últimos los produce el backend.

Respuesta `202 Accepted`:

```json
{
  "operationId": "op_opaque_value",
  "status": "queued"
}
```

El backend reserva la captura para un solo procesamiento. No crea la reunión en la base de datos hasta validar la salida generada y guardar correctamente la reunión y sus pendientes. Una captura no se puede reutilizar.

#### `GET /api/operations/{operationId}`

Permite consultar el procesamiento. El frontend puede sondear esta ruta mientras el estado no sea terminal.

Respuesta durante el procesamiento:

```json
{
  "operationId": "op_opaque_value",
  "status": "transcribing"
}
```

Respuesta completada:

```json
{
  "operationId": "op_opaque_value",
  "status": "completed",
  "meeting": {
    "id": "meeting_opaque_value",
    "title": "Planificación semanal",
    "meetingDate": "2026-11-23T10:00:00-06:00",
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
    "createdAt": "2026-11-23T10:32:00-06:00",
    "updatedAt": "2026-11-23T10:32:00-06:00"
  }
}
```

Respuesta fallida:

```json
{
  "operationId": "op_opaque_value",
  "status": "failed",
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "No se pudieron generar las notas."
  }
}
```

El mensaje no debe incluir claves, rutas locales, audio, transcripciones ni detalles sensibles del proveedor.

### 3.4 Consultar reuniones

#### `GET /api/meetings?limit=20&cursor=...`

Lista reuniones con paginación. El formato de cursor puede definirse durante la implementación.

Respuesta `200`:

```json
{
  "items": [],
  "nextCursor": null
}
```

#### `GET /api/meetings/{meetingId}`

Devuelve una reunión con su resumen y pendientes.

#### `PATCH /api/meetings/{meetingId}`

Actualiza campos editables como `title`, `meetingDate` y `summary`. El frontend no puede modificar `id`, `createdAt` ni `updatedAt`.

### 3.5 Editar pendientes

#### `POST /api/meetings/{meetingId}/action-items`

Agrega un pendiente manualmente.

Solicitud:

```json
{
  "task": "Enviar la propuesta",
  "assignee": null,
  "dueDateText": null
}
```

#### `PATCH /api/meetings/{meetingId}/action-items/{actionItemId}`

Edita `task`, `assignee` o `dueDateText`.

No se incluye un endpoint de eliminación en la primera propuesta. La semántica de borrado y retención requiere decisión humana.

## 4. Errores

Formato común:

```json
{
  "error": {
    "code": "CAPTURE_NOT_READY",
    "message": "La captura aún no está lista para procesar."
  }
}
```

Códigos HTTP propuestos:

| Código | Uso |
|---|---|
| `400` | Solicitud mal formada o validación fallida. |
| `404` | Reunión, captura u operación desconocida o expirada. |
| `409` | Captura en estado incorrecto, ya consumida o conflicto de idempotencia. |
| `502` | El proveedor devolvió una respuesta fallida o inválida. |
| `503` | Dependencia temporalmente no disponible. |

El backend valida entradas y respuestas del proveedor con Zod. Los estados y códigos de error deben ser estables para que el frontend no dependa de mensajes libres.

## 5. Responsabilidades internas (SOLID)

Sin imponer estructura de carpetas, se recomienda mantener estas responsabilidades separadas:

- **Handlers Hono:** traducen HTTP a casos de uso y serializan respuestas; no contienen lógica de captura, IA ni SQL.
- **Casos de uso:** iniciar y detener captura, crear reunión desde captura, consultar operación, editar reunión y pendientes.
- **Puertos pequeños:** captura local, transcripción, generación de notas y repositorios SQL.
- **Adaptadores:** helper nativo, proveedor de IA elegido y Drizzle/SQL. El caso de uso depende de interfaces, no de OpenAI ni de una base concreta.
- **Validación de límites:** Zod valida payloads HTTP y la salida estructurada del proveedor antes de guardarla.

Esto aplica separación de responsabilidades, dependencias hacia abstracciones y permite cambiar adaptadores sin alterar el contrato HTTP. No fija versiones ni añade dependencias fuera del stack aprobado.

## 6. Relación con los POCs y pendientes

Los POCs actuales usan `GET /api/health`, `GET /api/session`, `POST /api/capture/start`, `POST /api/capture/stop` y, en el POC de grabación, rutas de recordings. El POC OpenAI procesa al detener y conserva resultados en memoria. No expone `captureId`, no crea reuniones persistentes y solo cubre macOS.

Este contrato propone IDs explícitos para asociar una captura con el procesamiento y almacenamiento de una reunión. También agrega persistencia del resumen y pendientes. Esas diferencias son propuestas, no funcionalidades ya implementadas.

Antes de implementar siguen pendientes la aprobación del alcance y tratamiento de datos, la captura y permisos por plataforma, el envío de audio a OpenAI u otro proveedor, la retención y borrado, la elección entre SQLite y PostgreSQL, y autenticación/despliegue si el producto sale del entorno local.
