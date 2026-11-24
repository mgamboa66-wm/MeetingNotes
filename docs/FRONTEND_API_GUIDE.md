# MeetingNotes — guía de integración para frontend

**Estado:** guía de trabajo basada en una propuesta de API; los endpoints aún no están implementados. Coordinar cualquier cambio de contrato con backend.

## Qué hace el frontend

El frontend controla la captura local, presenta su estado, solicita al backend crear y procesar una reunión, consulta el progreso y muestra el resultado. El audio y la transcripción permanecen fuera del estado del frontend.

El backend mantiene el archivo de audio temporal y realiza el procesamiento. El frontend trabaja con un `captureId` opaco: no construye rutas a partir del ID, no lee el WAV y no envía bytes de audio.

## Flujo

1. **Iniciar captura** — llamar a `POST /api/captures`; guardar el `captureId` devuelto en estado de UI.
2. **Mostrar estado/nivel** — consultar `GET /api/captures/{captureId}` mientras la captura esté activa. El nivel, si está presente, es un número entre 0 y 1.
3. **Detener captura** — llamar a `POST /api/captures/{captureId}/stop`. La respuesta `ready` indica que el servidor terminó el WAV temporal.
4. **Procesar y crear** — llamar una vez a `POST /api/meetings` con `captureId` y metadatos. No enviar el audio, la transcripción, el resumen ni los pendientes.
5. **Consultar procesamiento** — la respuesta `202` incluye un `operationId`. Consultar `GET /api/operations/{operationId}` hasta `completed` o `failed`.
6. **Mostrar y refrescar** — al completarse, mostrar la reunión devuelta y actualizar la lista local/query cache de reuniones.

Estados terminales de una operación: `completed` y `failed`. No asumir que la creación fue exitosa hasta recibir `completed`.

## Payloads y tipos

### Iniciar captura

`POST /api/captures` no requiere body.

```ts
type CaptureStarted = {
  captureId: string;
  status: 'capturing';
  startedAt: string;
};
```

### Estado de captura

```ts
type CaptureStatus =
  | 'starting'
  | 'capturing'
  | 'stopping'
  | 'ready'
  | 'processing'
  | 'consumed'
  | 'failed'
  | 'expired';

type CaptureState = {
  captureId: string;
  status: CaptureStatus;
  level?: number; // 0..1
  updatedAt: string;
};
```

### Crear reunión

`POST /api/meetings`:

```ts
type CreateMeetingRequest = {
  captureId: string;
  title?: string | null;
  meetingDate?: string | null; // RFC 3339 con zona horaria
};
```

Respuesta `202`:

```ts
type CreateMeetingAccepted = {
  operationId: string;
  status: 'queued';
};
```

### Operación y resultado

```ts
type ActionItem = {
  id: string;
  meetingId: string;
  task: string;
  assignee: string | null;
  dueDateText: string | null;
};

type Meeting = {
  id: string;
  title: string | null;
  meetingDate: string | null;
  summary: string;
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
};

type OperationStatus =
  | 'queued'
  | 'transcribing'
  | 'summarizing'
  | 'completed'
  | 'failed';

type Operation =
  | { operationId: string; status: Exclude<OperationStatus, 'completed' | 'failed'> }
  | { operationId: string; status: 'completed'; meeting: Meeting }
  | {
      operationId: string;
      status: 'failed';
      error: { code: string; message: string };
    };
```

`dueDateText` puede contener una fecha relativa tal como se dijo en la reunión. No asumir que es una fecha ISO ni convertirla en el frontend.

## Consultas de reuniones

- `GET /api/meetings?limit=20&cursor=...` carga la lista paginada.
- `GET /api/meetings/{meetingId}` carga el detalle.
- `PATCH /api/meetings/{meetingId}` edita título, fecha o resumen.
- `POST /api/meetings/{meetingId}/action-items` agrega un pendiente.
- `PATCH /api/meetings/{meetingId}/action-items/{actionItemId}` edita un pendiente.

Invalidar/refrescar las consultas de TanStack Query después de editar o crear recursos. No suponer que el borrado está disponible: todavía no forma parte del contrato propuesto.

## Errores para la interfaz

El backend devuelve:

```json
{
  "error": {
    "code": "CAPTURE_NOT_READY",
    "message": "La captura aún no está lista para procesar."
  }
}
```

Interpretación sugerida:

- `400`: corregir datos de la solicitud.
- `404`: el recurso no existe o expiró; ofrecer iniciar otra captura.
- `409`: captura ocupada o ya consumida; evitar doble envío y mostrar estado recuperable.
- `502` / `503`: procesamiento o dependencia falló; mostrar error y permitir una nueva captura según el estado que devuelva la API.

El cliente debe manejar los códigos estables; el texto de `message` es para mostrar y puede cambiar. No mostrar errores internos, rutas, prompts ni detalles que expongan datos de la reunión.

## Comportamiento y privacidad

- Mantener el `captureId` solo durante el flujo activo y tratarlo como opaco.
- Deshabilitar acciones duplicadas mientras captura o procesa.
- Sondear el estado solo mientras sea necesario y detener el sondeo al llegar a un estado terminal.
- No escribir audio, transcripciones, claves de proveedor ni respuestas sensibles en logs del navegador.
- La API del POC usa un estado en memoria y sondeo de interfaz; la propuesta separa el estado temporal de captura/operación de las reuniones persistidas.
- El uso de OpenAI, los permisos de captura, las plataformas admitidas y la retención todavía requieren aprobación. Esta guía describe el contrato, no autoriza ese tratamiento.

## Pendientes para sincronizar con backend

Host/puerto local, expiración de captura y operación, vigencia de `Idempotency-Key`, política de reintento, detalles finales de paginación y política de eliminación deben definirse antes de cerrar la implementación.
