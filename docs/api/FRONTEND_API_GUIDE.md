# MeetingNotes — guía de integración para frontend

**Estado:** guía alineada con el [contrato API del backend v1](API_CONTRACT.md) y el backend MN-08. La aplicación web de producto aún no está implementada.

## Responsabilidad del frontend

El frontend presenta el aviso de consentimiento, controla la captura local, permite elegir español o inglés para cada reunión, muestra el estado del procesamiento y presenta el historial local. El backend realiza la captura nativa, transcribe y genera las notas, y guarda el historial en SQLite.

El frontend trabaja con un **captureId** opaco. No construye rutas de archivos, no lee el audio y no envía audio ni transcripciones. La captura combina audio del sistema y micrófono en una sola pista. Las capturas cuyo procesamiento falla permanecen disponibles localmente para reintentar o eliminar, incluso después de cerrar y volver a abrir la aplicación.

## Flujo

1. **Iniciar captura** — llamar a **POST /api/captures** y guardar el **captureId** devuelto. La respuesta incluye el estado actual; si es `failed`, mostrar el error y no intentar detenerla.
2. **Mostrar estado o nivel** — consultar **GET /api/captures/{captureId}** hasta que pase a `capturing`; el nivel, si está presente, es un número entre 0 y 1. Si pasa a `failed`, mostrar el error.
3. **Detener captura** — cuando el estado sea `capturing`, llamar a **POST /api/captures/{captureId}/stop**. La respuesta **ready** indica que el backend dejó el archivo combinado listo.
4. **Iniciar procesamiento** — solicitar el idioma y llamar a **POST /api/meetings** con **captureId** y **outputLanguage**. No enviar audio, transcripción, resumen ni pendientes. La API devuelve HTTP 202 con el `captureId` y estado.
5. **Consultar progreso** — sondear **GET /api/captures/{captureId}** hasta `completed` o `failed`. En `completed`, usar el `meetingId` devuelto para cargar **GET /api/meetings/{meetingId}** y actualizar historial/caché.
6. **Recuperar fallos** — al abrir la aplicación, consultar **GET /api/captures?status=failed&limit=20&cursor=...**. Reintentar con un POST manual a **POST /api/meetings** usando el mismo `captureId`, o eliminar con **DELETE /api/captures/{captureId}**.

No hay un recurso Operation separado: el `captureId` permite consultar el trabajo durable. Un POST repetido durante el procesamiento devuelve el estado actual; tras completar devuelve la reunión existente, sin duplicarla. Si falla el procesamiento, el backend descarta la transcripción y conserva el audio. El sondeo usa backoff en el cliente según la implementación; el servidor no configura reintentos automáticos.

## Payloads y tipos

### Iniciar captura

**POST /api/captures** no requiere body.

    // POST /api/captures devuelve el estado durable actual, que puede ser failed si no pudo arrancar.
    type CaptureStarted = CaptureState;

### Estado de captura

    type CaptureStatus =
      | 'starting'
      | 'capturing'
      | 'stopping'
      | 'ready'
      | 'transcribing'
      | 'summarizing'
      | 'completed'
      | 'failed';

    type CaptureState = {
      captureId: string;
      status: CaptureStatus;
      startedAt: string;
      level?: number; // 0..1
      updatedAt: string;
      meetingId?: string; // presente cuando status === 'completed'
      completedAt?: string;
      failedAt?: string;
      failureCode?: string;
    };

No asumir expiración automática. El resultado completado puede consultarse por `meetingId`; el backend conserva metadata de estado pero elimina el audio.

### Crear reunión

**POST /api/meetings**:

    type OutputLanguage = 'es' | 'en';

    type CreateMeetingRequest = {
      captureId: string;
      outputLanguage: OutputLanguage;
      title?: string;
    };

    type ProcessAccepted = {
      captureId: string;
      status: 'transcribing' | 'summarizing';
    };

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
      outputLanguage: OutputLanguage;
      summary: string;
      actionItems: ActionItem[];
      createdAt: string;
      updatedAt: string;
    };

**captureId** y **outputLanguage** son obligatorios. El inicio devuelve `ProcessAccepted` con HTTP 202. **title** es opcional. `meetingDate` no forma parte de v1. El estado completado expone `meetingId`; la reunión se carga con GET.

Las tareas deben representar compromisos explícitos. No inventar tareas, responsables ni fechas. **dueDateText** puede contener una fecha relativa tal como se dijo; el frontend no debe asumir que es una fecha ISO ni convertirla en fecha calendario.

### Capturas fallidas

    type FailedCapture = {
      captureId: string;
      status: 'failed';
      startedAt: string;
      failedAt: string;
      failureCode: string;
    };

    type FailedCapturesResponse = {
      items: FailedCapture[];
      nextCursor: string | null;
    };

La lista usa `limit=20` por defecto y cursor opaco. Nunca incluye audio, transcripción, ruta local ni mensaje interno del proveedor. Para reintentar, enviar un POST manual a **POST /api/meetings** con el mismo **captureId**; para eliminar el archivo local, llamar a **DELETE /api/captures/{captureId}**.

## Consultas y edición de reuniones

- **GET /api/meetings?limit=20&cursor=...** carga el historial local paginado.
- **GET /api/meetings/{meetingId}** carga el detalle.
- **PATCH /api/meetings/{meetingId}** edita el título y el resumen.
- **POST /api/meetings/{meetingId}/action-items** agrega un pendiente.
- **PATCH /api/meetings/{meetingId}/action-items/{actionItemId}** edita un pendiente.
- **DELETE /api/meetings/{meetingId}** elimina la reunión y todos sus pendientes.

No hay ruta para borrar pendientes individuales; eliminar una reunión elimina todos sus pendientes. Invalidar o refrescar las consultas de TanStack Query después de crear, editar o eliminar recursos.

## Errores para la interfaz

Formato común:

    {
      "error": {
        "code": "CAPTURE_NOT_READY",
        "message": "La captura aún no está lista para procesar."
      }
    }

Interpretación sugerida:

- **400:** corregir los datos de la solicitud.
- **403:** origen de navegador ausente o no permitido.
- **404:** el recurso no existe; no implica expiración automática.
- **409:** parámetros incompatibles o captura en estado que no permite la acción; refrescar estado antes de actuar.
- **503:** falta la configuración de OpenAI antes de iniciar. Si un trabajo ya aceptado falla, el HTTP original sigue siendo 202 y el sondeo devuelve `status: 'failed'` con un `failureCode`; refrescar la cola para ofrecer reintentar o eliminar el audio.
- **500:** error local inesperado; consultar el historial y la cola de fallidas antes de volver a enviar para reducir el riesgo de duplicar una reunión.

El cliente debe basarse en códigos estables, no en texto libre. No mostrar errores internos, rutas, claves, prompts ni detalles que expongan datos de la reunión.

## Comportamiento y privacidad

- Mantener el **captureId** como valor opaco. No depender solo del estado en memoria para recuperar fallos: cargar la lista de fallidas desde la API al iniciar la aplicación.
- Deshabilitar acciones duplicadas mientras captura o procesa. El backend debe permitir un nuevo intento con el mismo **captureId** tras un fallo.
- Detener el sondeo al llegar a `completed` o `failed`; en `completed`, consultar la reunión usando `meetingId`.
- La API acepta solo los orígenes `http://127.0.0.1:5173` y `http://localhost:5173`; rechaza origen ausente o diferente. El frontend usa el proxy local de Vite para `/api`.
- El resultado estructurado puede quedar temporalmente en SQLite, no visible por API, mientras se elimina el WAV. Nunca se conserva la transcripción. Si el borrado falla, el backend marca la captura como `failed` y mantiene el audio reintentable.
- No escribir audio, transcripciones, claves de proveedor ni respuestas sensibles en logs del navegador.
- Mantener el aviso visible y persistente según el alcance aprobado. El aviso no comprueba por sí mismo el consentimiento de participantes.
- No hay cuentas, login ni sincronización en v1. El historial es local a cada computadora.
- El uso de OpenAI y el tratamiento de audio descrito en el alcance v1 están aprobados. La eliminación local no elimina datos que el proveedor pudiera conservar conforme a los controles vigentes de la cuenta.

## Detalles de cliente aún por definir

La SPA aún debe elegir su intervalo/backoff de sondeo y conectar las mutaciones a TanStack Query. El contrato ya fija los códigos de fallo, el orden y cursor del historial, el `202` con sondeo por `captureId`, la exclusión de `meetingDate`, la lista paginada de fallidas y la política de reintento manual.
